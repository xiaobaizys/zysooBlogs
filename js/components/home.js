import { postStore } from '../db.js';
import { formatDate, escapeHtml } from '../utils.js';
import { SITE_CONFIG } from '../config.js';
import { renderNavbar } from '../app.js';

let currentPage = 1;
let currentTag = null;

export async function renderHome(container, params = {}) {
    currentTag = params.tag || null;
    currentPage = 1;
    await renderPage(container);
}

async function renderPage(container) {
    const posts = await postStore.getPublished(currentPage, SITE_CONFIG.postsPerPage, currentTag);
    const totalPosts = (await postStore.getPublished(1, 9999, currentTag)).length;
    const totalPages = Math.ceil(totalPosts / SITE_CONFIG.postsPerPage);

    const heroHtml = !currentTag ? `
        <section class="home-hero">
            <h1 class="hero-title">${SITE_CONFIG.name}</h1>
            <p class="hero-desc">${SITE_CONFIG.description}</p>
            <div class="hero-stats">
                <span><strong>${totalPosts}</strong> 篇文章</span>
            </div>
        </section>
    ` : '';

    const postsHtml = posts.map((post, i) => `
        <article class="post-card reveal" style="animation-delay:${i * 0.05}s">
            ${post.coverImage ? `<img src="${post.coverImage}" alt="cover" loading="lazy" class="post-card-cover">` : ''}
            <div class="post-card-body">
                <h2 class="post-title">
                    <a href="/post/${post.slug}">${escapeHtml(post.title)}</a>
                </h2>
                <div class="post-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(post.createdAt)}</span>
                    <span><i class="far fa-clock"></i> ${Math.ceil(post.content.length / 800)} 分钟</span>
                    <span><i class="far fa-eye"></i> ${localStorage.getItem('views_' + post.slug) || 0}</span>
                </div>
                <p class="post-summary">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                <div class="post-tags">
                    ${post.tags.map(tag => `<a href="/tag/${tag}" class="tag">${escapeHtml(tag)}</a>`).join('')}
                </div>
            </div>
        </article>
    `).join('');

    let paginationHtml = '';
    if (totalPages > 1) {
        let btns = '';
        for (let i = 1; i <= totalPages; i++) {
            btns += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHtml = `<nav class="pagination">${btns}</nav>`;
    }

    const headerHtml = currentTag ? `<h2 style="margin-bottom:1.5rem;"># ${escapeHtml(currentTag)} 的文章</h2>` : '';

    container.innerHTML = renderNavbar() + `
        <div id="pageContent">
            ${heroHtml}
            ${headerHtml}
            <div class="post-list">
                ${postsHtml || '<div class="empty-state"><div class="empty-icon">📝</div><p>还没有文章</p><a href="/editor" class="btn btn-primary">写第一篇</a></div>'}
            </div>
            ${paginationHtml}
        </div>
    `;

    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderPage(container);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}
