import { postStore } from '../db.js';
import { slugify, escapeHtml } from '../utils.js';
import { navigateTo } from '../router.js';
import { renderNavbar } from '../app.js';

let easyMDE = null;

export async function renderPostEditor(container, params) {
    const postId = params.id ? parseInt(params.id) : null;
    let post = postId ? await postStore.getById(postId) : { title: '', content: '', tags: [], coverImage: '', status: 'draft' };
    
    const editorHtml = `
        <div class="editor-container">
            <input type="text" id="titleInput" placeholder="文章标题" value="${escapeHtml(post.title)}">
            <input type="text" id="tagsInput" placeholder="标签，用英文逗号分隔" value="${post.tags.join(',')}">
            
            <div class="cover-upload-area" id="coverUpload" title="点击上传封面图（也可粘贴URL到下方）">
                ${post.coverImage ? `<img src="${post.coverImage}" class="cover-preview" id="coverPreviewImg">` : '<div id="coverPreviewImg" style="display:none;"></div>'}
                <div>📷 点击上传封面图（或粘贴 URL）</div>
                <input type="file" id="coverFileInput" accept="image/*" style="display:none;">
            </div>
            <input type="text" id="coverInput" placeholder="或粘贴封面图URL" value="${post.coverImage || ''}">
            
            <select id="statusSelect">
                <option value="draft" ${post.status === 'draft' ? 'selected' : ''}>草稿</option>
                <option value="published" ${post.status === 'published' ? 'selected' : ''}>发布</option>
            </select>
            <textarea id="markdownEditor">${escapeHtml(post.content)}</textarea>
            <div style="display:flex;gap:0.5rem;">
                <button id="savePostBtn" class="btn btn-primary">保存文章</button>
                <button id="previewBtn" class="btn btn-secondary">预览</button>
                <div id="previewPanel" class="preview-panel" style="display:none;"></div>
            </div>
        </div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${editorHtml}</div>`;
    
    if (typeof EasyMDE !== 'undefined') {
        easyMDE = new EasyMDE({ element: document.getElementById('markdownEditor'), spellChecker: false });
    } else {
        await import('https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.js');
        easyMDE = new EasyMDE({ element: document.getElementById('markdownEditor'), spellChecker: false });
    }
    
    document.getElementById('savePostBtn').onclick = async () => {
        const title = document.getElementById('titleInput').value.trim();
        if (!title) return alert('请填写标题');
        try {
            const updatedPost = {
                id: postId,
                title: title,
                slug: postId ? post.slug : slugify(title) + '-' + Date.now(),
                content: easyMDE.value(),
                tags: document.getElementById('tagsInput').value.split(',').map(s=>s.trim()).filter(Boolean),
                coverImage: document.getElementById('coverInput').value,
                status: document.getElementById('statusSelect').value
            };
            console.log('保存文章:', updatedPost.title, 'id:', updatedPost.id, 'status:', updatedPost.status);
            await postStore.save(updatedPost);
            alert('保存成功！');
            navigateTo('/manage');
        } catch (err) {
            console.error('保存失败:', err);
            alert('保存失败: ' + err.message + '\n请刷新页面后重试（Ctrl+Shift+R）');
        }
    };

    // 图片上传
    document.getElementById('coverUpload').addEventListener('click', () => {
        document.getElementById('coverFileInput').click();
    });
    document.getElementById('coverFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            document.getElementById('coverInput').value = dataUrl;
            const preview = document.getElementById('coverPreviewImg');
            if (preview) { preview.style.display = 'block'; preview.outerHTML = `<img src="${dataUrl}" class="cover-preview" id="coverPreviewImg">`; }
        };
        reader.readAsDataURL(file);
    });
    // URL 变化时更新预览
    document.getElementById('coverInput').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const preview = document.getElementById('coverPreviewImg');
        if (url && url.startsWith('http') || url.startsWith('data:')) {
            if (preview) { preview.style.display = 'block'; preview.outerHTML = `<img src="${url}" class="cover-preview" id="coverPreviewImg">`; }
        } else if (preview) {
            preview.style.display = 'none';
        }
    });

    // 预览
    document.getElementById('previewBtn').addEventListener('click', async () => {
        const panel = document.getElementById('previewPanel');
        if (!panel) return;
        const content = easyMDE.value();
        const { marked } = await import('https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js');
        const { default: DOMPurify } = await import('https://cdn.jsdelivr.net/npm/dompurify/dist/purify.es.js');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            panel.innerHTML = DOMPurify.sanitize(marked.parse(content));
            panel.scrollIntoView({ behavior: 'smooth' });
        }
    });
}
