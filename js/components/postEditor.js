import { postStore } from '../db.js';
import { slugify, escapeHtml, debounce } from '../utils.js';
import { navigateTo } from '../router.js';
import { renderNavbar } from '../app.js';

let easyMDE = null;
let autoSaveTimer = null;
let currentDraftKey = null;

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
    
    currentDraftKey = postId ? `editor_draft_${postId}` : 'editor_draft_new';
    
    // 尝试加载草稿
    const savedDraft = localStorage.getItem(currentDraftKey);
    if (savedDraft && !postId) {
        try {
            const draft = JSON.parse(savedDraft);
            post = draft;
        } catch (e) {
            console.warn('Failed to load draft:', e);
        }
    }
    
    // 更新表单值
    if (savedDraft && !postId) {
        document.getElementById('titleInput').value = post.title || '';
        document.getElementById('tagsInput').value = (post.tags || []).join(',');
        document.getElementById('coverInput').value = post.coverImage || '';
        document.getElementById('statusSelect').value = post.status || 'draft';
    }
    
    if (typeof EasyMDE !== 'undefined') {
        easyMDE = new EasyMDE({ element: document.getElementById('markdownEditor'), spellChecker: false, initialValue: post.content });
    } else {
        await import('https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.js');
        easyMDE = new EasyMDE({ element: document.getElementById('markdownEditor'), spellChecker: false, initialValue: post.content });
    }
    
    // 自动保存功能
    const saveDraft = debounce(() => {
        const draft = {
            title: document.getElementById('titleInput').value,
            content: easyMDE.value(),
            tags: document.getElementById('tagsInput').value.split(',').map(s => s.trim()).filter(Boolean),
            coverImage: document.getElementById('coverInput').value,
            status: document.getElementById('statusSelect').value
        };
        localStorage.setItem(currentDraftKey, JSON.stringify(draft));
    }, 2000);
    
    // 安全地添加事件监听器 - 处理不同的 EasyMDE 版本
    if (easyMDE.codemirror && typeof easyMDE.codemirror.on === 'function') {
        easyMDE.codemirror.on('change', saveDraft);
    } else {
        // 备选方案：直接监听 textarea 的变化
        const textarea = document.getElementById('markdownEditor');
        if (textarea) {
            textarea.addEventListener('input', saveDraft);
        }
    }
    document.getElementById('titleInput').addEventListener('input', saveDraft);
    document.getElementById('tagsInput').addEventListener('input', saveDraft);
    document.getElementById('coverInput').addEventListener('input', saveDraft);
    document.getElementById('statusSelect').addEventListener('change', saveDraft);
    
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
            // 清除自动保存的草稿
            localStorage.removeItem(currentDraftKey);
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
            updateCoverPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    });
    // URL 变化时更新预览
    document.getElementById('coverInput').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        updateCoverPreview(url);
    });
    
    // 更新封面预览的函数
    function updateCoverPreview(url) {
        const previewContainer = document.getElementById('coverUpload');
        const existingPreview = document.getElementById('coverPreviewImg');
        
        // 移除现有的预览
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // 添加新的预览
        if (url && (url.startsWith('http') || url.startsWith('data:'))) {
            const newPreview = document.createElement('img');
            newPreview.src = url;
            newPreview.className = 'cover-preview';
            newPreview.id = 'coverPreviewImg';
            previewContainer.insertBefore(newPreview, previewContainer.firstChild);
        }
    }

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
