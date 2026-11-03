**简体中文** | [English](README.en.md)

# personal-blog

我的个人作品集与技术博客，在线地址：[jaxlim.github.io/personal-blog](https://jaxlim.github.io/personal-blog/)。

网站展示我做过的系统（项目案例）、技术文章，以及实时同步的 GitHub 动态，支持简体中文、英文和日文。基于 [Astro](https://astro.build) 与 TypeScript 构建，输出纯静态 HTML：不需要服务器，也没有任何统计追踪。

![首页](docs/screenshots/home-zh.png)

## 当前状态

- **已上线**：通过 GitHub Actions 部署到 GitHub Pages，每次推送到 `main` 以及每 6 小时自动重新构建一次。
- **内容**：两个项目案例（[OrderPilot](https://github.com/JaxLim/OrderPilot)、[OperationAgent](https://github.com/JaxLim/OperationAgent)）；两篇文章，均有中、英、日三个版本；另有一篇只在本地开发时可见的排版示例草稿。
- **可选、尚未配置**：页脚邮箱（`email` 为空时不显示）、关于页的个人照片（`src/assets/portrait.jpg` 不存在时不显示）。

## 功能

| 模块 | 内容 |
| --- | --- |
| 项目案例 | 每个案例包含问题与对应测试、可交互的架构图（点选组件，或让一个请求在系统中“走一遍”），以及一个演示：OrderPilot 是“40 个买家抢 10 件库存”的超卖实验，OperationAgent 是 Worker 隔离门禁控制台 |
| 文章 | 目录与滚动定位、剩余阅读时间、带文件名/高亮/diff/复制按钮的代码块、脚注预览、可放大的图片、上一篇/下一篇 |
| GitHub 动态 | 贡献日历（首页的活动“脉搏”图）、最近一次推送及其提交信息、全部公开仓库（可排序、按语言筛选）；页面打开期间在浏览器中自动更新 |
| 多语言 | `/`、`/zh/`、`/ja/` 三套独立 URL，记住语言选择；每种语言有独立的 `hreflang`、sitemap 和 RSS；针对中日文调整了排版 |
| 分享预览 | 构建时为每个页面、文章和案例生成各语言的 Open Graph 图片 |
| 动效 | 平滑滚动、滚动渐显、页面切换过渡；系统开启“减少动态效果”时全部关闭 |

| 项目案例 · 架构图 | 文章页 |
| --- | --- |
| ![项目案例中的可交互架构图](docs/screenshots/architecture-zh.png) | ![文章页](docs/screenshots/post-zh.png) |

![首页的精选作品](docs/screenshots/work-zh.png)

## 技术概览

- **框架**：Astro 7（静态输出）+ TypeScript，文章使用 Markdown / MDX，代码高亮使用 Shiki。
- **内容**：文章是 Astro 内容集合（`src/content/posts/{en,zh,ja}/`）；项目案例是带类型的 TypeScript 文件（`src/work/`），每个字符串都要写三种语言，缺少翻译时类型检查会报错。
- **GitHub 数据**：`scripts/fetch-github.mjs` 在构建前抓取数据，写入 `src/data/github.json`（该文件有意提交到仓库）。仓库、事件和贡献日历分别抓取，任一来源失败都保留旧数据，因此离线也能构建。浏览器端的 `src/scripts/live.ts` 轮询公开事件接口，遵守 ETag 和 `X-Poll-Interval`，标签页隐藏时暂停。
- **图片生成**：分享预览图由 satori 绘制、`@resvg/resvg-js` 渲染为 PNG。
- **字体**：Schibsted Grotesk、Newsreader、JetBrains Mono，中日文正文使用 Noto Serif；全部通过 Fontsource 自托管。

## 本地运行

需要 **Node.js 22.12 或更高版本**。

```sh
git clone https://github.com/JaxLim/personal-blog.git
cd personal-blog
npm install
npm run dev
```

打开 http://localhost:4321 。中文版在 http://localhost:4321/zh/ 。

`npm run dev` 会先复制字体，并在 `src/data/github.json` 超过 30 分钟时刷新 GitHub 数据。没有网络也能启动，只是显示已保存的数据。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 抓取 GitHub 数据，然后构建到 `dist/` |
| `npm run preview` | 本地预览构建结果 |
| `npm run check` | 类型检查（包括所有翻译） |
| `npm run github` | 立即抓取 GitHub 数据 |
| `npm run new "标题" -- --lang zh` | 新建一篇草稿（`--md` 使用纯 Markdown，`--slug` 指定文件名） |

### 环境变量（可选）

复制 `.env.example` 为 `.env` 后按需填写：

| 变量 | 用途 |
| --- | --- |
| `SITE_URL` | 站点公开地址，用于规范链接、`hreflang`、RSS、sitemap 和分享预览 |
| `BASE_PATH` | 部署在子路径时设置，例如 `/personal-blog` |
| `GITHUB_TOKEN` | 无需任何权限的 token。用于获取精确的贡献日历并提高 API 限额，只在构建时使用，不会发送到浏览器 |

## 部署

`.github/workflows/deploy.yml` 会在推送到 `main`、每 6 小时一次，以及在 Actions 页面手动触发时构建并发布到 GitHub Pages。首次使用需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**（本仓库已设置）。工作流会根据 Pages 配置自动设置 `SITE_URL` 和 `BASE_PATH`，因此项目地址、用户站点和自定义域名都无需改代码。

部署到其他平台（Vercel、Netlify、Cloudflare Pages）时：运行 `npm run build`，发布 `dist/` 目录，并把 `SITE_URL` 设为公开地址；只有不在根路径时才需要设置 `BASE_PATH`。

## 修改内容

- **个人信息**：`src/site.config.ts`（姓名、首页标题、简介、关于页、链接、GitHub 用户名、邮箱）。
- **仓库说明**：`src/content/projects.yaml`（多语言描述、精选顺序、隐藏的仓库）。
- **文章**：放在 `src/content/posts/{en,zh,ja}/`，不同语言文件夹中同名的文件互为译文。`src/content/posts/en/writing-posts-on-this-site.mdx` 是所有排版元素的示例（草稿，只在 `npm run dev` 中可见）。

  ```yaml
  ---
  title: 恰好卖出十件
  description: 用于列表和分享预览的一两句话。
  date: 2026-10-30
  tags: [Java, MySQL]
  pinned: true          # 可选：在首页置顶
  draft: true           # 可选：只在开发环境显示
  project: orderpilot   # 可选：文末链接到对应项目案例
  ---
  ```

- **项目案例**：在 `src/work/` 新建一个文件（结构见 `types.ts`），并在 `src/work/index.ts` 中登记；截图放在 `src/assets/work/`，构建时自动缩放和转换格式。

## 目录结构

```
src/
  pages/        路由；[lang]/ 是 /zh/ 与 /ja/ 版本，og/ 生成分享预览图
  views/        各语言共用的页面模板
  components/   界面组件；work/ 是架构图、演示和案例卡片
  work/         项目案例内容（带类型，三种语言）
  content/      文章与 projects.yaml
  data/         github.json，由 scripts/fetch-github.mjs 生成
  i18n/         语言配置、URL 工具和全部界面文案
  lib/          文章、GitHub 数据、格式化、OG 图片渲染
  scripts/      浏览器端脚本：动效、实时数据、搜索、架构图、界面交互
  styles/       设计令牌、全局样式、文章排版
scripts/        fetch-github、copy-fonts、new-post、make-icons
```
