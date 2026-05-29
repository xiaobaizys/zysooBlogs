import { postStore } from '../db.js';
import { formatDate, escapeHtml, debounce } from '../utils.js';
import { renderNavbar } from '../app.js';

export async function renderSearch(container) {
    const searchHtml = `
        <div class="search-hero">
            <div class="search-icon-wrap">🔍</div>
            <h2>搜索文章</h2>
            <p class="search-subtitle">按标题或内容搜索你感兴趣的文章</p>
            <input type="search" id="searchInput" placeholder="输入关键词..." autofocus class="search-input-large">
        </div>
        <div id="searchResults" class="search-results"></div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${searchHtml}</div>`;
    
    const input = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('searchResults');
    const performSearch = debounce(async () => {
        const keyword = input.value.trim();
        if (!keyword) { resultsDiv.innerHTML = ''; return; }
        const results = await postStore.search(keyword);
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>未找到包含「' + escapeHtml(keyword) + '」的文章</p></div>';
            return;
        }
        resultsDiv.innerHTML = `
            <p style="color:var(--text-muted);margin-bottom:1rem;">找到 <strong>${results.length}</strong> 篇相关文章</p>
            ${results.map(post => `
                <div class="post-card" style="animation:fadeUp 0.3s ease both">
                    <div class="post-card-body">
                        <h3 class="post-title"><a href="/post/${post.slug}">${escapeHtml(post.title)}</a></h3>
                        <div class="post-meta">${formatDate(post.createdAt)}</div>
                        <p class="post-summary">${escapeHtml(post.content.substring(0, 150))}...</p>
                    </div>
                </div>
            `).join('')}
        `;
    }, 300);
    input.addEventListener('input', performSearch);
    input.focus();
}
