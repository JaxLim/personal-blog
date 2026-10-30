/**
 * Everything personal about the site lives here.
 * Text that readers see has a version for each language: en, zh, ja.
 */
import type { Locale } from './i18n/config';

type Localized<T = string> = Record<Locale, T>;

export const site = {
  /** Shown in the header, the footer and page titles, in every language. */
  name: 'Ethan',

  /**
   * The large statement on the home page. Each string is one line; the
   * lines rise in one after another.
   */
  headline: {
    en: ['I build software', 'that stays correct', 'under pressure.'],
    zh: ['构建在压力之下', '依然正确的软件。'],
    ja: ['負荷がかかっても', '正しく動き続ける', 'ソフトウェアを。'],
  } satisfies Localized<string[]>,

  /** One or two sentences under the headline. */
  tagline: {
    en: 'I’m Ethan, a software engineer. I design backends that survive concurrency and failure, interfaces that feel finished, and AI tools that never invent a number.',
    zh: '我是 Ethan，一名软件工程师。我设计能扛住并发与故障的后端、细节完整的界面，以及从不编造数字的 AI 工具。',
    ja: 'ソフトウェアエンジニアの Ethan です。同時実行や障害に耐えるバックエンド、細部まで仕上げたインターフェース、そして数字をでっち上げない AI ツールを設計しています。',
  } satisfies Localized,

  /**
   * A short availability line with a live dot.
   * Set every value to '' to hide it.
   */
  status: {
    en: 'Open to full-time engineering roles',
    zh: '正在寻找全职工程师职位',
    ja: 'フルタイムのエンジニア職を募集中',
  } satisfies Localized,

  /** Used for search engines and link previews. */
  description: {
    en: 'Ethan, software engineer. Case studies of reliable backends and AI agent tooling, technical writing, and live GitHub activity.',
    zh: '软件工程师 Ethan：可靠后端与 AI Agent 工具的项目案例、技术文章，以及实时 GitHub 动态。',
    ja: 'ソフトウェアエンジニア Ethan。信頼性の高いバックエンドと AI エージェントのケーススタディ、技術記事、GitHub のリアルタイムなアクティビティ。',
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
        'I’m Ethan, a software engineer who has recently graduated and works independently. I design and build systems end to end, from the database schema and the message flow to the interface and the installer.',
        'I’m most at home where correctness is hard: concurrency, failure, security boundaries, and AI features that have to stay honest. I like to prove a design with a test that runs against the real thing.',
      ],
      focus: [
        'Backend engineering with Java and Spring Boot: transactions, messaging, caching and multi-tenancy.',
        'Desktop and web applications with TypeScript, Electron, React and Vue, with attention to detail and accessibility.',
        'AI features and agent tooling that are grounded in real data and safe by construction.',
      ],
      principles: [
        'Write down what must never happen, then test it.',
        'Prefer one obviously correct statement to a clever system.',
        'Say plainly what isn’t done yet.',
      ],
      now: 'Looking for a full-time engineering role. If you’re hiring, I’d be glad to hear from you.',
    },
    zh: {
      intro: [
        '我是 Ethan，一名刚毕业、目前独立开发的软件工程师。我从头到尾地设计和构建系统：从数据库表结构和消息流，到界面和安装包。',
        '我最擅长的是“正确性很难保证”的地方：并发、故障、安全边界，以及必须保持诚实的 AI 功能。我习惯用在真实环境中运行的测试来证明一个设计。',
      ],
      focus: [
        '使用 Java 与 Spring Boot 的后端工程：事务、消息、缓存与多租户。',
        '使用 TypeScript、Electron、React 和 Vue 的桌面与 Web 应用，注重细节与无障碍。',
        '基于真实数据、从构造上保证安全的 AI 功能与 Agent 工具。',
      ],
      principles: ['先写下“绝不能发生什么”，再去测试它。', '宁要一条显然正确的语句，也不要一个精巧的系统。', '还没做完的事，就直说。'],
      now: '正在寻找全职工程师职位。如果你的团队正在招聘，欢迎与我联系。',
    },
    ja: {
      intro: [
        'ソフトウェアエンジニアの Ethan です。大学を卒業したばかりで、現在は個人で開発しています。データベースのスキーマやメッセージの流れから、画面やインストーラーまで、システムを一貫して設計・構築しています。',
        '得意なのは、正しさを保つのが難しい領域です。同時実行、障害、セキュリティ境界、そして誠実であり続けなければならない AI 機能。設計は、本物を相手に動くテストで証明するようにしています。',
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
