// 工具函数
import dayjs from 'https://cdn.skypack.dev/dayjs@1.11.10';

export function formatDate(isoString) {
    return dayjs(isoString).format('YYYY-MM-DD HH:mm');
}

export function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export function estimateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.replace(/\s+/g, ' ').split(' ').length;
    return Math.ceil(words / wordsPerMinute);
}

export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
