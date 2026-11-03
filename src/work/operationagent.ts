import type { CaseStudy } from './types';
import workbench from '../assets/work/operationagent/workbench.png';
import settings from '../assets/work/operationagent/settings.png';
import dark from '../assets/work/operationagent/dark.png';

const C = [20, 215, 420, 625, 820, 1010];
const R = [24, 134, 244, 354, 464];

export const operationagent: CaseStudy = {
  slug: 'operationagent',
  repo: 'OperationAgent',
  name: 'OperationAgent',
  year: '2026',
  motif: 'layers',
  demo: 'gate',
  tagline: {
    en: 'A security-first desktop AI agent. What the agent can access is enforced by the operating system, not by the prompt.',
    zh: '一个安全优先的桌面 AI Agent：Agent 能访问什么，由操作系统来限制，而不是依赖提示词。',
    ja: 'セキュリティを最優先に設計したデスクトップ AI エージェント。エージェントが何に触れられるかを決めるのは、プロンプトではなく OS です。',
  },
  summary: [
    {
      en: 'OperationAgent is an Electron desktop app for running a coding agent on your own machine. The hard question isn’t how to call a model. It’s what happens when the model, a web page or a tool description is hostile. The answer here is an architecture with one place that authorises anything, and an agent process the operating system keeps on a short leash.',
      zh: 'OperationAgent 是一个在本机运行编程 Agent 的 Electron 桌面应用。真正难的不是怎么调用模型，而是模型、网页或工具描述本身不怀好意时该怎么办。我的做法是：所有授权都集中在一个地方，Agent 进程则由操作系统严格限制。',
      ja: 'OperationAgent は、手元のマシンでコーディングエージェントを動かすための Electron デスクトップアプリです。難しいのはモデルの呼び方ではありません。モデルや Web ページ、ツールの説明そのものが悪意を持っていたらどうなるか、です。その答えが、認可を行う場所を一つに絞り、エージェントのプロセスを OS が短い鎖でつなぐアーキテクチャです。',
    },
    {
      en: 'It is being built in gated phases. On Windows x64, the control plane, persistence, installer and the worker-isolation gate have all passed real acceptance. The agent itself stays switched off until its loop and the read-only gate are in place, and the app says so plainly rather than running unprotected.',
      zh: '项目分阶段推进，每个阶段都要过门禁。在 Windows x64 上，控制面、持久化、安装包和 Worker 隔离门禁都已通过真实验收。Agent 循环和只读门禁完成之前，Agent 本身保持关闭；应用会如实说明这一点，而不是在没有保护的情况下运行。',
      ja: '開発はゲート付きのフェーズで進めています。Windows x64 では、コントロールプレーン、永続化、インストーラー、Worker 隔離のゲートが実機の受け入れ試験に合格しました。エージェント本体は、ループと読み取り専用のゲートが揃うまでオフのままで、保護なしで動かす代わりに、アプリはそのことを正直に表示します。',
    },
  ],
  role: {
    en: 'Solo: architecture, ADRs, implementation, CI and release engineering',
    zh: '独立完成：架构设计、ADR、编码实现、CI 与发布',
    ja: '個人開発：アーキテクチャ、ADR、実装、CI とリリースエンジニアリング',
  },
  status: {
    en: 'Milestone M2 in progress. Worker isolation has passed on Windows x64; the agent stays off until its loop and read gate are built.',
    zh: 'M2 阶段进行中。Windows x64 上的 Worker 隔离已验证通过；Agent 循环和只读门禁完成之前，Agent 保持关闭。',
    ja: 'マイルストーン M2 を進行中。Windows x64 では Worker の隔離が検証済みで、ループと読み取りゲートができるまでエージェントは無効です。',
  },
  metrics: [
    { value: '1', label: { en: 'place where any tool call can be authorised', zh: '个地方能授权工具调用', ja: 'か所だけがツール呼び出しを認可できる' } },
    { value: '4', label: { en: 'process roles with written ownership and prohibitions', zh: '个进程角色，职责与禁区都有明文规定', ja: 'つのプロセスの役割と、それぞれの責務・禁止事項' } },
    { value: '16', label: { en: 'architecture decision records, including the Windows isolation ADR', zh: '份架构决策记录，包括 Windows 隔离 ADR', ja: '件のアーキテクチャ決定記録（Windows 隔離の ADR を含む）' } },
    { value: '0', label: { en: 'tools that run without an OS sandbox', zh: '个工具能绕开 OS 沙箱运行', ja: '個のツールも OS サンドボックスなしでは動かない' } },
  ],
  problems: [
    {
      title: { en: 'Prompts are not a security boundary', zh: '提示词不是安全边界', ja: 'プロンプトはセキュリティ境界ではない' },
      problem: {
        en: 'Workspace files, web pages and tool output can all carry instructions. An agent that can be talked into anything will eventually be.',
        zh: '工作区文件、网页和工具输出都可能夹带指令。如果 Agent 什么指令都会照做，迟早会被利用。',
        ja: 'ワークスペースのファイルも Web ページもツールの出力も、指示を紛れ込ませられます。何でも言いくるめられるエージェントは、いずれ必ず言いくるめられます。',
      },
      solution: {
        en: 'The worker is designed as if already compromised. It has no direct file, database, terminal or network access. On Windows it starts inside an AppContainer and a Job object, and that is proven with tests on an installed build, not by reading the code.',
        zh: '设计 Worker 时，就当它已经被攻破：它不能直接访问文件、数据库、终端或网络。在 Windows 上，它一启动就处在 AppContainer 和 Job 对象里，这一点靠在安装版上跑测试来证明，而不是靠读代码。',
        ja: 'Worker は「すでに乗っ取られている」前提で設計しています。ファイル・データベース・端末・ネットワークへの直接アクセスはありません。Windows では AppContainer と Job オブジェクトの中で起動し、それをコードレビューではなく、インストール済みビルドでのテストで証明します。',
      },
      proof: 'ADR-WIN-001 r1',
    },
    {
      title: { en: 'Authorisation scattered across processes', zh: '授权分散在多个进程里', ja: 'プロセスに散らばる認可' },
      problem: {
        en: 'If the UI, the agent and a plugin can each approve a tool, the weakest of them sets the security of all three.',
        zh: '如果界面、Agent 和插件都能各自批准工具调用，整体安全就取决于其中最薄弱的那一个。',
        ja: 'UI もエージェントもプラグインもそれぞれツールを承認できるなら、全体の安全性はいちばん弱いものに決まってしまいます。',
      },
      solution: {
        en: 'Every tool request goes Worker → control plane → channel → control plane → Worker. There is no path from the worker to an executor or an MCP server. Approving a sandboxed tool never removes the sandbox.',
        zh: '每个工具请求都走 Worker → 控制面 → 执行通道 → 控制面 → Worker，Worker 和执行器、MCP Server 之间没有任何直连路径。用户批准了沙箱工具，沙箱也不会因此撤掉。',
        ja: 'ツールのリクエストはすべて Worker → コントロールプレーン → チャネル → コントロールプレーン → Worker と流れます。Worker から実行器や MCP サーバーへの経路は存在しません。サンドボックス付きのツールを承認しても、サンドボックスが外れることはありません。',
      },
      proof: 'check:boundaries',
    },
    {
      title: { en: 'A renderer that could be compromised', zh: '可能被攻破的渲染进程', ja: '侵害されうるレンダラー' },
      problem: {
        en: 'An XSS or a poisoned dependency in the UI must not become access to the local API.',
        zh: '界面里就算出现 XSS 或被投毒的依赖，也不能借此访问本地 API。',
        ja: 'UI の XSS や汚染された依存関係が、ローカル API へのアクセスにつながってはいけません。',
      },
      solution: {
        en: 'Renderer → Preload → Main → Express, nothing shorter. Preload exposes a narrow, validated interface; Main checks the sender frame and forwards over an authenticated loopback channel that is not a general HTTP proxy.',
        zh: '只允许走 Renderer → Preload → Main → Express 这一条路，没有捷径。Preload 只暴露少量经过校验的接口；Main 校验 senderFrame 后，再通过带认证的回环通道转发，而这条通道并不是通用的 HTTP 代理。',
        ja: '経路は Renderer → Preload → Main → Express だけです。Preload は検証付きの狭いインターフェースだけを公開し、Main は senderFrame を確認したうえで、認証付きのループバック経路で転送します。これは汎用の HTTP プロキシではありません。',
      },
      proof: 'P1 exit report',
    },
    {
      title: { en: 'Crashes that leave orphans behind', zh: '崩溃后遗留的孤儿进程', ja: 'クラッシュ後に残る孤児プロセス' },
      problem: {
        en: 'If the control plane restarts while an old worker is still running, two brains can act on the same task.',
        zh: '如果控制面重启时旧的 Worker 还没退出，同一个任务就可能有“两个大脑”同时在操作。',
        ja: 'コントロールプレーンの再起動中に古い Worker が動いていると、同じタスクに二つの「頭脳」が手を出しかねません。',
      },
      solution: {
        en: 'Main supervises the control plane’s whole process tree; the control plane supervises its worker. Every message carries run ids, stale ones are rejected, restarts have a budget, and nothing with side effects is dispatched until cleanup is confirmed.',
        zh: 'Main 监管控制面的整棵进程树，控制面监管自己的 Worker。每条消息都带有运行 ID，过期的一律拒绝；重启有次数预算；清理确认完成之前，任何有副作用的操作都不会下发。',
        ja: 'Main がコントロールプレーンのプロセスツリー全体を、コントロールプレーンが自分の Worker を監督します。メッセージにはすべて実行 ID が付き、古いものは拒否します。再起動には上限があり、後始末が確認されるまで副作用のあるツールは配りません。',
      },
      proof: 'installed-smoke.json',
    },
    {
      title: { en: 'Claiming more than you have proven', zh: '宣称的比证明的多', ja: '証明した以上のことを主張する' },
      problem: {
        en: 'It is tempting to ship the agent and harden it later.',
        zh: '先让 Agent 跑起来、之后再补安全，是一种很常见的做法。',
        ja: 'まずエージェントを出して、堅牢化は後で。そうしたくなるものです。',
      },
      solution: {
        en: 'A capability matrix reports each capability as unverified or unavailable until its gate passes in a real installed build. Starting a task returns WORKER_ISOLATION_UNAVAILABLE rather than running without isolation.',
        zh: '在真实安装版上通过门禁之前，能力矩阵会把每项能力标成“未验证”或“不可用”。发起任务会直接返回 WORKER_ISOLATION_UNAVAILABLE，而不是在没有隔离的情况下运行。',
        ja: '能力マトリクスは、実際にインストールしたビルドでゲートを通過するまで、各能力を「未検証」または「利用不可」と表示します。タスクを開始すると、隔離なしで実行する代わりに WORKER_ISOLATION_UNAVAILABLE を返します。',
      },
      proof: 'SEC-W01',
    },
    {
      title: { en: 'Builds you can’t reproduce', zh: '无法复现的构建', ja: '再現できないビルド' },
      problem: {
        en: 'A desktop app that bundles its own Node runtime is only as trustworthy as the runtime and native modules it ships.',
        zh: '桌面应用自带 Node 运行时，那它有多可信，就取决于打包进去的运行时和原生模块有多可信。',
        ja: '独自の Node ランタイムを同梱するデスクトップアプリの信頼性は、同梱するランタイムとネイティブモジュール次第です。',
      },
      solution: {
        en: 'Node and pnpm are pinned and verified by hash before use, the sidecar manifest binds the Node ABI and native file hashes, and every acceptance run commits its raw logs as evidence.',
        zh: 'Node 与 pnpm 版本锁定，使用前校验哈希；sidecar 清单绑定 Node ABI 与原生文件哈希；每次验收都会把原始日志作为证据提交。',
        ja: 'Node と pnpm はバージョンを固定し、使う前にハッシュを検証します。サイドカーのマニフェストは Node の ABI とネイティブファイルのハッシュを束ね、受け入れ試験のたびに生ログを証拠としてコミットします。',
      },
      proof: 'runtime-lock.json',
    },
  ],
  stack: [
    { group: { en: 'Desktop', zh: '桌面端', ja: 'デスクトップ' }, items: ['Electron', 'React', 'TypeScript', 'electron-builder (NSIS)'] },
    { group: { en: 'Control plane', zh: '控制面', ja: 'コントロールプレーン' }, items: ['Node.js 24', 'Express', 'SQLite (better-sqlite3)', 'JSON-RPC 2.0'] },
    { group: { en: 'Isolation (Windows)', zh: '隔离（Windows）', ja: '隔離（Windows）' }, items: ['AppContainer', 'Job objects', 'C++ native launcher', 'inherited Win32 pipes'] },
    { group: { en: 'Engineering', zh: '工程化', ja: 'エンジニアリング' }, items: ['pnpm workspaces', 'ESLint boundaries', 'GitHub Actions', 'ADRs'] },
  ],
  diagramIntro: {
    en: 'Four process roles, each with a written list of what it may and may not do. The control plane is the only writer to the database and the only place a tool can be authorised.',
    zh: '四种进程角色，每种都有明文规定能做什么、不能做什么。控制面是数据库唯一的写入者，也是唯一能授权工具调用的地方。',
    ja: '四つのプロセスの役割には、それぞれ「してよいこと」と「してはいけないこと」が明文化されています。コントロールプレーンはデータベースへの唯一の書き手であり、ツールを認可できる唯一の場所です。',
  },
  demoIntro: {
    en: 'Start a task the way the app does today. Then open the remaining gates to see the path they unlock. In the real app, only passing tests on an installed build can open them.',
    zh: '先像现在的应用一样发起一个任务，再把剩下的门禁打开，看看会多出哪条路径。在真实应用里，只有安装版上的测试通过了，门禁才会打开。',
    ja: '今のアプリと同じようにタスクを開始してみてください。次に残りのゲートを開くと、使えるようになる経路がわかります。実際のアプリでゲートを開けられるのは、インストール済みビルドで合格したテストだけです。',
  },
  diagram: {
    width: 1180,
    height: 546,
    nodes: [
      { id: 'renderer', x: C[0], y: R[2], label: 'Renderer', tone: 'client', sub: { en: 'React UI', zh: 'React 界面', ja: 'React UI' }, detail: { en: 'Shows state and collects input, including approvals. It cannot import the runtime, open files or reach the local API directly.', zh: '负责展示状态、收集输入（包括审批）。不能引入运行时模块、不能打开文件，也不能直接访问本地 API。', ja: '状態の表示と、承認を含む入力の受け付けを担います。ランタイムの読み込みやファイルを開くこと、ローカル API への直接アクセスはできません。' } },
      { id: 'preload', x: C[1], y: R[2], label: 'Preload', sub: { en: 'contextBridge', zh: 'contextBridge', ja: 'contextBridge' }, detail: { en: 'Exposes a narrow interface and checks the basic shape of every argument. Never the raw ipcRenderer, Node, or a generic file proxy.', zh: '只暴露少量接口，并检查每个参数的基本格式。绝不暴露原始的 ipcRenderer、Node 或通用的文件代理。', ja: '狭いインターフェースだけを公開し、引数の形を一つずつ確認します。生の ipcRenderer や Node、汎用のファイルプロキシは決して公開しません。' } },
      { id: 'main', x: C[2], y: R[2], label: 'Electron Main', tone: 'core', sub: { en: 'lifecycle · proxy', zh: '生命周期 · 代理', ja: 'ライフサイクル · プロキシ' }, detail: { en: 'Windows, lifecycle, health checks and the whitelisted API proxy. Starts and supervises the control plane with a bundled, pinned Node runtime; never runs the agent.', zh: '负责窗口、生命周期、健康检查和白名单 API 代理。使用随应用打包、版本锁定的 Node 运行时启动并监管控制面；从不运行 Agent。', ja: 'ウィンドウ、ライフサイクル、ヘルスチェック、ホワイトリスト方式の API プロキシ。同梱しバージョンを固定した Node ランタイムでコントロールプレーンを起動・監督しますが、エージェントは決して動かしません。' } },
      { id: 'express', x: C[3], y: R[2], label: 'Control plane', tone: 'core', sub: { en: 'Express · rules · audit', zh: 'Express · 规则 · 审计', ja: 'Express · ルール · 監査' }, detail: { en: 'The trusted core: identity, policy, approvals, task state, tool routing and audit. The only process that writes to the database or authorises a tool.', zh: '受信任的核心：身份、策略、审批、任务状态、工具路由与审计。唯一能写数据库、能授权工具的进程。', ja: '信頼された中核。ID、ポリシー、承認、タスクの状態、ツールのルーティング、監査を担います。データベースに書き込み、ツールを認可できる唯一のプロセスです。' } },
      { id: 'store', x: C[3], y: R[0], label: 'SQLite', tone: 'store', sub: { en: 'single writer', zh: '唯一写入者', ja: '書き手は一つ' }, detail: { en: 'Versioned SQL migrations, opened only by the control plane. The renderer can never supply a database path.', zh: '使用带版本的 SQL 迁移，只由控制面打开。渲染进程永远无法提供数据库路径。', ja: 'バージョン付きの SQL マイグレーションを使い、開くのはコントロールプレーンだけです。レンダラーがデータベースのパスを渡すことはできません。' } },
      { id: 'worker', x: C[3], y: R[4], label: 'Agent worker', sub: { en: 'AppContainer + Job', zh: 'AppContainer + Job', ja: 'AppContainer + Job' }, detail: { en: 'The agent loop: reasoning, planning and tool requests. A direct child of the control plane over one inherited pipe, with no file, database, terminal or network access of its own.', zh: 'Agent 循环：推理、规划和工具请求。它是控制面的直接子进程，只通过一条继承的管道通信，自身没有文件、数据库、终端或网络权限。', ja: 'エージェントのループ（推論、計画、ツールの要求）。コントロールプレーンの直接の子プロセスで、継承した一本のパイプだけでつながり、自前のファイル・DB・端末・ネットワークへのアクセスは持ちません。' } },
      { id: 'gateway', x: C[4], y: R[0], label: 'Model gateway', sub: { en: 'credentials stay here', zh: '凭据只留在这里', ja: '認証情報はここだけ' }, detail: { en: 'Uses provider credentials on the worker’s behalf and adapts between providers. Keys never reach the worker, the renderer or the logs.', zh: '代 Worker 持有和使用供应商凭据，并适配不同的模型供应商。密钥绝不会出现在 Worker、渲染进程或日志里。', ja: 'Worker の代わりにプロバイダーの認証情報を使い、プロバイダー間の差を吸収します。鍵が Worker やレンダラー、ログに届くことはありません。' } },
      { id: 'llm', x: C[5], y: R[0], label: 'Model provider', tone: 'external', sub: { en: 'untrusted output', zh: '输出不可信', ja: '出力は信頼しない' }, detail: { en: 'Treated like any other untrusted input. Its output can request tools; it can never grant them.', zh: '和其他不可信输入一视同仁。它的输出可以申请调用工具，但永远批准不了。', ja: 'ほかの信頼できない入力と同じように扱います。出力でツールを要求することはできても、許可することはできません。' } },
      { id: 'router', x: C[4], y: R[2], label: 'Tool router', sub: { en: 'validate · authorise', zh: '校验 · 授权', ja: '検証 · 認可' }, detail: { en: 'Routes by static tool class and capability whitelist. A language model never decides whether something is dangerous.', zh: '按静态工具类别和能力白名单路由。是否危险，不交给大模型判断。', ja: '静的なツール種別と能力のホワイトリストでルーティングします。危険かどうかを言語モデルに判断させることはありません。' } },
      { id: 'read', x: C[5], y: R[1], label: 'Read adapter', sub: { en: 'authorised, read-only', zh: '经授权，只读', ja: '認可済み · 読み取り専用' }, detail: { en: 'Read-only access inside an authorised workspace, and read-only git queries. Never shell string concatenation.', zh: '在已授权的工作区内只读访问，以及只读的 Git 查询。绝不拼接 Shell 字符串执行。', ja: '認可されたワークスペース内での読み取りと、読み取り専用の Git 操作。シェル文字列を連結して実行することはありません。' } },
      { id: 'sandbox', x: C[5], y: R[2], label: 'Sandbox launcher', sub: { en: 'short-lived OS sandbox', zh: '用完即毁的 OS 沙箱', ja: '短命な OS サンドボックス' }, detail: { en: 'Builds an OS-sandboxed process from an approved execution profile, with resource limits and process-group cleanup. Unsupported downgrades are refused.', zh: '按已批准的执行配置创建 OS 沙箱进程，设置资源上限，并按进程组统一回收。不支持的降级一律拒绝。', ja: '承認済みの実行プロファイルから OS サンドボックス付きのプロセスを作り、リソース制限とプロセスグループ単位の後始末を行います。対応していない格下げは拒否します。' } },
      { id: 'mcp', x: C[5], y: R[3], label: 'MCP host', tone: 'external', sub: { en: 'restricted connections', zh: '受控连接', ja: '制限付き接続' }, detail: { en: 'Discovers and calls MCP tools through controlled connections. It never trusts a server’s description of its own permissions.', zh: '通过受控连接发现和调用 MCP 工具。不采信 MCP Server 对自身权限的描述。', ja: '制御された接続で MCP ツールを発見し、呼び出します。サーバーが自己申告する権限は決して信用しません。' } },
    ],
    edges: [
      { id: 'renderer-preload', from: 'renderer', to: 'preload' },
      { id: 'preload-main', from: 'preload', to: 'main' },
      { id: 'main-express', from: 'main', to: 'express' },
      { id: 'express-store', from: 'express', to: 'store', axis: 'v' },
      { id: 'express-worker', from: 'express', to: 'worker', axis: 'v', label: { en: 'OWIP/1 pipe', zh: 'OWIP/1 管道', ja: 'OWIP/1 パイプ' } },
      { id: 'express-gateway', from: 'express', to: 'gateway', axis: 'h' },
      { id: 'gateway-llm', from: 'gateway', to: 'llm' },
      { id: 'express-router', from: 'express', to: 'router' },
      { id: 'router-read', from: 'router', to: 'read', axis: 'h' },
      { id: 'router-sandbox', from: 'router', to: 'sandbox' },
      { id: 'router-mcp', from: 'router', to: 'mcp', axis: 'h' },
    ],
    traces: [
      {
        id: 'today',
        label: { en: 'Start a task today', zh: '现在发起任务', ja: '今日タスクを開始する' },
        steps: [
          { edge: 'renderer-preload', note: { en: 'You start a task in the Workbench. The renderer can only call what Preload exposes.', zh: '你在工作台中发起任务。渲染进程只能调用 Preload 暴露的接口。', ja: 'Workbench でタスクを開始します。レンダラーが呼べるのは Preload が公開したものだけです。' } },
          { edge: 'preload-main', note: { en: 'Preload checks the shape of the call; Main checks which frame sent it.', zh: 'Preload 检查参数格式，Main 检查请求来自哪个 frame。', ja: 'Preload が呼び出しの形を確認し、Main が送信元のフレームを確認します。' } },
          { edge: 'main-express', note: { en: 'Main forwards it over the authenticated loopback channel to the control plane.', zh: 'Main 通过带认证的回环通道，把请求转发给控制面。', ja: 'Main が認証付きのループバック経路でコントロールプレーンへ転送します。' } },
          { node: 'express', blocked: true, note: { en: 'Worker isolation has passed on Windows x64, but the agent loop isn’t built yet, so agentReady is false. The task is refused with WORKER_ISOLATION_UNAVAILABLE instead of running unprotected.', zh: 'Windows x64 上的 Worker 隔离已经通过，但 Agent 循环还没做完，所以 agentReady 仍是 false。任务直接以 WORKER_ISOLATION_UNAVAILABLE 被拒绝，不会在没有保护的情况下运行。', ja: 'Windows x64 では Worker の隔離に合格していますが、エージェントのループがまだないため agentReady は false です。保護なしで実行する代わりに、タスクは WORKER_ISOLATION_UNAVAILABLE で拒否されます。' } },
        ],
      },
      {
        id: 'tool',
        label: { en: 'A tool call, as designed', zh: '按设计的工具调用流程', ja: '設計どおりのツール呼び出し' },
        steps: [
          { edge: 'main-express', note: { en: 'Once the gate passes, the same request reaches the control plane.', zh: '门禁通过后，同样的请求来到控制面。', ja: 'ゲートを通過すると、同じリクエストがコントロールプレーンに届きます。' } },
          { edge: 'express-worker', note: { en: 'The control plane starts the worker as its direct child: restricted from its first instruction, one inherited pipe, no listening ports.', zh: '控制面把 Worker 作为直接子进程启动：从执行第一条指令起就受限，只有一条继承来的管道，不监听任何端口。', ja: 'コントロールプレーンが Worker を直接の子として起動します。最初の命令から制限され、継承したパイプは一本だけ、待ち受けポートはありません。' } },
          { edge: 'express-worker', reverse: true, note: { en: 'The worker plans and asks for a tool. The request comes back to the control plane: the only place it can be authorised.', zh: 'Worker 规划好后申请调用工具。请求回到控制面，也就是唯一能做授权的地方。', ja: 'Worker が計画を立ててツールを要求します。リクエストは、認可できる唯一の場所であるコントロールプレーンへ戻ります。' } },
          { edge: 'express-router', note: { en: 'The router validates it against static tool classes and the approval policy.', zh: '路由器按静态的工具类别和审批策略校验请求。', ja: 'ルーターが静的なツール種別と承認ポリシーに照らして検証します。' } },
          { edge: 'router-sandbox', note: { en: 'A high-risk tool runs in a short-lived OS sandbox. Your approval does not remove the sandbox.', zh: '高风险工具在用完即销毁的 OS 沙箱里运行。即使用户批准，沙箱依然生效。', ja: '高リスクのツールは短命な OS サンドボックスで動きます。承認してもサンドボックスは外れません。' } },
          { edge: 'express-store', note: { en: 'The result and the audit record are written by the only writer.', zh: '结果和审计记录由唯一有写权限的控制面写入。', ja: '結果と監査記録は、唯一の書き手が書き込みます。' } },
        ],
      },
      {
        id: 'model',
        label: { en: 'A model call', zh: '一次模型调用', ja: 'モデルの呼び出し' },
        steps: [
          { edge: 'express-worker', reverse: true, note: { en: 'The worker asks for inference. It has no network access and no keys.', zh: 'Worker 请求模型推理。它既不能联网，也拿不到密钥。', ja: 'Worker が推論を求めます。Worker にはネットワークも鍵もありません。' } },
          { edge: 'express-gateway', note: { en: 'The control plane hands it to the model gateway, which holds the provider credentials.', zh: '控制面把请求交给持有供应商凭据的模型网关。', ja: 'コントロールプレーンが、プロバイダーの認証情報を持つモデルゲートウェイへ渡します。' } },
          { edge: 'gateway-llm', note: { en: 'The provider’s answer comes back as untrusted data. It can propose tools, never approve them.', zh: '模型的回答会被当作不可信数据。它可以建议调用工具，但永远批准不了。', ja: 'プロバイダーの回答は信頼できないデータとして戻ります。ツールを提案はできても、承認はできません。' } },
        ],
      },
    ],
  },
  screens: [
    {
      image: workbench,
      alt: { en: 'OperationAgent workbench on Windows: a task refused by the control plane, with the status panel showing agentReady false', zh: 'Windows 上的 OperationAgent 工作台：任务被控制面拒绝，状态面板显示 agentReady 为 false', ja: 'Windows 上の OperationAgent のワークベンチ。コントロールプレーンがタスクを拒否し、ステータスパネルに agentReady false と表示されている' },
      caption: { en: 'Today’s build refuses the task instead of running it unprotected', zh: '当前版本会直接拒绝任务，而不是在没有保护的情况下执行', ja: '現在のビルドは、保護なしで実行せずにタスクを拒否する' },
    },
    {
      image: settings,
      alt: { en: 'Models & Credentials settings with Claude model choices and an API key field', zh: '模型与凭据设置：Claude 模型选择和 API Key 输入框', ja: 'Claude モデルの選択と API キー欄がある「Models & Credentials」設定' },
      caption: { en: 'Model settings: the key is encrypted by the OS and never reaches the worker', zh: '模型设置：API Key 由操作系统加密，Worker 永远拿不到', ja: 'モデル設定：キーは OS で暗号化され、Worker には渡らない' },
    },
    {
      image: dark,
      alt: { en: 'The workbench in dark theme, with the Files panel explaining that file reading is locked', zh: '深色主题下的工作台，文件面板说明读取文件的能力尚未开放', ja: 'ダークテーマのワークベンチ。Files パネルにファイル読み取りがロックされている理由が表示されている' },
      caption: { en: 'Locked features say why they are locked', zh: '尚未开放的功能，都会说明原因', ja: 'ロック中の機能は、その理由を表示する' },
    },
  ],
  lessons: [
    {
      en: 'Writing down what each process must never do turned out to be more useful than writing down what it does. Prohibitions are testable.',
      zh: '后来发现，写清楚每个进程“绝不能做什么”，比写清楚“它要做什么”更有用，因为禁止项是可以测试的。',
      ja: '各プロセスが「決してしてはいけないこと」を書き出すほうが、「何をするか」を書くより役に立ちました。禁止事項はテストできるからです。',
    },
    {
      en: 'Some platform behaviour could only be settled by experiment. The Windows isolation choice came out of a dozen recorded runs, not a design meeting.',
      zh: '有些平台行为只能靠实验摸清楚。Windows 隔离方案来自十几轮有记录的实验，而不是会议上的决定。',
      ja: 'プラットフォームの挙動には実験でしか決められないものがあります。Windows の隔離方式は、設計会議ではなく十数回の記録付きの実験から決まりました。',
    },
    {
      en: 'Next: with the Windows isolation gate passed, build the read gate and the agent loop, then bring the first read-only tools across, one capability at a time.',
      zh: '下一步：Windows 隔离门禁已经通过，接下来做只读门禁和 Agent 循环，再把第一批只读工具一项一项接进来。',
      ja: '次は、通過済みの Windows 隔離ゲートの上に読み取りゲートとエージェントのループを作り、最初の読み取り専用ツールを能力ごとに一つずつ移していきます。',
    },
  ],
};
