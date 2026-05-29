import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.mjs';

export const db = new Dexie('zysooBlogsDB');

// v5: 修复模板字符串语法错误
db.version(5).stores({
    posts: '++id, slug, status, createdAt, tags',
    settings: 'key',
    comments: '++id, postSlug, createdAt'
});

export const postStore = {
    getAll: async (status = null) => {
        let collection = db.posts.orderBy('createdAt').reverse();
        if (status) collection = collection.filter(p => p.status === status);
        return await collection.toArray();
    },
    
    getPublished: async (page = 1, limit = 6, tag = null) => {
        let all = await db.posts.where('status').equals('published').toArray();
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (tag) {
            all = all.filter(p => p.tags && p.tags.includes(tag));
        }
        const start = (page - 1) * limit;
        return all.slice(start, start + limit);
    },
    
    getBySlug: async (slug) => {
        return await db.posts.where('slug').equals(slug).first();
    },
    
    getById: async (id) => {
        return await db.posts.get(id);
    },
    
    save: async (post) => {
        if (!post.id) {
            delete post.id;
            post.createdAt = post.createdAt || new Date().toISOString();
            post.updatedAt = post.updatedAt || post.createdAt;
            return await db.posts.add(post);
        }
        post.updatedAt = new Date().toISOString();
        await db.posts.update(post.id, post);
        return post.id;
    },
    
    delete: async (id) => {
        await db.posts.delete(id);
    },
    
    getAllTags: async () => {
        const posts = await db.posts.where('status').equals('published').toArray();
        const tagMap = new Map();
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
                });
            }
        });
        return Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
    },
    
    search: async (keyword) => {
        const all = await db.posts.where('status').equals('published').toArray();
        const lowerKeyword = keyword.toLowerCase();
        return all.filter(p => 
            p.title.toLowerCase().includes(lowerKeyword) || 
            p.content.toLowerCase().includes(lowerKeyword)
        );
    }
};

export const commentStore = {
    getByPost: async (postSlug) => {
        return await db.comments.where('postSlug').equals(postSlug).toArray();
    },
    add: async (comment) => {
        comment.createdAt = new Date().toISOString();
        return await db.comments.add(comment);
    },
    delete: async (id) => {
        await db.comments.delete(id);
    },
    count: async (postSlug) => {
        return await db.comments.where('postSlug').equals(postSlug).count();
    }
};

// 内置示例文章
const SAMPLE_POSTS = [
  {
    title: "2026 前端开发者必学的 5 个新技术",
    slug: "frontend-trends-2026",
    tags: ["前端", "技术", "JavaScript", "CSS", "2026"],
    coverImage: "https://picsum.photos/seed/tech26/800/400",
    status: "published",
    content: [
      "# 2026 前端开发者必学的 5 个新技术",
      "",
      "前端世界日新月异，每一年都有令人兴奋的新工具和范式出现。2026 年已经过半，让我们一起来看看今年最值得关注的 5 个前端技术趋势。",
      "",
      "## 1. React Server Components 全面落地",
      "",
      "经过几年的酝酿，RSC 终于在 Next.js 15 中达到生产级稳定。它彻底改变了我们处理数据获取的方式：",
      "",
      "- 服务端组件默认，客户端组件按需",
      "- 零 JS Bundle 的服务端渲染",
      "- 与 Suspense 完美配合",
      "",
      "## 2. AI 驱动的开发工具",
      "",
      "GitHub Copilot 已经成为标配，但 2026 年的 AI 开发工具更加智能：",
      "",
      "- **Cursor** 和 **Windsurf** 等 AI IDE 正在改变编码方式",
      "- 实时代码审查、自动测试生成",
      "- 自然语言到完整 PR 的能力",
      "",
      "## 3. View Transitions API",
      "",
      "浏览器原生页面过渡动画的时代来了！无需任何第三方库，就能实现媲美原生 App 的页面切换效果。",
      "",
      "## 4. CSS 容器查询和样式查询",
      "",
      "终于可以基于父容器而非视口来书写响应式了。组件级别的响应式设计，让微前端和设计系统更加灵活。",
      "",
      "## 5. WebAssembly GC",
      "",
      "Wasm GC 提案在主流浏览器中全面支持，现在可以直接在 Wasm 中使用高级语言的对象模型。",
      "",
      "---",
      "",
      "**总结**：2026 年的前端不再是简单的 HTML/CSS/JS，而是朝着更高效、更智能、更原生的方向演进。保持学习，永远不要停下探索的脚步。"
    ].join("\n")
  },
  {
    title: "如何用 Markdown 写出优雅的技术文档",
    slug: "markdown-writing-guide",
    tags: ["写作", "Markdown", "教程"],
    coverImage: "https://picsum.photos/seed/markdown/800/400",
    status: "published",
    content: [
      "# 如何用 Markdown 写出优雅的技术文档",
      "",
      "好的文档让代码更有价值。Markdown 作为最流行的标记语言，掌握它的高级技巧能让你的文档脱颖而出。",
      "",
      "## 基础不等于简陋",
      "",
      "很多人只用 Markdown 的标题和列表，其实它远不止这些：",
      "",
      "### 表格",
      "",
      "| 方法 | 时间复杂度 | 空间复杂度 |",
      "|------|-----------|------------|",
      "| 暴力枚举 | O(n²) | O(1) |",
      "| 哈希表 | O(n) | O(n) |",
      "",
      "### 任务列表",
      "",
      "- [x] 完成初稿",
      "- [x] 代码审查",
      "- [ ] 发布到生产环境",
      "",
      "## 代码块的艺术",
      "",
      "永远指定语言以获得语法高亮：",
      "",
      "```python",
      "def fibonacci(n):",
      "    a, b = 0, 1",
      "    for _ in range(n):",
      "        a, b = b, a + b",
      "    return a",
      "```",
      "",
      "## 引用和注意",
      "",
      "> **重要提示**：在部署之前请确保所有测试通过。",
      ">",
      "> 可以使用 `npm run test -- --coverage` 查看覆盖率。",
      "",
      "## 最后的话",
      "",
      "好的技术文档应该：",
      "1. **结构清晰** — 善用标题层级",
      "2. **示例丰富** — 代码片段是最好的说明",
      "3. **保持更新** — 过时的文档比没有更糟",
      "",
      "开始写作吧，你的读者会感谢你的。"
    ].join("\n")
  },
  {
    title: "我为什么从 VS Code 迁移到 Neovim",
    slug: "why-i-switched-to-neovim",
    tags: ["工具", "编辑器", "Neovim", "效率"],
    coverImage: "https://picsum.photos/seed/neovim/800/400",
    status: "published",
    content: [
      "# 我为什么从 VS Code 迁移到 Neovim",
      "",
      "作为一名使用了 VS Code 五年的前端开发者，今年我做了一个很多人认为\"疯狂\"的决定——切换到了 Neovim。",
      "",
      "## 起因",
      "",
      "VS Code 确实很好用，但随着项目越来越大，我开始遇到一些痛点：",
      "",
      "- Electron 的内存占用经常超过 2GB",
      "- 打开大型 monorepo 时启动变慢",
      "- 过多的插件让快捷键冲突频发",
      "",
      "## 选择 Neovim 的理由",
      "",
      "### 1. 速度",
      "",
      "Neovim 的启动时间不到 100ms，内存占用通常只有几十 MB。在处理几千个文件的项目时，这一点感受尤为明显。",
      "",
      "### 2. 键盘优先",
      "",
      "不需要鼠标意味着更快的编码速度。经过一个月的肌肉记忆训练，我发现：",
      "",
      "- 代码导航快了一倍",
      "- 批量编辑效率大幅提升",
      "- 手腕疼痛（鼠标手）明显减轻",
      "",
      "### 3. Lua 配置",
      "",
      "Neovim 的 Lua 配置语法非常现代，配合 LazyVim 可以提供开箱即用的 IDE 体验：LSP 自动补全、Treesitter 语法高亮、Telescope 模糊搜索、内置 Git 集成。",
      "",
      "## 一个月的体验",
      "",
      "说实话前两周很痛苦。但在第三周之后，那种\"手指不用离开键盘\"的快感让我回不去了。",
      "",
      "> \"It's not about the tool, it's about the flow.\"",
      "",
      "**结论**：Neovim 不适合所有人，但如果你追求极致的编码效率和完全可定制的环境，它值得一试。"
    ].join("\n")
  },
  {
    title: "远程工作的第三年，我学到了什么",
    slug: "remote-work-year-3",
    tags: ["生活", "远程工作", "效率", "思考"],
    coverImage: "https://picsum.photos/seed/remote/800/400",
    status: "published",
    content: [
      "# 远程工作的第三年，我学到了什么",
      "",
      "三年前，我开始了全职远程工作。回头看这段经历，想分享一些真实的心得——不是那些\"数字游民在海滩上编码\"的美好滤镜，而是切身的经验。",
      "",
      "## 自律不是天赋，是系统",
      "",
      "刚远程时最大的挑战不是技术，而是管理自己。我建立了一套简单的系统：",
      "",
      "### 早晨仪式",
      "",
      "- 08:00 起床，不碰手机直接洗漱",
      "- 08:30 一杯黑咖啡 + 10 分钟阅读",
      "- 09:00 开始\"深度工作时间\"",
      "",
      "### 深度工作",
      "",
      "上午 9 点到 12 点是我雷打不动的编码时间：",
      "- 关闭所有通知（Slack、微信）",
      "- 使用番茄钟：50 分钟工作 + 10 分钟休息",
      "- 这段 3 小时的产出抵得上散漫的 8 小时",
      "",
      "## 过度交流比交流不足更危险",
      "",
      "刚远程时害怕被遗忘，每条消息都秒回。结果：不断地被打断、会议越来越多、真正写代码的时间碎片化。",
      "",
      "现在我这样做：",
      "- 每天只检查 3 次消息：10:00 / 14:00 / 17:00",
      "- 异步优先：能用文档说清的不用开会",
      "- 每周一次 1on1 同步，解决所有疑问",
      "",
      "## 孤独感是真实的",
      "",
      "在家工作久了，一整天不说话是常态。解决方案：每周至少去一次共享办公空间、加入线上技术社群、养了一只猫（强烈推荐）。",
      "",
      "## 最后的建议",
      "",
      "远程工作不是乌托邦也不是地狱。它是一种需要训练的技能。",
      "",
      "1. 从小开始：先尝试每周远程 1-2 天",
      "2. 投资你的工作环境：好的升降桌和显示器至关重要",
      "3. 设定明确的边界：工作时间和休息时间要分开",
      "",
      "三年了，我不会再回到每天通勤的日子。但这条路确实需要用心经营。"
    ].join("\n")
  },
  {
    title: "从零搭建个人博客的完整指南",
    slug: "build-blog-from-scratch",
    tags: ["博客", "教程", "前端", "入门"],
    coverImage: "https://picsum.photos/seed/blogbuild/800/400",
    status: "published",
    content: [
      "# 从零搭建个人博客的完整指南",
      "",
      "你是否也曾想过拥有自己的博客？这篇指南将带你从零开始，搭建一个完全属于你自己的个人博客。",
      "",
      "## 为什么要有自己的博客",
      "",
      "- **积累**：写作是最好的思考方式",
      "- **展示**：比简历更有说服力的个人名片",
      "- **连接**：相同兴趣的人会找到你",
      "",
      "## 技术选型",
      "",
      "搭建博客的方式有很多，选择哪种取决于你的技术水平和需求：",
      "",
      "| 方案 | 难度 | 灵活性 | 成本 |",
      "|------|------|--------|------|",
      "| 现有平台（知乎/掘金） | 低 | 低 | 免费 |",
      "| 静态生成器（Hexo/Hugo） | 中 | 高 | 免费 |",
      "| 纯前端 SPA（你正在用的） | 中 | 极高 | 免费 |",
      "| 全栈方案（Next.js+DB） | 高 | 极高 | 低 |",
      "",
      "## 本文方案：纯前端 + IndexedDB",
      "",
      "你当前看到的这个博客就是使用这个方案构建的。核心技术栈：vanilla JavaScript (ES Module)、Dexie.js + IndexedDB、EasyMDE Markdown 编辑器、DOMPurify XSS 防护、History API 前端路由。",
      "",
      "### 优点",
      "",
      "1. **零成本部署** — 直接放在 GitHub Pages",
      "2. **完全可控** — 所有数据在你自己的浏览器里",
      "3. **离线可用** — IndexedDB 天然支持离线",
      "4. **无需服务器** — 纯静态文件",
      "",
      "## 开始写作",
      "",
      "搭建好之后，最重要的事情只有一件：**开始写**。",
      "",
      "> 完美是优秀的敌人。先写出第一篇，再考虑优化。",
      "",
      "你的下一篇博客，也许就从现在开始。"
    ].join("\n")
  },
  {
    title: "2026 年的 CSS：你已经不需要 Sass 了",
    slug: "css-in-2026-no-sass",
    tags: ["CSS", "前端", "技术", "2026"],
    coverImage: "https://picsum.photos/seed/css2026/800/400",
    status: "published",
    content: [
      "# 2026 年的 CSS：你已经不需要 Sass 了",
      "",
      "如果你还在项目里同时使用 Sass 和 PostCSS，这篇文章可能会改变你的想法。",
      "",
      "## 原生 CSS 的新能力",
      "",
      "2026 年的 CSS 已经有了这么多原生能力：",
      "",
      "### 原生嵌套",
      "```css",
      ".card {",
      "  padding: 1rem;",
      "",
      "  & .title { font-size: 1.2rem; }",
      "",
      "  &:hover {",
      "    box-shadow: var(--shadow);",
      "    & .title { color: var(--accent); }",
      "  }",
      "}",
      "```",
      "",
      "### CSS 变量 + @property",
      "```css",
      "@property --angle {",
      "  syntax: '<angle>';",
      "  initial-value: 0deg;",
      "  inherits: false;",
      "}",
      "```",
      "",
      "### light-dark() 函数",
      "```css",
      ":root { color-scheme: light dark; }",
      "body {",
      "  background: light-dark(#fff, #111);",
      "  color: light-dark(#1a1a1a, #e5e5e5);",
      "}",
      "```",
      "",
      "## 还需要的工具",
      "",
      "不是所有 Sass 功能都有原生替代：",
      "",
      "| Sass 功能 | 原生替代 |",
      "|-----------|----------|",
      "| 嵌套 | ✅ CSS Nesting |",
      "| 变量 | ✅ CSS Custom Properties |",
      "| Mixin | ❌ 仍需工具 |",
      "| 函数 | ❌ 有限 |",
      "",
      "## 迁移建议",
      "",
      "1. 先移除 Sass 变量，全部改用 CSS 变量",
      "2. 将嵌套从 Sass 语法改为原生 CSS Nesting",
      "3. Mixin 和循环用 PostCSS 或 Tailwind 处理",
      "4. 渐进式迁移，不要一次性全改",
      "",
      "## 结论",
      "",
      "CSS 已经足够强大，大部分项目可以摆脱预处理器的依赖。更少的构建工具意味着更快的编译、更少的配置、更简单的调试。",
      "",
      "**2026 年，是时候回归原生 CSS 了。**"
    ].join("\n")
  },
  {
    title: "写给新手的 Git 工作流指南",
    slug: "git-workflow-for-beginners",
    tags: ["Git", "教程", "入门", "工具"],
    coverImage: "https://picsum.photos/seed/gitguide/800/400",
    status: "published",
    content: [
      "# 写给新手的 Git 工作流指南",
      "",
      "Git 可能是编程中最被低估的技能之一。大部分新手只学会了 add、commit、push，然后就迷失在合并冲突中。",
      "",
      "## 理解 Git 的思维方式",
      "",
      "Git 不是\"保存按钮\"，而是一个**时间旅行机器**。每次 commit 都是你项目历史中的一个快照。",
      "",
      "## 日常工作流",
      "",
      "### 1. 开始新功能",
      "```bash",
      "git checkout -b feature/my-new-feature",
      "```",
      "",
      "### 2. 提交代码",
      "```bash",
      "git add -p          # 交互式暂存，比 git add . 好 100 倍",
      "git commit -m \"feat: 添加用户登录功能\"",
      "```",
      "",
      "### 3. 保持分支更新",
      "```bash",
      "git fetch origin",
      "git rebase origin/main  # 而不是 git merge",
      "```",
      "",
      "## Commit 信息规范",
      "",
      "好的 commit message 格式：",
      "",
      "```",
      "feat: 添加搜索功能",
      "fix: 修复登录页面在 Safari 上的样式问题",
      "docs: 更新 README 安装说明",
      "refactor: 将用户模块提取为独立服务",
      "```",
      "",
      "## 救命命令",
      "",
      "| 场景 | 命令 |",
      "|------|------|",
      "| 改错了但还没 commit | git checkout -- . |",
      "| commit 了但还没 push | git reset HEAD~1 |",
      "| 想回到上次 push 的状态 | git reset --hard origin/main |",
      "| 只想撤销某个 commit | git revert <hash> |",
      "",
      "> ⚠️ git reset --hard 会丢失未提交的修改，使用前三思！",
      "",
      "## 最后的忠告",
      "",
      "1. **频繁 commit**：小而清晰的 commit 比大块的好维护",
      "2. **写清楚 commit message**：三个月后的你会感谢现在的你",
      "3. **push 之前先 pull/rebase**：减少合并冲突",
      "",
      "Git 入门只需要一天，但精通需要数年。保持练习！"
    ].join("\n")
  },
  {
    title: "程序员的护眼指南：从屏幕到眼镜",
    slug: "programmer-eye-care",
    tags: ["健康", "效率", "生活"],
    coverImage: "https://picsum.photos/seed/eyecare/800/400",
    status: "published",
    content: [
      "# 程序员的护眼指南：从屏幕到眼镜",
      "",
      "每天盯着屏幕 10+ 小时，眼睛疲劳是每个程序员逃不掉的宿命。但做好以下几点，可以大大减轻伤害。",
      "",
      "## 1. 屏幕设置",
      "",
      "### 亮度与色温",
      "- 屏幕亮度应该与环境光匹配，不是越亮越好",
      "- 晚上使用暖色温（f.lux 或系统自带夜览）",
      "- 对比度设置在 70-80%",
      "",
      "### 字体与缩放",
      "- 编辑器字号：至少 14px（推荐 16px）",
      "- 终端字体：推荐 JetBrains Mono 或 Cascadia Code",
      "- 缩放：4K 屏幕建议 150%-175%",
      "",
      "## 2. 20-20-20 法则",
      "",
      "每 **20 分钟**，看 **20 英尺（6 米）** 远的物体，持续 **20 秒**。",
      "",
      "用定时器强制自己执行。",
      "",
      "## 3. 环境光",
      "",
      "- 不要在全黑环境中用电脑",
      "- 屏幕后面放一盏柔光灯（Bias Lighting）",
      "- 避免头顶强光直射屏幕",
      "",
      "## 4. 关于眼镜",
      "",
      "| 镜片类型 | 适用场景 |",
      "|----------|----------|",
      "| 防蓝光 | 全天使用电脑 |",
      "| 变色镜片 | 室内外切换频繁 |",
      "| 抗疲劳（下加光） | 长时间近距离用眼 |",
      "",
      "## 5. 运动和休息",
      "",
      "- 每天户外活动至少 30 分钟",
      "- 眼保健操不是玄学",
      "- 充足的睡眠是最好的护眼药",
      "",
      "## 最后",
      "",
      "眼睛是程序员最重要的资产之一。保护它们，就像你保护你的代码一样认真。",
      "",
      "**今天就开始行动吧。**"
    ].join("\n")
  }
];

export async function initSampleData() {
    const count = await db.posts.count();
    if (count === 0) {
        const now = new Date();
        for (let i = 0; i < SAMPLE_POSTS.length; i++) {
            const createdAt = new Date(now.getTime() - (SAMPLE_POSTS.length - i) * 3600000 * 72);
            await db.posts.add({
                ...SAMPLE_POSTS[i],
                createdAt: createdAt.toISOString(),
                updatedAt: createdAt.toISOString()
            });
        }
    }
}