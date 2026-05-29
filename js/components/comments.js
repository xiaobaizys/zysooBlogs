import { commentStore } from '../db.js';
import { formatDate, escapeHtml } from '../utils.js';

const EMOJIS = [
    '😀','😂','🥰','😎','🤔','😴','🤩','😭','😡','👍','👎','👏',
    '🙏','💪','🤝','❤️','🔥','⭐','🎉','💡','📌','✍️','🗣️','💬',
    '🐱','🐶','🦊','🐼','🐨','🦁','🐸','🐵','🦄','🐙','🌻','🌸',
    '🌙','☀️','🌈','⚡','💧','🎵','🎨','📷','💻','☕','🍕','🎂'
];

const NICKNAMES = [
    '吃瓜群众','路过的小透明','匿名旅人','深夜码字工','云上咖啡',
    '风中的树叶','月亮不睡','海边的卡夫卡','夏日烟火','冬日暖阳',
    '书虫先生','代码诗人','画画的北北','野生评论家','佛系青年',
    '追光者','柠檬精','瞌睡虫','杠精本精','彩虹屁专业户'
];

export async function renderComments(container, postSlug) {
    const comments = await commentStore.getByPost(postSlug);
    const icon = localStorage.getItem('commentNickname') || randomNickname();

    container.innerHTML = `
        <section class="comments-section">
            <h3 class="comments-title">评论 (${comments.length})</h3>

            <div class="comment-form">
                <div class="comment-avatar">${randomEmoji(icon)}</div>
                <div class="comment-input-wrap">
                    <div class="comment-meta-row">
                        <span class="comment-nickname" title="点击换昵称" id="nicknameDisplay">${escapeHtml(icon)}</span>
                        <button class="btn-change-name" id="changeNameBtn" title="换个昵称">🔄</button>
                    </div>
                    <textarea id="commentContent" placeholder="说点什么吧..." rows="2"></textarea>
                    <div class="comment-actions">
                        <button class="btn-emoji" id="emojiBtn" title="表情">😊</button>
                        <div class="emoji-picker" id="emojiPicker" style="display:none;">
                            ${EMOJIS.map(e => `<button class="emoji-item" data-emoji="${e}">${e}</button>`).join('')}
                        </div>
                        <button class="btn btn-primary btn-small" id="submitComment">发布评论</button>
                    </div>
                </div>
            </div>

            <div class="comments-list">
                ${comments.length === 0
                    ? '<p class="comments-empty">还没有评论，来说两句吧～</p>'
                    : comments.map(c => `
                        <div class="comment-item">
                            <div class="comment-avatar">${randomEmoji(c.author)}</div>
                            <div class="comment-body">
                                <div class="comment-header">
                                    <span class="comment-nickname">${escapeHtml(c.author)}</span>
                                    <span class="comment-time">${formatDate(c.createdAt)}</span>
                                </div>
                                <div class="comment-content">${formatCommentContent(c.content)}</div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </section>
    `;

    // 表情选择器切换
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
    });
    document.addEventListener('click', () => {
        emojiPicker.style.display = 'none';
    });
    document.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ta = document.getElementById('commentContent');
            ta.value += btn.dataset.emoji;
            ta.focus();
            emojiPicker.style.display = 'none';
        });
    });

    // 换昵称
    document.getElementById('changeNameBtn').addEventListener('click', () => {
        const newName = randomNickname();
        localStorage.setItem('commentNickname', newName);
        document.getElementById('nicknameDisplay').textContent = newName;
    });

    // 提交评论
    document.getElementById('submitComment').addEventListener('click', async () => {
        const content = document.getElementById('commentContent').value.trim();
        if (!content) return;
        await commentStore.add({
            postSlug: postSlug,
            author: localStorage.getItem('commentNickname') || icon,
            content: content
        });
        document.getElementById('commentContent').value = '';
        await renderComments(container, postSlug);
    });

    // Ctrl+Enter 快捷键提交
    document.getElementById('commentContent').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('submitComment').click();
        }
    });
}

function randomNickname() {
    const name = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
    localStorage.setItem('commentNickname', name);
    return name;
}

function randomEmoji(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EMOJIS[Math.abs(hash) % EMOJIS.length];
}

function formatCommentContent(text) {
    // emoji 和文本混合渲染
    return escapeHtml(text).replace(
        /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu,
        '<span style="font-size:1.3em;">$&</span>'
    );
}
