import { renderNavbar } from '../app.js';
import { SITE_CONFIG } from '../config.js';
import { postStore } from '../db.js';

export async function renderAbout(container) {
    const count = await db().count || 0;

    const html = `
        <div class="about-page">
            <div class="about-hero">
                <div class="about-logo">Z</div>
                <h2>${SITE_CONFIG.name}</h2>
                <p>${SITE_CONFIG.description}</p>
            </div>
            <div class="about-grid">
                <div class="about-card">
                    <div class="about-card-icon">📝</div>
                    <h3>写作自由</h3>
                    <p>基于 Markdown 编辑器，支持代码高亮、标签、封面图。所有数据保存在浏览器中，完全由你掌控。</p>
                </div>
                <div class="about-card">
                    <div class="about-card-icon">🚀</div>
                    <h3>零成本部署</h3>
                    <p>纯静态文件，可直接托管到 GitHub Pages。无需服务器、无需数据库、无需任何运维。</p>
                </div>
                <div class="about-card">
                    <div class="about-card-icon">🎨</div>
                    <h3>优雅设计</h3>
                    <p>编辑风格的字体层级 + 暖调配色 + 深色模式。阅读进度条、目录导航、代码高亮，细节打磨。</p>
                </div>
            </div>
            <div class="about-footer">
                <p>© ${new Date().getFullYear()} ${SITE_CONFIG.name} · Built with ❤️ and vanilla JS</p>
            </div>
        </div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${html}</div>`;

    async function db() {
        return { count: await postStore.getAll() };
    }
}
