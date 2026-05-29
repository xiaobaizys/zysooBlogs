import { postStore, commentStore } from '../db.js';
import { renderNavbar } from '../app.js';
import { formatDate } from '../utils.js';

function getTotalViews() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('views_')) total += parseInt(localStorage.getItem(key) || '0');
    }
    return total || 0;
}

function getPostViews(slug) {
    return parseInt(localStorage.getItem('views_' + slug) || '0');
}

function renderBarChart(data, options = {}) {
    const { width = 600, height = 200, barColor = 'var(--accent)', labelFn, valueFn } = options;
    if (data.length === 0) return '<p style="color:var(--text-muted);text-align:center;padding:2rem;">暂无数据</p>';

    const max = Math.max(...data.map(valueFn || (d => d.value)), 1);
    const barH = Math.min(32, (height - 40) / data.length);
    const totalH = data.length * (barH + 12) + 30;
    const labelW = 120;

    const bars = data.map((d, i) => {
        const val = valueFn ? valueFn(d) : d.value;
        const label = labelFn ? labelFn(d) : d.label;
        const w = Math.max(4, (val / max) * (width - labelW - 60));
        const y = 20 + i * (barH + 12);
        return `
            <g>
                <text x="${labelW - 8}" y="${y + barH / 2 + 5}" text-anchor="end" fill="var(--text-secondary)" font-size="12" font-family="var(--font-body)">${label}</text>
                <rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="4" fill="${barColor}" opacity="0.85">
                    <animate attributeName="width" from="0" to="${w}" dur="0.6s" fill="freeze"/>
                </rect>
                <text x="${labelW + w + 6}" y="${y + barH / 2 + 5}" fill="var(--text-muted)" font-size="11" font-family="var(--font-body)">${val.toLocaleString()}</text>
            </g>
        `;
    }).join('');

    return `
        <svg viewBox="0 0 ${width} ${totalH}" width="100%" style="max-width:${width}px;" xmlns="http://www.w3.org/2000/svg">
            ${bars}
        </svg>
    `;
}

export async function renderDashboard(container) {
    const allPosts = await postStore.getAll();
    const published = allPosts.filter(p => p.status === 'published');
    const drafts = allPosts.filter(p => p.status === 'draft');
    const totalViews = getTotalViews();
    const tags = await postStore.getAllTags();

    let totalComments = 0;
    for (const p of published) totalComments += await commentStore.count(p.slug);

    const stats = [allPosts.length, published.length, drafts.length, totalViews, totalComments];
    const STAT_ICONS = ['📄', '📤', '📥', '👁️', '💬'];
    const STAT_LABELS = ['总文章数', '已发布', '草稿', '总阅读量', '总评论数'];

    // 阅读量排行
    const viewRanking = published
        .map(p => ({ slug: p.slug, title: p.title, views: getPostViews(p.slug) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);

    // 标签频次排行
    const tagRanking = tags
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const html = `
        <div class="dash-hero">
             <h2>仪表盘</h2>
             <p class="dash-subtitle">博客数据实时统计</p>
        </div>

        <div class="stats-grid">
            ${stats.map((v, i) => `
                <div class="stat-card" style="animation:fadeUp 0.4s ease both;animation-delay:${i*0.06}s">
                    <div class="stat-icon">${STAT_ICONS[i]}</div>
                    <div class="stat-number">${typeof v === 'number' ? v.toLocaleString() : v}</div>
                    <div class="stat-label">${STAT_LABELS[i]}</div>
                </div>
            `).join('')}
        </div>

        <div class="chart-row">
            <div class="chart-card" style="animation:fadeUp 0.4s ease both;animation-delay:0.3s">
                <h3 class="chart-title">📊 文章阅读量排行</h3>
                ${renderBarChart(viewRanking, {
                    barColor: 'var(--accent)',
                    labelFn: d => d.title.length > 10 ? d.title.slice(0, 10) + '...' : d.title,
                    valueFn: d => d.views
                })}
            </div>
            <div class="chart-card" style="animation:fadeUp 0.4s ease both;animation-delay:0.4s">
                <h3 class="chart-title">🏷️ 热门标签</h3>
                ${renderBarChart(tagRanking, {
                    barColor: '#3b82f6',
                    labelFn: d => d.name,
                    valueFn: d => d.count
                })}
            </div>
        </div>

        <div class="recent-section" style="animation:fadeUp 0.4s ease both;animation-delay:0.5s">
            <h3 style="font-family:var(--font-display);margin-bottom:1rem;">最近文章</h3>
            ${allPosts.slice(0, 5).map((p, i) => `
                <div class="recent-post-item">
                    <div class="recent-post-main">
                        <a href="/post/${p.slug}" class="recent-post-title">${p.title}</a>
                        <span class="recent-post-meta">${formatDate(p.createdAt)} · ${p.status === 'published' ? '已发布' : '草稿'} · ${getPostViews(p.slug)} 阅读</span>
                    </div>
                    <a href="/editor/${p.id}" class="btn btn-secondary btn-small">编辑</a>
                </div>
            `).join('')}
        </div>
    `;
    container.innerHTML = renderNavbar() + `<div id="pageContent">${html}</div>`;
}
