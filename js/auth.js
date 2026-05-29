import { db } from './db.js';

const AUTH_KEY = 'zysooBlogs_auth';
const EXPIRE_KEY = 'zysooBlogs_auth_expire';
const AUTH_DURATION = 7 * 24 * 60 * 60 * 1000;

/* ========== 通用弹窗引擎 ========== */
function showModal({ icon, title, desc, input, error, btnText, btnClass, showCancel, onConfirm, onClose }) {
    removeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'zysooModal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon">${icon || '🔒'}</div>
            <div class="modal-title">${title}</div>
            ${desc ? `<div class="modal-desc">${desc}</div>` : ''}
            ${input ? `<input class="modal-input" id="modalInput" type="password" placeholder="${input}" autofocus>` : ''}
            <div class="modal-error" id="modalError">${error || ''}</div>
            <div class="modal-actions">
                ${showCancel ? '<button class="btn btn-secondary" id="modalCancel">取消</button>' : ''}
                <button class="btn ${btnClass || 'btn-primary'}" id="modalConfirm">${btnText || '确认'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 事件绑定
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    const inputEl = document.getElementById('modalInput');
    const errorEl = document.getElementById('modalError');

    const cleanup = () => removeModal();

    const doConfirm = async () => {
        const value = inputEl ? inputEl.value.trim() : undefined;
        if (input && !value) {
            if (errorEl) errorEl.textContent = '请输入内容';
            inputEl?.focus();
            return;
        }
        confirmBtn.disabled = true;
        if (errorEl) errorEl.textContent = '';
        try {
            await onConfirm(value);
            cleanup();
        } catch (e) {
            if (errorEl) errorEl.textContent = typeof e === 'string' ? e : e.message;
            confirmBtn.disabled = false;
            inputEl?.focus();
        }
    };

    confirmBtn.addEventListener('click', doConfirm);
    if (cancelBtn) cancelBtn.addEventListener('click', () => { cleanup(); if (onClose) onClose(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); if (onClose) onClose(); } });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cleanup(); if (onClose) onClose(); } });
    if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConfirm(); });

    inputEl?.focus();
    return overlay;
}

function removeModal() {
    const existing = document.getElementById('zysooModal');
    if (existing) existing.remove();
}

/* ========== 认证逻辑 ========== */

export async function isFirstVisit() {
    const setting = await db.settings.get('adminPassword');
    return !setting;
}

export async function setNewPassword(password) {
    const hashed = btoa(password);
    await db.settings.put({ key: 'adminPassword', value: hashed });
    persistAuth();
}

export async function verifyPassword(password) {
    const record = await db.settings.get('adminPassword');
    if (!record) return false;
    return btoa(password) === record.value;
}

function persistAuth() {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(EXPIRE_KEY, Date.now() + AUTH_DURATION);
    sessionStorage.setItem('auth', 'true');
}

export function isLoggedIn() {
    const auth = localStorage.getItem(AUTH_KEY);
    const expire = parseInt(localStorage.getItem(EXPIRE_KEY) || '0');
    if (auth === 'true' && Date.now() < expire) {
        localStorage.setItem(EXPIRE_KEY, Date.now() + AUTH_DURATION);
        return true;
    }
    if (auth) logoutSilent();
    return false;
}

export function logout() { logoutSilent(); window.location.reload(); }

function logoutSilent() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(EXPIRE_KEY);
    sessionStorage.removeItem('auth');
}

/* ========== 弹窗式登录 / 设置密码 / 确认 ========== */

export function showSetupPasswordModal(onDone) {
    showModal({
        icon: '🔐',
        title: '欢迎使用 zyeoBlog',
        desc: '请设置管理密码，用于管理文章和仪表盘。<br><small style="opacity:0.6;">密码将加密存储在浏览器中，7 天内无需重复登录。</small>',
        input: '设置管理密码',
        btnText: '确认设置',
        error: '',
        onConfirm: async (pwd) => {
            if (pwd.length < 4) throw '密码至少 4 位';
            await setNewPassword(pwd);
            showToast('密码已设置，跳转首页...');
            if (onDone) onDone();
            setTimeout(() => {
                import('./router.js').then(({ navigateTo }) => navigateTo('/'));
            }, 800);
        }
    });
}

export function showLoginModal(callback) {
    showModal({
        icon: '🔑',
        title: '管理登录',
        desc: '请输入管理密码以继续操作',
        input: '请输入密码',
        btnText: '登录',
        showCancel: true,
        error: '',
        onConfirm: async (pwd) => {
            const ok = await verifyPassword(pwd);
            if (!ok) throw '密码错误，请重试';
            persistAuth();
            showToast('登录成功，跳转首页...');
            if (callback) callback();
            setTimeout(() => {
                import('./router.js').then(({ navigateTo }) => navigateTo('/'));
            }, 600);
        }
    });
}

export function showConfirmModal(title, desc, onConfirm) {
    return new Promise((resolve) => {
        showModal({
            icon: '⚠️',
            title: title,
            desc: desc,
            btnText: '确认',
            btnClass: 'btn-danger',
            showCancel: true,
            onConfirm: async () => { resolve(true); },
            onClose: () => { resolve(false); }
        });
    });
}

/* ========== 简易 Toast ========== */
function showToast(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:0.6rem 1.5rem;border-radius:100px;font-size:0.9rem;font-weight:600;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:toastIn 0.3s ease';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2500);
}
