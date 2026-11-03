**简体中文** | [English](README.en.md)

# personal-blog

我的个人作品集与技术博客，在线地址：[jaxlim.github.io/personal-blog](https://jaxlim.github.io/personal-blog/)。

网站里有我做过的项目案例、技术文章，以及实时同步的 GitHub 动态，支持简体中文、英文和日文。整站用 [Astro](https://astro.build) 和 TypeScript 搭建，生成的是纯静态 HTML：不需要服务器，也没有任何访问统计和追踪。

![首页](docs/screenshots/home-zh.png)

## 当前状态

- **已上线**：通过 GitHub Actions 部署到 GitHub Pages，每次推送到 `main` 时构建，另外每 6 小时自动重建一次。
- **内容**：两个项目案例（[OrderPilot](https://github.com/JaxLim/OrderPilot)、[OperationAgent](https://github.com/JaxLim/OperationAgent)）；两篇文章，各有中、英、日三个版本；另有一篇排版示例草稿，只在本地开发时可见。
- **可选项，目前未配置**：页脚邮箱（`email` 为空时不显示）和关于页的个人照片（没有 `src/assets/portrait.jpg` 时不显示）。

## 功能

| 模块 | 内容 |
| --- | --- |
| 项目案例 | 每个案例都讲清楚难点和对应的测试，配有可交互的架构图（点选组件，或播放一个请求在系统里的完整流程），还有一个可以上手的演示：OrderPilot 是“40 个买家抢 10 件库存”的超卖实验，OperationAgent 是安全门禁控制台 |
| 文章 | 目录随滚动高亮、剩余阅读时间、代码块（文件名、行高亮、diff、一键复制）、脚注预览、可放大的图片、上一篇/下一篇 |
| GitHub 动态 | 贡献日历（首页的活动“脉搏”图）、最近一次推送和它的提交信息、全部公开仓库（可排序、可按语言筛选）；页面开着时会自动刷新 |
| 多语言 | `/`、`/zh/`、`/ja/` 三套独立 URL，会记住你选的语言；每种语言都有自己的 `hreflang`、sitemap 和 RSS；中日文排版单独调过 |
| 分享预览 | 构建时为每个页面、文章和案例生成对应语言的 Open Graph 图片 |
| 动效 | 平滑滚动、滚动时渐显、页面切换过渡；系统开启“减少动态效果”后全部关闭 |

| 项目案例 · 架构图 | 文章页 |
| --- | --- |
| ![项目案例中的可交互架构图](docs/screenshots/architecture-zh.png) | ![文章页](docs/screenshots/post-zh.png) |

![首页的精选作品](docs/screenshots/work-zh.png)

## 技术概览

- **框架**：Astro 7（静态输出）+ TypeScript，文章使用 Markdown / MDX，代码高亮使用 Shiki。
- **内容**：文章用的是 Astro 内容集合（`src/content/posts/{en,zh,ja}/`）；项目案例是带类型的 TypeScript 文件（`src/work/`），每段文字都要写三种语言，漏了翻译类型检查就会报错。
- **GitHub 数据**：`scripts/fetch-github.mjs` 在构建前抓取数据，写入 `src/data/github.json`（该文件有意提交到仓库）。仓库、事件和贡献日历分开抓取，哪个失败就沿用哪个的旧数据，所以断网也能构建。浏览器端由 `src/scripts/live.ts` 轮询公开事件接口，遵守 ETag 和 `X-Poll-Interval`，标签页切到后台时暂停。
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

`npm run dev` 会先复制字体；如果 `src/data/github.json` 已超过 30 分钟没更新，还会顺便刷新 GitHub 数据。没有网络也能启动，只是显示之前保存的数据。

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
| `GITHUB_TOKEN` | 不需要任何权限的 token，用来获取精确的贡献日历、提高 API 限额。只在构建时使用，不会发到浏览器 |

## 部署

`.github/workflows/deploy.yml` 会在三种情况下构建并发布到 GitHub Pages：推送到 `main`、每 6 小时定时触发，以及在 Actions 页面手动触发。第一次使用时，需要在仓库 **Settings → Pages → Source** 里选择 **GitHub Actions**（本仓库已经设置好）。工作流会根据 Pages 配置自动设置 `SITE_URL` 和 `BASE_PATH`，所以无论是项目地址、用户站点还是自定义域名，都不用改代码。

要部署到其他平台（Vercel、Netlify、Cloudflare Pages），运行 `npm run build`，发布 `dist/` 目录，并把 `SITE_URL` 设成网站的公开地址；只有不部署在根路径时才需要设置 `BASE_PATH`。

## 修改内容

- **个人信息**：`src/site.config.ts`（姓名、首页标题、简介、关于页、链接、GitHub 用户名、邮箱）。
- **仓库说明**：`src/content/projects.yaml`（多语言描述、精选顺序、隐藏的仓库）。
- **文章**：放在 `src/content/posts/{en,zh,ja}/`，不同语言文件夹里的同名文件互为译文。`src/content/posts/en/writing-posts-on-this-site.mdx` 演示了所有排版元素（草稿，只在 `npm run dev` 中可见）。

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

- **项目案例**：在 `src/work/` 新建一个文件（结构参考 `types.ts`），再到 `src/work/index.ts` 里登记；截图放在 `src/assets/work/`，构建时会自动缩放和转换格式。

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
