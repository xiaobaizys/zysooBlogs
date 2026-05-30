import { postStore } from '../db.js';
import { formatDate, estimateReadingTime, escapeHtml } from '../utils.js';
import { renderNavbar } from '../app.js';
import { renderComments } from './comments.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.es.js';
import hljs from 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/highlight.min.js';

// 配置 marked 使用 highlight.js
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return code;
    },
    breaks: true
});

export async function renderPostDetail(container, params) {
    const slug = params.slug;
    const post = await postStore.getBySlug(slug);
    if (!post || post.status !== 'published') {
        container.innerHTML = renderNavbar() + '<div id="pageContent"><h1>文章不存在</h1></div>';
        return;
    }

    // 更新页面 SEO
    document.title = post.title + ' - zysooBlogs';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.content = post.content.substring(0, 160).replace(/\n/g, ' ');

    // 阅读量 +1
    let views = parseInt(localStorage.getItem('views_' + slug) || '0') + 1;
    localStorage.setItem('views_' + slug, views);
    // 更新总计
    let totalViews = parseInt(localStorage.getItem('totalViews') || '0') + 1;
    localStorage.setItem('totalViews', totalViews);

    const htmlContent = DOMPurify.sanitize(marked.parse(post.content));
    const tocHtml = generateTOC(post.content);

    // 相关文章
    const related = await getRelatedPosts(post);

    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(post.title);

    const detailHtml = `
        <article class="post-detail">
            <h1>${escapeHtml(post.title)}</h1>
            <div class="post-meta">
                <span><i class="far fa-calendar-alt"></i> ${formatDate(post.createdAt)}</span>
                <span><i class="far fa-clock"></i> 阅读 ${estimateReadingTime(post.content)} 分钟</span>
                <span><i class="far fa-eye"></i> ${views} 次阅读</span>
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<a href="/tag/${tag}" class="tag">${escapeHtml(tag)}</a>`).join('')}
            </div>
            ${tocHtml}
            ${post.coverImage ? `<img src="${post.coverImage}" alt="cover" style="max-width:100%; border-radius:var(--radius-md); margin:1.5rem 0;">` : ''}
            <div class="post-content">${htmlContent}</div>
        </article>

        <div class="share-buttons">
            <button class="share-btn" title="复制链接" onclick="navigator.clipboard.writeText(window.location.href);alert('链接已复制！')"><i class="fas fa-link"></i></button>
            <a class="share-btn" href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener" title="分享到 Twitter"><i class="fab fa-twitter"></i></a>
            <a class="share-btn" href="https://service.weibo.com/share/share.php?url=${shareUrl}&title=${shareTitle}" target="_blank" rel="noopener" title="分享到微博"><i class="fab fa-weibo"></i></a>
        </div>

        ${related.length > 0 ? `
        <section class="related-section">
            <h3 class="related-title">相关文章</h3>
            <div class="related-grid">
                ${related.map(r => `
                    <div class="related-card">
                        <a href="/post/${r.slug}" class="related-card-title">${escapeHtml(r.title)}</a>
                        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">${formatDate(r.createdAt)}</div>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <div id="commentsArea"></div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${detailHtml}</div>`;

    // TOC 锚点：给所有 h2/h3 加 id
    document.querySelectorAll('.post-content h2, .post-content h3').forEach(el => {
        el.id = slugifyId(el.textContent);
    });
    // TOC 链接点击滚动
    document.querySelectorAll('.toc-list a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            const target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.style.transition = 'background 0.3s';
                target.style.background = 'var(--accent-subtle)';
                setTimeout(() => { target.style.background = ''; }, 1500);
            }
        });
    });

    // 评论区
    const commentsArea = document.getElementById('commentsArea');
    if (commentsArea) await renderComments(commentsArea, slug);
}

// 生成 TOC
function generateTOC(content) {
    const lines = content.split('\n');
    const headings = [];
    lines.forEach(line => {
        const m2 = line.match(/^## (.+)/);
        const m3 = line.match(/^### (.+)/);
        if (m2) headings.push({ level: 2, text: m2[1].trim() });
        if (m3) headings.push({ level: 3, text: m3[1].trim() });
    });
    if (headings.length < 2) return '';

    return `
        <div class="toc">
            <div class="toc-title">📑 目录</div>
            <ul class="toc-list">
                ${headings.map(h => `
                    <li class="${h.level === 3 ? 'toc-h3' : ''}">
                        <a href="#${slugifyId(h.text)}">${escapeHtml(h.text)}</a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function slugifyId(text) {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
}

// 相关文章推荐
async function getRelatedPosts(post) {
    const all = await postStore.getPublished(1, 100);
    return all
        .filter(p => p.slug !== post.slug && p.tags.some(t => post.tags.includes(t)))
        .slice(0, 3)
        .map(p => ({ slug: p.slug, title: p.title, createdAt: p.createdAt }));
}
