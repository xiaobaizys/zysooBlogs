import { renderHome } from './components/home.js';
import { renderPostDetail } from './components/postDetail.js';
import { renderPostEditor } from './components/postEditor.js';
import { renderManage } from './components/manage.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTags } from './components/tags.js';
import { renderSearch } from './components/search.js';
import { renderAbout } from './components/about.js';
import { renderRSS } from './components/rss.js';
import { isLoggedIn, showLoginModal } from './auth.js';

const routes = [
    { path: '/', component: renderHome },
    { path: '/post/:slug', component: renderPostDetail },
    { path: '/editor', component: renderPostEditor, requireAuth: true },
    { path: '/editor/:id', component: renderPostEditor, requireAuth: true },
    { path: '/manage', component: renderManage, requireAuth: true },
    { path: '/dashboard', component: renderDashboard, requireAuth: true },
    { path: '/tags', component: renderTags },
    { path: '/tag/:tag', component: renderHome },
    { path: '/search', component: renderSearch },
    { path: '/about', component: renderAbout },
    { path: '/rss', component: renderRSS }
];

// 兼容 VS Code Live Server 等子目录部署场景
function normalizePath(pathname) {
    if (!pathname || pathname === '/') return '/';
    // 去掉尾部的 index.html
    pathname = pathname.replace(/\/index\.html$/, '/');
    // 去掉空路径
    if (pathname === '') return '/';
    return pathname;
}

function matchRoute(pathname) {
    for (let route of routes) {
        const pattern = route.path.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = pathname.match(regex);
        if (match) {
            const params = {};
            const keys = (route.path.match(/:[^/]+/g) || []).map(k => k.slice(1));
            keys.forEach((key, i) => { params[key] = match[i+1]; });
            return { component: route.component, params, requireAuth: route.requireAuth };
        }
    }
    return null;
}

export async function navigateTo(path, pushState = true) {
    if (pushState) {
        history.pushState(null, '', path);
    }
    await handleRoute(path);
}

async function handleRoute(path) {
    path = normalizePath(path);
    const route = matchRoute(path);
    const container = document.getElementById('app');
    if (!route) {
        container.innerHTML = '<h1>404 - 页面不存在</h1>';
        return;
    }
    if (route.requireAuth && !isLoggedIn()) {
        showLoginModal(() => handleRoute(path));
        return;
    }
    container.innerHTML = '<div style="text-align:center;">加载中...</div>';
    await route.component(container, route.params);
}

export function initRouter() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin) && !link.target) {
            e.preventDefault();
            const url = new URL(link.href);
            navigateTo(url.pathname + url.search, true);
        }
    });
    window.addEventListener('popstate', () => handleRoute(normalizePath(window.location.pathname)));
    
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        navigateTo(redirectPath, false);
    } else {
        handleRoute(window.location.pathname);
    }
}
