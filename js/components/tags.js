import { postStore } from '../db.js';
import { renderNavbar } from '../app.js';

export async function renderTags(container) {
    const tags = await postStore.getAllTags();
    if (tags.length === 0) {
        container.innerHTML = renderNavbar() + `
            <div id="pageContent">
                <h2>标签</h2>
                <div class="tags-empty">
                    <div class="tags-empty-icon">🏷️</div>
                    <p>还没有标签，去<a href="/editor">写一篇文章</a>并添加标签吧</p>
                </div>
            </div>
        `;
        return;
    }

    const maxCount = Math.max(...tags.map(t => t.count));
    const minCount = Math.min(...tags.map(t => t.count));

    const tagsHtml = tags
        .sort((a, b) => b.count - a.count)
        .map((tag, i) => {
            const ratio = maxCount === minCount ? 0.5 : (tag.count - minCount) / (maxCount - minCount);
            const fontSize = 0.85 + ratio * 1.3;
            const weight = 400 + Math.round(ratio * 400);
            const opacity = 0.7 + ratio * 0.3;
            const delay = i * 0.04;
            return `
                <a href="/tag/${tag.name}" class="tag-bubble"
                   style="font-size:${fontSize}rem;font-weight:${weight};opacity:${opacity};animation-delay:${delay}s">
                    <span class="tag-bubble-name">${tag.name}</span>
                    <span class="tag-bubble-count">${tag.count}</span>
                </a>
            `;
        }).join('');

    container.innerHTML = renderNavbar() + `
        <div id="pageContent">
            <div class="tags-header">
                <h2>标签云</h2>
                <p class="tags-subtitle">共 <strong>${tags.length}</strong> 个标签，${tags.reduce((s, t) => s + t.count, 0)} 篇文章</p>
            </div>
            <div class="tag-cloud">${tagsHtml}</div>
        </div>
    `;
}
