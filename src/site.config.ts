/**
 * Everything personal about the site lives here.
 * Text that readers see has a version for each language: en, zh, ja.
 */
import type { Locale } from './i18n/config';

type Localized<T = string> = Record<Locale, T>;

export const site = {
  /** Shown in the header, the footer and page titles, in every language. */
  name: 'Ethan',

  /** The small label above the headline, after the name. */
  label: {
    en: 'Personal blog & projects',
    zh: '个人博客与项目',
    ja: '個人ブログとプロジェクト',
  } satisfies Localized,

  /**
   * The large statement on the home page. Each string is one line; the
   * lines rise in one after another.
   */
  headline: {
    en: ['Clean code,', 'reliable systems,', 'and notes along the way.'],
    zh: ['写清晰的代码，', '做可靠的系统，', '记录过程中的思考。'],
    ja: ['読みやすいコードと、', '信頼できるシステム、', 'その途中のメモ。'],
  } satisfies Localized<string[]>,

  /** One or two sentences under the headline. */
  tagline: {
    en: 'I’m Ethan, a software engineer. This is where I keep notes on backend architecture, frontend interface work, and the tools and projects I build on my own.',
    zh: '我是 Ethan，一名软件工程师。这里记录我在后端架构上的实践、前端界面上的打磨，以及独立开发的一些工具和项目。',
    ja: 'ソフトウェアエンジニアの Ethan です。バックエンドの設計、フロントエンドの画面づくり、個人で作っているツールやプロジェクトについて書き残しています。',
  } satisfies Localized,

  /**
   * A short availability line with a live dot.
   * Set every value to '' to hide it.
   */
  status: {
    en: 'Open to full-time engineering roles',
    zh: '正在寻找全职工程师岗位',
    ja: 'フルタイムのエンジニア職を探しています',
  } satisfies Localized,

  /** Used for search engines and link previews. */
  description: {
    en: 'Ethan’s personal space for notes on backend architecture, frontend interfaces and independent software development, with open-source projects from GitHub.',
    zh: 'Ethan 的个人空间，记录后端架构、前端界面与独立开发的点滴，也收录 GitHub 上的开源项目。',
    ja: 'Ethan の個人サイト。バックエンドの設計、フロントエンドの画面、個人開発についての記録と、GitHub のオープンソースプロジェクトをまとめています。',
  } satisfies Localized,

  github: {
    /**
     * Your GitHub username. scripts/fetch-github.mjs reads it from here, saves
     * your repositories and activity to src/data/github.json before each
     * build, and the browser keeps them up to date while a page is open.
     * Leave empty to preview the site with sample data.
     */
    username: 'JaxLim',

    /** How many repositories the home page shows. */
    homeCount: 6,

    /** Hide forks from the repository list. */
    hideForks: true,

    /** Hide archived repositories from the repository list. */
    hideArchived: true,
  },

  /** Leave empty to hide the email link. */
  email: '',

  /** Links shown in the footer and on the About page (GitHub is added automatically). */
  links: [
    // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-handle' },
  ] as { label: string; href: string }[],

  /** The tools shown in the slow-moving strip on the home page. */
  toolbox: [
    'Java 21',
    'Spring Boot',
    'MySQL',
    'Redis',
    'RabbitMQ',
    'TypeScript',
    'Vue 3',
    'React',
    'Electron',
    'Node.js',
    'Spring AI',
    'Docker',
    'Testcontainers',
    'Playwright',
    'Astro',
  ],

  /** Content of the About page. Each string in `intro` is one paragraph. */
  about: {
    en: {
      intro: [
        'I’m Ethan, a software engineer. I graduated recently and I’m building projects on my own for now. I take systems from start to finish, from the database schema and the message flow to the interface and the installer.',
        'I’m most interested in the places where things tend to go wrong: concurrency, failure handling, security boundaries, and keeping AI features grounded in real data. I like to check a design with tests that run against real services.',
      ],
      focus: [
        'Backend engineering with Java and Spring Boot: transactions, messaging, caching and multi-tenancy.',
        'Desktop and web applications with TypeScript, Electron, React and Vue, with attention to detail and accessibility.',
        'AI features grounded in real data, and agent tooling built with isolation in mind.',
      ],
      principles: [
        'Write down what must never happen, then test it.',
        'Choose one obviously correct line over a clever system.',
        'Say plainly what isn’t done yet.',
      ],
      now: 'Looking for a full-time engineering role. If you’re hiring, I’d be glad to hear from you.',
    },
    zh: {
      intro: [
        '我是 Ethan，刚毕业不久的软件工程师，目前在独立做项目。从数据库表设计、消息流转，到前端界面和安装包，我习惯把一个系统从头到尾做完整。',
        '我比较关注容易出问题的地方：并发、故障处理、安全边界，以及怎样让 AI 功能基于真实数据回答。验证一个设计时，我更愿意写测试，放到真实环境里跑一遍。',
      ],
      focus: [
        'Java / Spring Boot 后端开发：事务、消息队列、缓存、多租户。',
        '用 TypeScript、Electron、React、Vue 开发桌面端和 Web 应用，重视细节和无障碍体验。',
        '基于真实数据的 AI 功能，以及注重隔离与安全的 Agent 工具。',
      ],
      principles: ['先写清楚什么事绝对不能发生，再用测试去证明。', '与其设计一套精巧的系统，不如写一行一眼就能看出没问题的代码。', '没做完的部分，就如实写明。'],
      now: '正在找全职的软件工程师工作。如果你们团队在招人，欢迎联系我。',
    },
    ja: {
      intro: [
        'ソフトウェアエンジニアの Ethan です。大学を卒業したばかりで、現在は個人で開発しています。データベースのスキーマやメッセージの流れから、画面やインストーラーまで、システムを一貫して設計・構築しています。',
        '関心があるのは、問題が起きやすいところです。同時実行、障害対応、セキュリティ境界、そして AI 機能を実データに基づかせること。設計は、本物の環境で動くテストで確かめるようにしています。',
      ],
      focus: [
        'Java と Spring Boot によるバックエンド開発：トランザクション、メッセージング、キャッシュ、マルチテナンシー。',
        'TypeScript・Electron・React・Vue によるデスクトップと Web のアプリケーション。細部とアクセシビリティを大切にしています。',
        '実データに基づき、構造的に安全な AI 機能とエージェントツール。',
      ],
      principles: ['起きてはならないことを書き出し、それをテストする。', '巧妙な仕組みより、明らかに正しい一文を選ぶ。', 'まだできていないことは、はっきり言う。'],
      now: 'フルタイムのエンジニア職を探しています。採用をご検討の方は、お気軽にご連絡ください。',
    },
  } satisfies Localized<{ intro: string[]; focus: string[]; principles: string[]; now: string }>,
};

export type SiteConfig = typeof site;

/** All public profile links, GitHub first. */
export function profileLinks(): { label: string; href: string }[] {
  const gh = site.github.username ? [{ label: 'GitHub', href: `https://github.com/${site.github.username}` }] : [];
  return [...gh, ...site.links];
}
