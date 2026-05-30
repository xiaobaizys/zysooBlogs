import { postStore, db, commentStore } from '../db.js';
import { formatDate, escapeHtml } from '../utils.js';
import { navigateTo } from '../router.js';
import { renderNavbar } from '../app.js';

export async function renderManage(container) {
    const posts = await postStore.getAll();
    const rows = posts.map(post => `
        <tr>
            <td>${escapeHtml(post.title)}</td>
            <td><span class="status-badge status-${post.status}">${post.status === 'published' ? '已发布' : '草稿'}</span></td>
            <td>${formatDate(post.createdAt)}</td>
            <td class="actions-cell">
                <button class="btn btn-secondary btn-small edit-btn" data-id="${post.id}">编辑</button>
                <button class="btn btn-danger btn-small delete-btn" data-id="${post.id}">删除</button>
            </td>
        </tr>
    `).join('');
    
    const html = `
        <div class="manage-header">
            <h2>文章管理</h2>
            <div class="manage-toolbar">
                <button id="exportBtn" class="btn btn-secondary"><i class="fas fa-download"></i> 导出</button>
                <input type="file" id="importFile" accept=".json" style="display:none;">
                <button id="importBtn" class="btn btn-secondary"><i class="fas fa-upload"></i> 导入</button>
            </div>
        </div>
        <div class="table-wrap">
        <table class="manage-table">
            <thead><tr><th>标题</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" class="empty-cell">暂无文章，<a href="/editor">去写一篇</a></td></tr>'}</tbody>
        </table>
        </div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${html}</div>`;
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(`/editor/${btn.dataset.id}`));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const { showConfirmModal } = await import('../auth.js');
            const confirmed = await showConfirmModal('删除文章', '确定要删除这篇文章吗？此操作不可撤销。');
            if (confirmed) {
                await postStore.delete(parseInt(btn.dataset.id));
                renderManage(container);
            }
        });
    });
    document.getElementById('exportBtn')?.addEventListener('click', async () => {
        const allPosts = await postStore.getAll();
        const allComments = await commentStore.getAll();
        
        // 确保导出的数据包含所有必要字段，并且不包含内部 ID
        const exportPosts = allPosts.map(post => ({
            title: post.title,
            slug: post.slug,
            content: post.content,
            tags: post.tags || [],
            coverImage: post.coverImage || '',
            status: post.status || 'draft',
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        }));
        
        // 导出评论数据
        const exportComments = allComments.map(comment => ({
            postSlug: comment.postSlug,
            author: comment.author,
            content: comment.content,
            createdAt: comment.createdAt
        }));
        
        // 导出完整数据
        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            posts: exportPosts,
            comments: exportComments
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile')?.addEventListener('change', async () => {
        const file = document.getElementById('importFile').files[0];
        if (!file) return;
        const text = await file.text();
        const imported = JSON.parse(text);
        const { showConfirmModal } = await import('../auth.js');
        const confirmed = await showConfirmModal('导入数据', '导入将替换现有所有文章和评论，确定继续？');
        if (confirmed) {
            await db.posts.clear();
            await db.comments.clear();
            
            // 兼容旧格式（直接是文章数组）和新格式（包含 posts 和 comments）
            let importedPosts = [];
            let importedComments = [];
            
            if (Array.isArray(imported)) {
                // 旧格式，只有文章
                importedPosts = imported;
            } else if (imported.posts && Array.isArray(imported.posts)) {
                // 新格式
                importedPosts = imported.posts;
                importedComments = imported.comments || [];
            }
            
            // 导入文章
            for (let p of importedPosts) {
                // 为导入的文章创建新记录，确保所有字段都被正确保存
                const newPost = {
                    title: p.title,
                    slug: p.slug,
                    content: p.content,
                    tags: p.tags || [],
                    coverImage: p.coverImage || '',
                    status: p.status || 'draft',
                    createdAt: p.createdAt || new Date().toISOString(),
                    updatedAt: p.updatedAt || new Date().toISOString()
                };
                // 移除旧 ID，让数据库自动生成新 ID
                delete newPost.id;
                await db.posts.add(newPost);
            }
            
            // 导入评论
            for (let c of importedComments) {
                const newComment = {
                    postSlug: c.postSlug,
                    author: c.author,
                    content: c.content,
                    createdAt: c.createdAt || new Date().toISOString()
                };
                // 移除旧 ID
                delete newComment.id;
                await db.comments.add(newComment);
            }
            
            alert('导入成功');
            renderManage(container);
        }
    });
}
