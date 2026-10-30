/**
 * Everything personal about the site lives here.
 * Text that readers see has a version for each language: en, zh, ja.
 */
import type { Locale } from './i18n/config';

type Localized<T = string> = Record<Locale, T>;

export const site = {
  /** Shown in the header, the hero and page titles, in every language. */
  name: 'Ethan',

  /** One or two sentences under your name on the home page. */
  tagline: {
    en: 'Independent developer. I build software for the web and write about how it works.',
    zh: '独立开发者。我构建 Web 软件，也记录它背后的原理。',
    ja: 'フリーランスのソフトウェア開発者。Web のソフトウェアをつくり、その仕組みについて書いています。',
  } satisfies Localized,

  /**
   * A short availability line under the tagline, with a live dot.
   * Set every value to '' to hide it.
   */
  status: {
    en: 'Open to full-time engineering roles',
    zh: '正在寻找全职工程师职位',
    ja: 'フルタイムのエンジニア職を探しています',
  } satisfies Localized,

  /** Used for search engines and link previews. */
  description: {
    en: 'Writing, projects and live GitHub activity from Ethan, an independent developer.',
    zh: '独立开发者 Ethan 的文章、项目和实时 GitHub 动态。',
    ja: 'フリーランス開発者 Ethan の記事、プロジェクト、GitHub のリアルタイムなアクティビティ。',
  } satisfies Localized,

  github: {
    /**
     * Your GitHub username. Leave empty to see the site with sample data.
     * Once set, the build fetches your repositories and activity, and the
     * browser keeps them up to date while the page is open.
     */
    username: '',

    /** How many repositories the home page shows. */
    homeCount: 6,

    /** Hide forks from the repository list. */
    hideForks: true,

    /** Hide archived repositories from the repository list. */
    hideArchived: true,
  },

  /** Leave empty to hide the email link. */
  email: '',

  /** Links shown in the footer and on the About page. */
  links: [
    // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-handle' },
  ] as { label: string; href: string }[],

  /** Content of the About page. Each string in `intro` is one paragraph. */
  about: {
    en: {
      intro: [
        'I’m Ethan, an independent developer. I design and build web software, from the interface down to the deployment, and I care about the details that make a product feel finished.',
        'This site is where I write about what I’m learning and keep a live record of what I’m building.',
      ],
      focus: [
        'Frontend engineering with TypeScript, with attention to typography, motion and accessibility.',
        'Full-stack product work: APIs, data modelling and the infrastructure that keeps them running.',
        'Developer tooling and automation.',
      ],
      now: 'Open to full-time engineering roles. If you’re hiring, I’d be glad to hear from you.',
    },
    zh: {
      intro: [
        '我是 Ethan，一名独立开发者。我设计并构建 Web 软件，从界面一直做到部署上线，也在意那些让产品真正“完成”的细节。',
        '我在这里记录学到的东西，也实时展示我正在构建的项目。',
      ],
      focus: [
        '使用 TypeScript 的前端工程，关注排版、动效与无障碍。',
        '全栈产品开发：API、数据建模，以及让它们稳定运行的基础设施。',
        '开发者工具与自动化。',
      ],
      now: '正在寻找全职工程师职位。如果你的团队正在招聘，欢迎与我联系。',
    },
    ja: {
      intro: [
        'フリーランスの開発者、Ethan です。インターフェースからデプロイまで Web ソフトウェアを設計・開発しています。プロダクトを「完成した」と感じさせる細部を大切にしています。',
        'このサイトでは、学んだことを書き留め、いま作っているものをリアルタイムで公開しています。',
      ],
      focus: [
        'TypeScript によるフロントエンド開発。タイポグラフィ、モーション、アクセシビリティを重視しています。',
        'フルスタックのプロダクト開発：API、データモデリング、それらを支えるインフラ。',
        '開発者向けツールと自動化。',
      ],
      now: 'フルタイムのエンジニア職を探しています。採用をご検討の方は、お気軽にご連絡ください。',
    },
  } satisfies Localized<{ intro: string[]; focus: string[]; now: string }>,
};

export type SiteConfig = typeof site;
