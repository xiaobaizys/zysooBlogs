import { initRouter } from './router.js';
import { initSampleData, db } from './db.js';
import { isFirstVisit, setNewPassword, showLoginModal } from './auth.js';
import { SITE_CONFIG } from './config.js';

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    window.updateThemeToggle = () => {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.innerHTML = theme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    };
    window.toggleTheme = () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        window.updateThemeToggle();
    };
    window.updateThemeToggle();
}

export function renderNavbar() {
    return `
        <nav class="navbar">
            <a href="/" class="logo">${SITE_CONFIG.name}</a>
            <div class="nav-links">
                <a href="/">文章</a>
                <a href="/tags">标签</a>
                <a href="/search">搜索</a>
                <a href="/about">关于</a>
                <a href="/dashboard">仪表盘</a>
                <a href="/manage">管理</a>
                <a href="/editor">撰写</a>
                <button id="themeToggleBtn" class="theme-toggle" aria-label="切换主题">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </nav>
        <div id="pageContent"></div>
    `;
}

async function start() {
    await initSampleData();
    initTheme();
    if (await isFirstVisit()) {
        import('./auth.js').then(({ showSetupPasswordModal }) => {
            showSetupPasswordModal();
        });
    }
    initRouter();
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#themeToggleBtn')) {
        window.toggleTheme();
    }
});

// ========== 全局 UI ==========
// 阅读进度条
window.addEventListener('scroll', () => {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = scrollHeight > 0 ? (scrollTop / scrollHeight * 100) + '%' : '0';
    // 回到顶部按钮
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('visible', scrollTop > 400);
}, { passive: true });

// 滚动触发淡入
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
// 动态 DOM 也需要 observe（路由切换后）
new MutationObserver(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });

// 回到顶部点击
document.addEventListener('click', (e) => {
    if (e.target.closest('#backToTop')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// 全局快捷键
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        import('./router.js').then(({ navigateTo }) => navigateTo('/search'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        import('./router.js').then(({ navigateTo }) => navigateTo('/editor'));
    }
});

start();
