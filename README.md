# zysooBlogs

一个优雅的纯前端个人博客系统，支持 Markdown 写作、深色模式、全文搜索等功能。

## 功能特性

- 📝 **Markdown 编辑器**: 基于 EasyMDE 的所见即所得编辑器
- 🌓 **深色模式**: 自动检测系统主题，支持手动切换
- 🔍 **全文搜索**: 支持 Ctrl+K 快捷键快速搜索
- 🏷️ **标签系统**: 文章分类管理
- 💬 **评论系统**: 本地评论存储
- 📊 **数据统计**: 文章管理仪表盘
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 📡 **RSS 订阅**: 支持 RSS 2.0 格式输出

## 技术栈

- **前端**: Vanilla JavaScript (ES Modules)
- **样式**: CSS3 (自定义属性实现主题切换)
- **存储**: IndexedDB (localForage)
- **编辑器**: EasyMDE
- **语法高亮**: highlight.js
- **图标**: Font Awesome 6

## 快速开始

### 安装依赖

```bash
# 本项目为纯前端静态网站，无需安装依赖
# 只需使用任意 HTTP 服务器托管即可
```

### 开发运行

```bash
# 使用 Python 启动简易服务器
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 PHP
php -S localhost:8000
```

### 访问地址

打开浏览器访问 `http://localhost:8000`

## 项目结构

```
pureblog-pro/
├── assets/              # 静态资源
│   └── sample-posts.json # 示例文章数据
├── css/                 # 样式文件
│   ├── style.css        # 主样式
│   └── easy-mde-override.css # 编辑器样式覆盖
├── js/                  # JavaScript 文件
│   ├── components/      # 页面组件
│   │   ├── about.js     # 关于页面
│   │   ├── comments.js  # 评论组件
│   │   ├── dashboard.js # 仪表盘
│   │   ├── home.js      # 首页
│   │   ├── manage.js    # 文章管理
│   │   ├── postDetail.js # 文章详情
│   │   ├── postEditor.js # 文章编辑器
│   │   ├── rss.js       # RSS 订阅
│   │   ├── search.js    # 搜索页面
│   │   └── tags.js      # 标签页面
│   ├── app.js           # 应用入口
│   ├── auth.js          # 认证模块
│   ├── config.js        # 站点配置
│   ├── db.js            # 数据库操作
│   ├── router.js        # 路由系统
│   └── utils.js         # 工具函数
├── 404.html             # 404 页面
├── index.html           # 主页面
└── manifest.json        # PWA 配置
```

## 核心功能说明

### 1. 文章管理

- 创建、编辑、删除文章
- Markdown 格式支持
- 标签分类
- 草稿自动保存

### 2. 主题切换

- 支持浅色/深色两种主题
- 自动检测系统主题偏好
- 主题状态本地持久化

### 3. 搜索功能

- 全文搜索文章标题和内容
- 快捷键 `Ctrl+K` 快速打开搜索
- 搜索结果高亮显示

### 4. 快捷键

| 快捷键   | 功能     |
| -------- | -------- |
| `Ctrl+K` | 打开搜索 |
| `Ctrl+N` | 新建文章 |

## 配置说明

在 `js/config.js` 中可以修改站点配置：

```javascript
export const SITE_CONFIG = {
  name: 'zysooBlogs', // 站点名称
  description: '个人博客系统', // 站点描述
  author: 'Your Name', // 作者名称
  postsPerPage: 6, // 每页文章数
}
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## License

MIT License

## 注意事项

1. 首次访问时需要设置管理员密码
2. 所有数据存储在浏览器本地 IndexedDB 中
3. 清除浏览器数据会导致文章丢失，建议定期导出数据
