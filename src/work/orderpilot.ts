import type { CaseStudy } from './types';
import dashboard from '../assets/work/orderpilot/dashboard.png';
import dashboardZh from '../assets/work/orderpilot/dashboard-zh.png';
import orders from '../assets/work/orderpilot/orders.png';
import ordersZh from '../assets/work/orderpilot/orders-zh.png';
import assistant from '../assets/work/orderpilot/assistant.png';
import assistantZh from '../assets/work/orderpilot/assistant-zh.png';
import inventory from '../assets/work/orderpilot/inventory.png';

const C = [20, 215, 420, 625, 820, 1010];
const R = [24, 134, 244, 354, 464];

export const orderpilot: CaseStudy = {
  slug: 'orderpilot',
  repo: 'OrderPilot',
  name: 'OrderPilot',
  year: '2026',
  motif: 'ledger',
  demo: 'oversell',
  tagline: {
    en: 'A multi-tenant order and inventory SaaS where stock can’t oversell, retries can’t double-charge, and the AI copilot can’t invent a number.',
    zh: '一个多租户订单与库存 SaaS：库存不会超卖，重试不会重复扣款，AI 助手也不会编造数字。',
    ja: '在庫が売り越されず、リトライで二重課金されず、AI コパイロットが数字をでっち上げない、マルチテナントの受注・在庫 SaaS。',
  },
  summary: [
    {
      en: 'OrderPilot is a small product with the hard parts left in. A Spring Boot modular monolith takes orders for several companies at once, reserves stock under heavy concurrency, takes payments, cancels unpaid orders on time and notifies people when things change. A Vue 3 dashboard and an AI copilot sit on top.',
      zh: 'OrderPilot 是一个“麻烦都留着”的小产品。一个 Spring Boot 模块化单体同时为多家公司处理订单：在高并发下锁定库存、收款、按时取消未支付订单，并在状态变化时发出通知。上层是 Vue 3 管理后台和一个 AI 业务助手。',
      ja: 'OrderPilot は、難しい部分をあえて残した小さなプロダクトです。Spring Boot のモジュラーモノリスが複数の企業の注文を同時に受け付け、高い同時実行下で在庫を引き当て、決済を処理し、未払いの注文を期限どおりにキャンセルし、状態が変わるたびに通知します。その上に Vue 3 のダッシュボードと AI コパイロットがあります。',
    },
    {
      en: 'Every guarantee on this page is backed by a test that runs against real MySQL, Redis and RabbitMQ in containers, not mocks.',
      zh: '本页提到的每一项保证，都有对应的测试，并且是在容器中的真实 MySQL、Redis 和 RabbitMQ 上运行，而不是 Mock。',
      ja: 'このページで挙げる保証は、どれもモックではなく、コンテナ上の本物の MySQL・Redis・RabbitMQ に対して実行されるテストで裏づけています。',
    },
  ],
  role: {
    en: 'Solo: product design, backend, frontend, tests and delivery',
    zh: '独立完成：产品设计、后端、前端、测试与交付',
    ja: '個人開発：プロダクト設計、バックエンド、フロントエンド、テスト、デリバリー',
  },
  status: {
    en: 'Complete demo. Runs with one docker compose command.',
    zh: '功能完整的演示版，一条 docker compose 命令即可运行。',
    ja: '機能が揃ったデモ。docker compose コマンド一つで起動します。',
  },
  metrics: [
    { value: '40 → 10', label: { en: 'concurrent buyers for 10 units, exactly 10 orders', zh: '40 个并发买家抢 10 件库存，恰好 10 单成交', ja: '10 個の在庫に 40 人が同時購入、成立はちょうど 10 件' } },
    { value: '15 → 1', label: { en: 'duplicate submissions, one order', zh: '15 次重复提交，只生成 1 个订单', ja: '15 回の重複送信で注文は 1 件' } },
    { value: '3', label: { en: 'independent layers of tenant isolation', zh: '层相互独立的租户隔离', ja: '層の独立したテナント分離' } },
    { value: '37', label: { en: 'automated tests: Testcontainers and Playwright', zh: '个自动化测试：Testcontainers 与 Playwright', ja: '件の自動テスト（Testcontainers と Playwright）' } },
  ],
  problems: [
    {
      title: { en: 'Overselling under concurrency', zh: '高并发下的超卖', ja: '同時実行下での売り越し' },
      problem: {
        en: 'Read the stock, check it, then write it back, and two buyers can both see the last unit.',
        zh: '先读库存、再判断、再写回，两个买家就可能同时看到最后一件。',
        ja: '在庫を読み、確認し、書き戻す。この順序だと、二人の購入者が同時に最後の一個を見てしまいます。',
      },
      solution: {
        en: 'One conditional statement, UPDATE … SET available = available − q WHERE available ≥ q. The database checks and decrements atomically; lines are locked in product order so multi-line orders cannot deadlock.',
        zh: '只用一条条件更新语句：UPDATE … SET available = available − q WHERE available ≥ q，由数据库原子地完成检查和扣减；多行订单按商品 ID 顺序加锁，避免死锁。',
        ja: '条件付きの UPDATE 一文（UPDATE … SET available = available − q WHERE available ≥ q）で、確認と減算をデータベースが原子的に行います。複数行の注文は商品 ID 順にロックし、デッドロックを防ぎます。',
      },
      proof: 'InventoryConcurrencyIT',
    },
    {
      title: { en: 'Duplicate submissions', zh: '重复提交', ja: '重複送信' },
      problem: {
        en: 'A double click or a client retry must not create a second order or a second charge.',
        zh: '双击或客户端重试，不能生成第二个订单，也不能扣第二次钱。',
        ja: 'ダブルクリックやクライアントのリトライで、注文や課金が二重になってはいけません。',
      },
      solution: {
        en: 'An Idempotency-Key header claimed with Redis SET NX, the response stored for replay, and a unique key in MySQL as the last line of defence when Redis is down.',
        zh: '请求携带 Idempotency-Key，用 Redis SET NX 抢占并保存响应以便重放；Redis 不可用时，MySQL 上的唯一索引作为最后一道防线。',
        ja: 'Idempotency-Key ヘッダーを Redis の SET NX で確保し、レスポンスを保存して再送時に返します。Redis が落ちていても、MySQL のユニークキーが最後の防衛線になります。',
      },
      proof: 'IdempotencyIT',
    },
    {
      title: { en: 'Database and broker drifting apart', zh: '数据库与消息队列不一致', ja: 'DB とメッセージブローカーのずれ' },
      problem: {
        en: 'Commit the order, then publish an event, and a crash in between loses the event for good.',
        zh: '先提交订单再发消息，中间一旦崩溃，事件就永远丢了。',
        ja: '注文をコミットしてからイベントを発行すると、その間にクラッシュした時点でイベントは失われます。',
      },
      solution: {
        en: 'A transactional outbox: events are rows written in the same transaction as the state change. A relay publishes them with publisher confirms and FOR UPDATE SKIP LOCKED, so several instances can share the work.',
        zh: '事务性 Outbox：事件作为数据行，与状态变更在同一事务中写入。中继进程通过 publisher confirms 和 FOR UPDATE SKIP LOCKED 投递，多实例也能安全分担。',
        ja: 'トランザクショナル・アウトボックス：イベントは状態変更と同じトランザクションで行として書き込みます。リレーが publisher confirms と FOR UPDATE SKIP LOCKED で配信するので、複数インスタンスでも安全に分担できます。',
      },
      proof: 'OrderLifecycleIT',
    },
    {
      title: { en: 'Unpaid orders holding stock', zh: '未支付订单占着库存', ja: '未払い注文による在庫の拘束' },
      problem: {
        en: 'Stock reserved by abandoned orders has to come back on time, and “pay” racing “expire” must have exactly one winner.',
        zh: '被放弃的订单占用的库存要按时释放，而且“支付”和“超时”同时发生时，必须恰好只有一方成功。',
        ja: '放置された注文が押さえた在庫は期限どおりに戻す必要があり、「支払い」と「期限切れ」が競合したときは勝者がちょうど一方でなければなりません。',
      },
      solution: {
        en: 'A RabbitMQ TTL queue dead-letters each order at its deadline; a sweeper covers broker outages. Both sides use a compare-and-set on the status, and money captured for an order that just expired is refunded automatically.',
        zh: 'RabbitMQ 的 TTL 队列在截止时刻把订单转入死信队列，定时清扫任务兜底消息中间件故障。双方都对状态做 CAS 更新；如果付款恰好落在已过期的订单上，系统会自动退款。',
        ja: 'RabbitMQ の TTL キューが期限ちょうどに注文をデッドレターへ送り、ブローカー障害時はスイーパーが補います。どちらもステータスを CAS で更新し、期限切れ直後の注文に入った支払いは自動で返金します。',
      },
      proof: 'OrderLifecycleIT',
    },
    {
      title: { en: 'One tenant seeing another’s data', zh: '租户之间的数据泄露', ja: 'テナント間のデータ漏えい' },
      problem: {
        en: 'In a shared schema, one forgotten WHERE clause leaks a customer’s orders to another company.',
        zh: '共享表结构下，只要漏写一个 WHERE 条件，一家公司的订单就会泄露给另一家。',
        ja: 'スキーマを共有していると、WHERE 句を一つ書き忘れただけで、ある企業の注文が別の企業に見えてしまいます。',
      },
      solution: {
        en: 'The tenant comes only from the signed JWT, every query filters on it, and a MyBatis interceptor rejects any statement on a tenant table that doesn’t. Reads across tenants return 404, so existence doesn’t leak either.',
        zh: '租户 ID 只来自签名的 JWT，所有查询都按它过滤；MyBatis 拦截器会直接拒绝任何未带 tenant_id 条件的租户表语句。跨租户读取返回 404，连“是否存在”都不泄露。',
        ja: 'テナントは署名済み JWT からのみ取得し、すべてのクエリをそれで絞り込みます。さらに MyBatis のインターセプターが、tenant_id 条件のないテナントテーブルへの文を拒否します。他テナントの読み取りは 404 を返すので、存在自体も漏れません。',
      },
      proof: 'SecurityAndTenancyIT',
    },
    {
      title: { en: 'An assistant that makes numbers up', zh: '会编造数字的 AI 助手', ja: '数字を作ってしまうアシスタント' },
      problem: {
        en: 'A language model asked about revenue will happily produce a plausible figure.',
        zh: '问大模型营收是多少，它会很乐意给出一个看似合理的数字。',
        ja: '売上を聞かれた言語モデルは、もっともらしい数字を平気で答えます。',
      },
      solution: {
        en: 'Spring AI function calling with read-only tools bound to the caller’s tenant on the server. Every answer lists the tools it used, and without an API key a deterministic offline analyst answers from the same tools.',
        zh: '使用 Spring AI 的函数调用，工具全部只读，并在服务端绑定调用者的租户。每个回答都会注明用到了哪些工具；没有配置 API Key 时，由确定性的离线分析器调用同一套工具作答。',
        ja: 'Spring AI の関数呼び出しで、サーバー側で呼び出し元のテナントに束縛した読み取り専用ツールだけを使わせます。回答には使ったツールを必ず表示し、API キーがない場合は同じツールを使う決定的なオフラインアナリストが答えます。',
      },
      proof: 'dashboardAndAssistantReflectRealData',
    },
  ],
  stack: [
    { group: { en: 'Backend', zh: '后端', ja: 'バックエンド' }, items: ['Java 21', 'Spring Boot 3.5', 'Spring Security', 'MyBatis', 'Flyway', 'Spring AI'] },
    { group: { en: 'Data and messaging', zh: '数据与消息', ja: 'データとメッセージング' }, items: ['MySQL 8.4', 'Redis 7', 'RabbitMQ 3'] },
    { group: { en: 'Frontend', zh: '前端', ja: 'フロントエンド' }, items: ['Vue 3', 'TypeScript', 'Vite', 'Pinia', 'Element Plus', 'ECharts', 'vue-i18n'] },
    { group: { en: 'Quality and delivery', zh: '质量与交付', ja: '品質とデリバリー' }, items: ['JUnit 5', 'Testcontainers', 'Playwright', 'Docker Compose', 'GitHub Actions'] },
  ],
  diagramIntro: {
    en: 'One deployable application, split by business capability. Modules call each other through service methods; side effects travel as events through the outbox.',
    zh: '一个可部署单元，按业务能力拆分模块。模块之间通过服务方法调用，副作用则以事件形式经由 Outbox 传递。',
    ja: 'デプロイ単位は一つで、業務の機能ごとにモジュールを分けています。モジュール同士はサービスメソッドで呼び合い、副作用はイベントとしてアウトボックス経由で伝わります。',
  },
  demoIntro: {
    en: 'Forty buyers race for ten units. Run it with a naive read-then-write, then with the single conditional UPDATE OrderPilot uses.',
    zh: '40 个买家争抢 10 件库存。先用“先读后写”的朴素做法跑一遍，再换成 OrderPilot 使用的单条条件 UPDATE。',
    ja: '10 個の在庫を 40 人が奪い合います。素朴な「読んでから書く」方式と、OrderPilot が使う条件付き UPDATE 一文で、それぞれ実行してみてください。',
  },
  diagram: {
    width: 1180,
    height: 546,
    nodes: [
      { id: 'spa', x: C[0], y: R[2], label: 'Vue 3 SPA', tone: 'client', sub: { en: 'dashboard · EN / 中文', zh: '管理后台 · 中英双语', ja: 'ダッシュボード · 英中' }, detail: { en: 'The dashboard: orders, inventory, payments, team and the copilot. It hides what a role can’t do, but the server is the authority.', zh: '管理后台：订单、库存、支付、团队与 AI 助手。界面会隐藏当前角色无权使用的功能，但真正做决定的是服务端。', ja: '注文・在庫・決済・チーム・コパイロットを扱うダッシュボード。権限のない操作は画面から隠しますが、判断するのはあくまでサーバーです。' } },
      { id: 'api', x: C[1], y: R[2], label: 'API', tone: 'core', sub: { en: 'Spring Security · JWT', zh: 'Spring Security · JWT', ja: 'Spring Security · JWT' }, detail: { en: 'Stateless JWT with a deny-list for logout, permission-based RBAC, rate limits, and the tenant taken from the token, never from a header.', zh: '无状态 JWT（注销时加入黑名单）、基于权限的 RBAC、限流；租户只从令牌中取得，绝不从请求头读取。', ja: 'ログアウト用の拒否リスト付きステートレス JWT、権限ベースの RBAC、レート制限。テナントはヘッダーではなく必ずトークンから取得します。' } },
      { id: 'catalog', x: C[2], y: R[0], label: 'catalog', sub: { en: 'products', zh: '商品', ja: '商品' }, detail: { en: 'Products, served through a Redis cache-aside with TTL jitter, null sentinels and delete-after-commit invalidation. Stock is never cached.', zh: '商品数据，经 Redis 旁路缓存读取：TTL 加随机抖动、空值占位防穿透、提交后再删除缓存。库存从不缓存。', ja: '商品データ。TTL のジッター、null センチネル、コミット後の削除による Redis キャッシュアサイドで配信します。在庫は決してキャッシュしません。' } },
      { id: 'order', x: C[2], y: R[1], label: 'order', sub: { en: 'state machine', zh: '状态机', ja: '状態機械' }, detail: { en: 'The order state machine. Transitions are checked in Java for readable errors and again in SQL, so racing transitions resolve to exactly one winner.', zh: '订单状态机。状态迁移先在 Java 中校验以给出清晰的错误，再在 SQL 中二次校验，竞争的迁移只会有一个成功。', ja: '注文の状態機械。遷移はわかりやすいエラーのために Java で検証し、さらに SQL でも検証するので、競合した遷移は必ず一方だけが成功します。' } },
      { id: 'inventory', x: C[2], y: R[2], label: 'inventory', sub: { en: 'atomic reserve', zh: '原子预占', ja: '原子的な引当' }, detail: { en: 'Available and reserved stock with a CHECK (available ≥ 0). Every change is a single conditional UPDATE and is appended to a movement ledger.', zh: '可用库存与预占库存，带 CHECK (available ≥ 0) 约束。每次变更都是一条条件 UPDATE，并追加写入库存流水。', ja: '引当可能数と引当済み数を CHECK (available ≥ 0) 付きで管理。変更はすべて条件付き UPDATE 一文で行い、入出庫台帳に追記します。' } },
      { id: 'payment', x: C[2], y: R[3], label: 'payment', sub: { en: '3 steps · refunds', zh: '三步支付 · 退款', ja: '3 ステップ · 返金' }, detail: { en: 'Lock and record a pending payment, call the gateway outside any transaction, then compare-and-set. No database lock is held during network latency.', zh: '先加锁并记录待支付，再在事务之外调用支付网关，最后做 CAS 更新。网络等待期间不持有任何数据库锁。', ja: 'ロックして保留中の支払いを記録し、トランザクションの外でゲートウェイを呼び、最後に CAS で確定します。ネットワーク待ちの間、DB ロックは一切保持しません。' } },
      { id: 'ai', x: C[2], y: R[4], label: 'ai', sub: { en: 'copilot', zh: 'AI 助手', ja: 'コパイロット' }, detail: { en: 'A Spring AI ChatClient with read-only @Tool methods bound to the caller’s tenant, per-user rate limits, and an offline analyst fallback.', zh: 'Spring AI ChatClient，@Tool 方法全部只读并绑定调用者的租户，按用户限流，并有离线分析器兜底。', ja: '呼び出し元テナントに束縛した読み取り専用の @Tool を持つ Spring AI ChatClient。ユーザーごとのレート制限と、オフラインアナリストへのフォールバック付き。' } },
      { id: 'redis', x: C[3], y: R[0], label: 'Redis 7', tone: 'store', sub: { en: 'cache · idempotency', zh: '缓存 · 幂等', ja: 'キャッシュ · 冪等性' }, detail: { en: 'An optimisation, never the source of truth: catalog cache, idempotency keys, the JWT deny-list and rate limits. Every path degrades gracefully if it is down.', zh: '只是优化手段，而非数据源：商品缓存、幂等键、JWT 黑名单与限流。Redis 宕机时，每条路径都能平稳降级。', ja: 'あくまで最適化で、正のデータではありません。商品キャッシュ、冪等キー、JWT 拒否リスト、レート制限。停止してもすべての経路が穏やかに劣化します。' } },
      { id: 'mysql', x: C[3], y: R[2], label: 'MySQL 8.4', tone: 'store', sub: { en: 'state + outbox, one TX', zh: '状态与 Outbox 同事务', ja: '状態 + アウトボックス' }, detail: { en: 'The source of truth. Orders, stock, payments and outbox events commit together. Flyway migrations; every tenant table carries tenant_id.', zh: '唯一的数据源。订单、库存、支付和 Outbox 事件一起提交。使用 Flyway 迁移，每张租户表都带 tenant_id。', ja: '唯一の正のデータ。注文・在庫・決済・アウトボックスのイベントをまとめてコミットします。Flyway でマイグレーションし、テナントテーブルにはすべて tenant_id があります。' } },
      { id: 'llm', x: C[3], y: R[4], label: 'LLM', tone: 'external', sub: { en: 'DeepSeek · OpenAI API', zh: 'DeepSeek · OpenAI 兼容', ja: 'DeepSeek · OpenAI 互換' }, detail: { en: 'Chooses which tool to call and writes the answer. It never sees credentials and never chooses the tenant.', zh: '负责决定调用哪个工具并组织回答。它看不到任何凭据，也无法选择租户。', ja: 'どのツールを呼ぶかを選び、回答を書きます。認証情報を見ることも、テナントを選ぶこともありません。' } },
      { id: 'relay', x: C[4], y: R[2], label: 'Outbox relay', sub: { en: 'confirms · SKIP LOCKED', zh: '确认投递 · SKIP LOCKED', ja: '配信確認 · SKIP LOCKED' }, detail: { en: 'Every 500 ms, claims a batch with FOR UPDATE SKIP LOCKED and publishes with confirms and mandatory returns. Marked sent only when acknowledged and routed.', zh: '每 500 毫秒用 FOR UPDATE SKIP LOCKED 认领一批事件，以 publisher confirms 和 mandatory 方式投递。只有被确认且成功路由后才标记为已发送。', ja: '500 ミリ秒ごとに FOR UPDATE SKIP LOCKED で一括取得し、publisher confirms と mandatory 付きで配信します。確認され、ルーティングされた場合にだけ送信済みにします。' } },
      { id: 'mq', x: C[5], y: R[2], label: 'RabbitMQ', tone: 'external', sub: { en: 'topic exchange · DLX', zh: 'topic 交换机 · 死信', ja: 'topic エクスチェンジ · DLX' }, detail: { en: 'Routes domain events to consumers. A delay queue with a TTL and a dead-letter exchange turns “30 minutes from now” into a message.', zh: '把领域事件路由给消费者。带 TTL 的延迟队列配合死信交换机，把“30 分钟后”变成一条消息。', ja: 'ドメインイベントをコンシューマーへ振り分けます。TTL 付きの遅延キューとデッドレター・エクスチェンジで、「30 分後」をメッセージにします。' } },
      { id: 'notify', x: C[5], y: R[0], label: 'Notifications', sub: { en: 'idempotent consumer', zh: '幂等消费者', ja: '冪等コンシューマー' }, detail: { en: 'At-least-once delivery made safe: a de-duplication row in the same transaction, retries, then a dead-letter queue.', zh: '让“至少一次”投递变得安全：在同一事务中写去重记录，失败重试，最终进入死信队列。', ja: '「少なくとも一回」の配信を安全にします。同じトランザクションで重複排除の行を書き、リトライし、最後はデッドレターキューへ。' } },
      { id: 'timeout', x: C[4], y: R[0], label: 'Timeouts', sub: { en: 'TTL + dead letter', zh: 'TTL + 死信', ja: 'TTL + デッドレター' }, detail: { en: 'Receives each unpaid order exactly at its deadline and runs an idempotent expireIfUnpaid. A one-minute sweeper covers broker outages.', zh: '在截止时刻收到每个未支付订单，执行幂等的 expireIfUnpaid。每分钟一次的清扫任务兜底消息中间件故障。', ja: '未払いの注文を期限ちょうどに受け取り、冪等な expireIfUnpaid を実行します。ブローカー障害時は 1 分ごとのスイーパーが補います。' } },
    ],
    edges: [
      { id: 'spa-api', from: 'spa', to: 'api' },
      { id: 'api-catalog', from: 'api', to: 'catalog', axis: 'h' },
      { id: 'api-order', from: 'api', to: 'order', axis: 'h' },
      { id: 'api-inventory', from: 'api', to: 'inventory', axis: 'h' },
      { id: 'api-payment', from: 'api', to: 'payment', axis: 'h' },
      { id: 'api-ai', from: 'api', to: 'ai', axis: 'h' },
      { id: 'order-inventory', from: 'order', to: 'inventory', label: { en: 'reserve', zh: '预占', ja: '引当' } },
      { id: 'catalog-redis', from: 'catalog', to: 'redis', label: { en: 'cache', zh: '缓存', ja: 'キャッシュ' } },
      { id: 'order-mysql', from: 'order', to: 'mysql', axis: 'h' },
      { id: 'inventory-mysql', from: 'inventory', to: 'mysql', label: { en: 'one TX', zh: '同一事务', ja: '同一 TX' } },
      { id: 'payment-mysql', from: 'payment', to: 'mysql', axis: 'h' },
      { id: 'ai-mysql', from: 'ai', to: 'mysql', axis: 'h' },
      { id: 'ai-llm', from: 'ai', to: 'llm', label: { en: 'tools', zh: '工具', ja: 'ツール' } },
      { id: 'mysql-relay', from: 'mysql', to: 'relay', label: { en: 'poll', zh: '轮询', ja: 'ポーリング' } },
      { id: 'relay-mq', from: 'relay', to: 'mq' },
      { id: 'mq-notify', from: 'mq', to: 'notify', dashed: true },
      { id: 'mq-timeout', from: 'mq', to: 'timeout', dashed: true, label: { en: 'TTL', zh: 'TTL', ja: 'TTL' } },
      { id: 'timeout-order', from: 'timeout', to: 'order', axis: 'h', dashed: true },
    ],
    traces: [
      {
        id: 'place',
        label: { en: 'Place an order', zh: '下单', ja: '注文する' },
        steps: [
          { edge: 'spa-api', note: { en: 'The request carries a JWT and an Idempotency-Key. The tenant comes from the signed token.', zh: '请求携带 JWT 和 Idempotency-Key，租户取自签名令牌。', ja: 'リクエストは JWT と Idempotency-Key を持ちます。テナントは署名済みトークンから取得します。' } },
          { edge: 'api-order', note: { en: 'The key is claimed in Redis with SET NX. A duplicate gets the stored response, or 409 while the first is in flight.', zh: '用 Redis SET NX 抢占幂等键。重复请求拿到已保存的响应；若第一个请求仍在处理，则返回 409。', ja: 'キーを Redis の SET NX で確保します。重複リクエストには保存済みのレスポンスを返し、最初の処理中なら 409 を返します。' } },
          { edge: 'order-inventory', note: { en: 'Each line reserves stock with one conditional UPDATE, in product-id order. Zero rows affected rolls the whole order back.', zh: '每一行都按商品 ID 顺序，用一条条件 UPDATE 预占库存。只要影响行数为 0，整个订单回滚。', ja: '各行を商品 ID 順に、条件付き UPDATE 一文で引き当てます。影響行数が 0 なら注文全体をロールバックします。' } },
          { edge: 'inventory-mysql', note: { en: 'The order, the stock change and the order.created event commit in one transaction.', zh: '订单、库存变更和 order.created 事件在同一事务中提交。', ja: '注文・在庫の変更・order.created イベントを一つのトランザクションでコミットします。' } },
          { edge: 'mysql-relay', note: { en: 'The relay claims the new outbox row. Several instances can run; SKIP LOCKED keeps them apart.', zh: '中继进程认领新的 Outbox 记录。可以同时运行多个实例，SKIP LOCKED 让它们互不干扰。', ja: 'リレーが新しいアウトボックスの行を取得します。複数インスタンスでも SKIP LOCKED で衝突しません。' } },
          { edge: 'relay-mq', note: { en: 'Published with confirms. Only an acknowledged, routed message is marked sent; anything else retries with back-off.', zh: '以确认模式投递。只有被确认且成功路由的消息才标记为已发送，其余按退避策略重试。', ja: '配信確認付きで発行します。確認済みかつルーティングされたものだけを送信済みにし、それ以外はバックオフで再試行します。' } },
          { edge: 'mq-notify', note: { en: 'The notification consumer de-duplicates by message id in its own transaction, so a redelivery changes nothing.', zh: '通知消费者在自己的事务中按消息 ID 去重，重复投递不会产生任何变化。', ja: '通知コンシューマーは自身のトランザクション内でメッセージ ID により重複排除するので、再配信されても何も変わりません。' } },
        ],
      },
      {
        id: 'expire',
        label: { en: 'An unpaid order expires', zh: '未支付订单超时', ja: '未払い注文の期限切れ' },
        steps: [
          { edge: 'relay-mq', note: { en: 'order.created is also routed to a delay queue whose TTL equals the payment window. Nothing consumes it.', zh: 'order.created 同时被路由到一个延迟队列，其 TTL 等于支付时限，没有任何消费者。', ja: 'order.created は支払い期限と同じ TTL を持つ遅延キューにも送られます。このキューには誰も購読していません。' } },
          { edge: 'mq-timeout', note: { en: 'At the deadline the message dead-letters to the timeout queue.', zh: '到期时，消息转入超时队列（死信）。', ja: '期限が来ると、メッセージはタイムアウトキューへデッドレターされます。' } },
          { edge: 'timeout-order', note: { en: 'expireIfUnpaid is a compare-and-set on PENDING_PAYMENT. If a payment won the race, this does nothing.', zh: 'expireIfUnpaid 对 PENDING_PAYMENT 状态做 CAS。如果支付抢先完成，这一步什么也不做。', ja: 'expireIfUnpaid は PENDING_PAYMENT に対する CAS です。支払いが先に勝っていれば何もしません。' } },
          { edge: 'order-inventory', note: { en: 'Reserved stock returns to available, and the movement is written to the ledger.', zh: '预占的库存回到可用库存，并写入库存流水。', ja: '引当済みの在庫が引当可能に戻り、その動きを台帳に記録します。' } },
        ],
      },
      {
        id: 'ask',
        label: { en: 'Ask the copilot', zh: '询问 AI 助手', ja: 'コパイロットに聞く' },
        steps: [
          { edge: 'spa-api', note: { en: '“What sold best this week?” arrives with the user’s token and UI language.', zh: '“本周卖得最好的是什么？”随用户令牌和界面语言一起到达。', ja: '「今週いちばん売れたのは？」という質問が、ユーザーのトークンと UI の言語とともに届きます。' } },
          { edge: 'api-ai', note: { en: 'A per-request tools instance is created with the tenant id in its constructor. The model can’t choose it.', zh: '每个请求都会创建一个工具实例，租户 ID 通过构造函数传入，模型无法选择。', ja: 'リクエストごとにツールのインスタンスを作り、テナント ID はコンストラクタで渡します。モデルが選ぶことはできません。' } },
          { edge: 'ai-llm', note: { en: 'The model reads the system prompt and asks for getTopProducts.', zh: '模型读取系统提示词，并请求调用 getTopProducts。', ja: 'モデルはシステムプロンプトを読み、getTopProducts の呼び出しを求めます。' } },
          { edge: 'ai-mysql', note: { en: 'The tool runs a read-only, tenant-scoped query. The numbers come from the database, not the model.', zh: '工具执行只读、限定租户的查询。数字来自数据库，而不是模型。', ja: 'ツールは読み取り専用でテナントに限定したクエリを実行します。数字はモデルではなくデータベースから来ます。' } },
          { node: 'ai', note: { en: 'The answer lists the tools it used, shown in the UI as provenance.', zh: '回答会列出用到的工具，在界面中作为数据来源展示。', ja: '回答には使ったツールが付き、画面上で出典として表示されます。' } },
        ],
      },
    ],
  },
  screens: [
    { image: dashboard, zh: dashboardZh, alt: { en: 'OrderPilot dashboard with revenue, orders and stock alerts', zh: 'OrderPilot 管理后台，显示营收、订单和库存预警', ja: '売上・注文・在庫アラートを表示した OrderPilot のダッシュボード' }, caption: { en: 'Dashboard: live KPIs, cached for 30 seconds', zh: '仪表盘：实时 KPI，缓存 30 秒', ja: 'ダッシュボード：30 秒キャッシュのリアルタイム KPI' } },
    { image: orders, zh: ordersZh, alt: { en: 'Order list with a detail drawer', zh: '订单列表与详情抽屉', ja: '注文一覧と詳細ドロワー' }, caption: { en: 'Orders: status, payments and timeline in one drawer', zh: '订单：状态、支付与时间线集中在一个抽屉中', ja: '注文：ステータス・決済・タイムラインを一つのドロワーに' } },
    { image: assistant, zh: assistantZh, alt: { en: 'AI copilot answering with a table and the tools it used', zh: 'AI 助手以表格作答，并列出用到的工具', ja: '表で回答し、使ったツールを示す AI コパイロット' }, caption: { en: 'Copilot: every number traced to a tool call', zh: 'AI 助手：每个数字都能追溯到一次工具调用', ja: 'コパイロット：すべての数字がツール呼び出しにたどれる' } },
    { image: inventory, alt: { en: 'Inventory levels with low-stock highlights', zh: '库存水位与低库存提醒', ja: '在庫水準と在庫僅少のハイライト' }, caption: { en: 'Inventory: available, reserved and the movement ledger', zh: '库存：可用、预占与库存流水', ja: '在庫：引当可能数・引当済み数・入出庫台帳' } },
  ],
  lessons: [
    {
      en: 'Notifications already only consume events, so they would be the first module to extract into a service if the team or the load grew.',
      zh: '通知模块本来就只消费事件，如果团队或负载增长，它会是第一个被拆分成独立服务的模块。',
      ja: '通知モジュールはすでにイベントを消費するだけなので、チームや負荷が大きくなれば最初にサービスとして切り出すモジュールになります。',
    },
    {
      en: 'Next I would add tracing that follows one order from the HTTP request through the outbox to every consumer, with one correlation id.',
      zh: '下一步我会加入分布式追踪，用同一个关联 ID 串起一个订单从 HTTP 请求、Outbox 到每个消费者的全过程。',
      ja: '次は、一つの相関 ID で注文を HTTP リクエストからアウトボックス、各コンシューマーまで追えるトレーシングを入れます。',
    },
    {
      en: 'Redis pre-deduction would only be worth its reconciliation cost at flash-sale scale. Until then, one SQL statement is simpler and provably correct.',
      zh: '只有到了秒杀级别的规模，Redis 预扣减才值得付出对账的代价。在那之前，一条 SQL 更简单，而且可以证明是正确的。',
      ja: 'Redis での事前減算は、フラッシュセール規模になって初めて照合のコストに見合います。それまでは SQL 一文のほうが単純で、正しさも証明できます。',
    },
  ],
};
