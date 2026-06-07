# TalkMate UI 重新设计方案 v2.0

> 参考成熟企业级 App 设计实践，打造专业、美观、可用的移动端 UI

## 一、参考案例分析

### 1.1 语言学习类 App 标杆

| App | 特点 | 可借鉴之处 |
|-----|------|-----------|
| **Duolingo** | 游戏化学习、进度可视化、成就系统 | 每日任务卡片、连续天数 streak、成就徽章 |
| **流利说** | 场景对话、AI 纠音、学习报告 | 场景分类、评分体系、口语分析报告 |
| **Cambly** | 真人外教、预约系统 | 简洁的会话列表、状态标识 |
| **开言英语** | 场景课程、跟读练习 | 课程卡片设计、进度条 |

### 1.2 企业级 SaaS 移动端设计

| 产品 | 特点 | 可借鉴之处 |
|-----|------|-----------|
| **Notion Mobile** | 极简、内容优先、卡片式布局 | 信息层级、留白处理 |
| **Figma Mobile** | 专业工具、深色模式、组件化 | 图标系统、状态反馈 |
| **飞书 App** | 企业级、消息流、工作台 | 底部导航、消息气泡、快捷入口 |
| **钉钉 App** | 任务驱动、数据看板 | 统计卡片、进度展示 |

### 1.3 设计框架参考

**Ant Design Mobile** (阿里):
- 组件丰富，适合中后台管理
- 表单验证、列表、卡片、弹窗规范完善

**TDesign Mobile** (腾讯):
- 视觉精致，动画流畅
- 适合消费级产品

**Vant** (有赞):
- 轻量、易定制
- 适合电商和工具类应用

**我们选择**: 以 **TDesign Mobile** 为视觉参考，结合 **Ant Design Mobile** 的组件规范，使用 Tailwind CSS 实现。

---

## 二、设计系统

### 2.1 色彩系统

```css
/* 品牌色 — Indigo 家族，专业可信赖 */
--brand-50:  #eef2ff;
--brand-100: #e0e7ff;
--brand-200: #c7d2fe;
--brand-300: #a5b4fc;
--brand-400: #818cf8;
--brand-500: #6366f1;  /* 主色 */
--brand-600: #4f46e5;
--brand-700: #4338ca;
--brand-800: #3730a3;
--brand-900: #312e81;

/* 功能色 */
--success: #10b981;   /* 成功、通过 */
--warning: #f59e0b;   /* 警告、提醒 */
--error:   #ef4444;   /* 错误、失败 */
--info:    #3b82f6;   /* 信息、提示 */

/* 中性色 — 带轻微蓝调的灰 */
--slate-50:  #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
```

### 2.2 字体系统

采用 **系统字体栈**，确保性能和一致性：

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
```

**字号阶梯**:

| Token | 大小 | 用途 |
|-------|------|------|
| text-xs | 11px | 标签、辅助文字、时间戳 |
| text-sm | 13px | 次要内容、描述 |
| text-base | 15px | 正文、按钮文字 |
| text-lg | 17px | 小标题、卡片标题 |
| text-xl | 20px | 模块标题、页面标题 |
| text-2xl | 24px | 大标题、数字展示 |
| text-3xl | 32px | 核心数据、品牌展示 |

### 2.3 间距系统

以 4px 为基准：

```
space-1:  4px   (xs)
space-2:  8px   (sm)
space-3:  12px  (md)
space-4:  16px  (base)
space-5:  20px  (lg)
space-6:  24px  (xl)
space-8:  32px  (2xl)
space-10: 40px  (3xl)
space-12: 48px  (4xl)
```

### 2.4 圆角系统

```
rounded-sm:  6px   (小标签、徽章)
rounded-md:  10px  (按钮、输入框)
rounded-lg:  14px  (小卡片)
rounded-xl:  18px  (大卡片、模块)
rounded-2xl: 22px  (页面容器)
rounded-full: 9999px (头像、圆形按钮)
```

### 2.5 阴影系统

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 2px 8px rgba(0,0,0,0.06);
--shadow-lg: 0 4px 16px rgba(0,0,0,0.08);
--shadow-xl: 0 8px 24px rgba(0,0,0,0.12);
--shadow-brand: 0 4px 14px rgba(99,102,241,0.25);
```

---

## 三、组件库规范

### 3.1 按钮 Button

```tsx
// Primary — 主操作
<button className="h-[48px] w-full rounded-[10px] bg-brand-600 text-[15px] font-semibold text-white shadow-brand transition-all hover:bg-brand-700 active:scale-[0.98] disabled:bg-slate-300">
  开始训练
</button>

// Secondary — 次要操作
<button className="h-[48px] w-full rounded-[10px] border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]">
  查看详情
</button>

// Text — 文字按钮
<button className="h-[40px] px-4 text-[14px] font-medium text-brand-600 hover:text-brand-700">
  跳过
</button>

// Icon — 图标按钮
<button className="flex h-[48px] w-[48px] items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-brand hover:bg-brand-700 active:scale-[0.98]">
  <Mic className="h-5 w-5" />
</button>
```

### 3.2 卡片 Card

```tsx
// 功能卡片
<div className="flex flex-col items-center gap-2.5 rounded-[14px] bg-white p-5 shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
  <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-brand-50">
    <Icon className="h-7 w-7 text-brand-600" />
  </div>
  <div className="text-center">
    <h3 className="text-[15px] font-bold text-slate-900">场景对话</h3>
    <p className="mt-0.5 text-[13px] text-slate-400">角色扮演练习</p>
  </div>
</div>

// 场景卡片
<button className="flex w-full items-center gap-4 rounded-[14px] bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-xl">
    {icon}
  </div>
  <div className="min-w-0 flex-1 text-left">
    <h3 className="text-[15px] font-bold text-slate-900">{name}</h3>
    <p className="mt-0.5 text-[13px] text-slate-400">{description}</p>
  </div>
  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
</button>

// 统计卡片
<div className="flex flex-col items-center rounded-[14px] bg-white p-4 shadow-sm">
  <Icon className="mb-1.5 h-5 w-5 text-brand-500" />
  <span className="text-[24px] font-black text-slate-900">{value}</span>
  <span className="text-[13px] text-slate-400">{label}</span>
</div>
```

### 3.3 输入框 Input

```tsx
<div className="space-y-1.5">
  <label className="text-[14px] font-medium text-slate-600">{label}</label>
  <input
    className="h-[48px] w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 placeholder:text-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
    placeholder={placeholder}
  />
  {error && <p className="text-[13px] text-red-500">{error}</p>}
</div>
```

### 3.4 标签 Tag

```tsx
// 状态标签
<span className="rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand-700">
  场景化学习
</span>

// 评分标签
<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
  82 分
</span>
```

### 3.5 头像 Avatar

```tsx
<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
  {initial}
</div>
```

---

## 四、页面详细设计

### 4.1 登录页 /login

**参考**: Duolingo 启动页、Notion 登录页

**布局**:
```
┌─────────────────────────────┐
│                             │
│    ┌─────────────────┐      │
│    │                 │      │
│    │    Logo 图标     │      │
│    │    TalkMate     │      │
│    │  AI口语训练教练  │      │
│    │                 │      │
│    └─────────────────┘      │
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │  用户名                 ││
│  │  ┌───────────────────┐ ││
│  │  │                   │ ││
│  │  └───────────────────┘ ││
│  │                         ││
│  │  密码                   ││
│  │  ┌───────────────────┐ ││
│  │  │                   │ ││
│  │  └───────────────────┘ ││
│  │                         ││
│  │  [      登 录       ]  ││
│  │                         ││
│  │  还没有账号？去注册      ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

**设计要点**:
- 顶部 40% 使用品牌渐变背景 `bg-gradient-to-b from-brand-600 to-brand-800`
- Logo 使用白色半透明卡片 `bg-white/20 backdrop-blur`
- 底部表单卡片使用 `rounded-t-[20px]` 向上弧形切入
- 输入框聚焦时边框变 brand-500，带柔和发光
- 登录按钮使用品牌色 + 阴影

### 4.2 首页 /app/home

**参考**: Duolingo 首页、流利说首页

**布局**:
```
┌─────────────────────────────┐
│  👤 你好, demo     [🔔]    │  ← 顶部欢迎区
│  今天也是练习的好日子!       │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔥 今日推荐              │ │
│ │                         │ │
│ │   面试场景对话            │ │
│ │   模拟英文面试问答        │ │
│ │                         │ │
│ │   预计 5-10 分钟        │ │
│ │                         │ │
│ │   [    开始训练    ]   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  开始训练                    │
│ ┌──────────┐ ┌──────────┐ │
│ │   💬     │ │   🎴     │ │
│ │ 场景对话  │ │ 抽卡跟练  │ │
│ └──────────┘ └──────────┘ │
├─────────────────────────────┤
│  练习概览          [刷新]   │
│ ┌────┐ ┌────┐ ┌────┐     │
│ │ 12 │ │ 85 │ │  7 │     │
│ │完成│ │平均│ │连续│     │
│ └────┘ └────┘ └────┘     │
├─────────────────────────────┤
│  最近练习                    │
│ ┌─────────────────────────┐ │
│ │ 💼 面试场景    82分   >│ │
│ │ 🍽️ 餐厅点餐    78分   >│ │
│ │ ✈️ 机场旅行    未评分  >│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**设计要点**:
- 顶部欢迎区使用深色背景 `bg-gradient-to-r from-brand-600 to-brand-700`
- 今日推荐卡片使用品牌渐变 + 白色文字
- 快捷入口使用图标+文字的垂直卡片
- 统计概览三个卡片等宽，图标使用不同颜色
- 最近练习列表使用紧凑卡片，右侧显示评分

### 4.3 场景选择页 /app/scenarios

**参考**: 流利说场景选择、开言英语课程列表

**布局**:
```
┌─────────────────────────────┐
│ <  场景对话                  │
│ 选择一个场景，开始角色扮演   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 💼  面试场景             │ │
│ │     模拟英文面试问答      │ │
│ │     5-10 分钟           │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🍽️  餐厅点餐             │ │
│ │     模拟餐厅点餐场景      │ │
│ │     5-10 分钟           │ │
│ └─────────────────────────┘ │
│ ...                         │
└─────────────────────────────┘
```

### 4.4 对话页 /conversation/:id

**参考**: 微信聊天、Cambly 会话界面

**布局**:
```
┌─────────────────────────────┐
│ <  面试场景        [结束]  │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │ 你好!我是你的AI口语  │   │
│  │ 教练。今天我们模拟   │   │
│  │ 一场英文面试。       │   │
│  └─────────────────────┘   │
│                             │
│           ┌─────────────┐  │
│           │ 你好，我准备 │  │
│           │ 好了。       │  │
│           └─────────────┘  │
│                             │
│  ┌─────────────────────┐   │
│  │ Great! Let's start  │   │
│  │ with a simple      │   │
│  │ question...         │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│ [🎙️] [输入框...      ] [发送]│
└─────────────────────────────┘
```

### 4.5 个人中心 /app/profile

**参考**: Duolingo 个人资料、Keep 运动数据

**布局**:
```
┌─────────────────────────────┐
│ ┌────┐  demo          [退出]│
│ │ 👤 │  坚持练习，每天进步  │
│ └────┘                      │
├─────────────────────────────┤
│  练习概览                    │
│ ┌────┐ ┌────┐ ┌────┐     │
│ │ 12 │ │ 85 │ │  7 │     │
│ │完成│ │平均│ │连续│     │
│ └────┘ └────┘ └────┘     │
├─────────────────────────────┤
│  📅 练习热力图               │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────┤
│  🏆 成就徽章                 │
│ ┌────┐ ┌────┐ ┌────┐     │
│ │ 🔥 │ │ ⭐ │ │ 🎯 │     │
│ │初出│ │坚持│ │完美│     │
│ │茅庐│ │7天 │ │发音│     │
│ └────┘ └────┘ └────┘     │
├─────────────────────────────┤
│  📈 得分趋势                 │
│    ╱╲                       │
│   ╱  ╲    ╱╲               │
│  ╱    ╲  ╱  ╲              │
│ ╱      ╲╱    ╲             │
├─────────────────────────────┤
│  📋 分析报告                 │
│ ┌─────────────────────────┐ │
│ │ 💼 面试场景    82分   >│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 五、虚拟数据方案

### 5.1 首页虚拟数据

```typescript
const todayTask = {
  id: 1,
  name: "面试场景对话",
  description: "模拟英文面试问答，提升求职英语口语表达能力",
  estimatedTime: "5-10 分钟",
  icon: "💼",
  difficulty: "中等",
  participants: 1247,
};

const quickEntries = [
  { id: "conversation", name: "场景对话", desc: "角色扮演练习", icon: "MessageCircle", color: "bg-brand-50 text-brand-600" },
  { id: "card", name: "抽卡跟练", desc: "随机精准训练", icon: "Layers", color: "bg-amber-50 text-amber-600" },
];

const stats = [
  { label: "完成练习", value: 12, icon: "Target", color: "text-brand-500" },
  { label: "平均评分", value: 85, icon: "TrendingUp", color: "text-emerald-500" },
  { label: "连续天数", value: 7, icon: "Flame", color: "text-amber-500" },
];

const recentHistory = [
  { id: 1, scenario: { name: "面试场景", icon: "💼" }, date: "06/05", score: 82 },
  { id: 2, scenario: { name: "餐厅点餐", icon: "🍽️" }, date: "06/04", score: 78 },
  { id: 3, scenario: { name: "机场旅行", icon: "✈️" }, date: "06/03", score: null },
  { id: 4, scenario: { name: "会议讨论", icon: "📊" }, date: "06/02", score: 88 },
  { id: 5, scenario: { name: "日常社交", icon: "💬" }, date: "06/01", score: 75 },
];
```

### 5.2 场景页虚拟数据

```typescript
const scenarios = [
  { id: 1, name: "面试场景", description: "模拟英文面试问答，提升求职英语口语表达能力", icon: "💼", duration: "5-10 分钟", difficulty: "中等", color: "bg-blue-50 text-blue-600" },
  { id: 2, name: "餐厅点餐", description: "模拟餐厅点餐、结账等用餐场景", icon: "🍽️", duration: "5-10 分钟", difficulty: "简单", color: "bg-orange-50 text-orange-600" },
  { id: 3, name: "会议讨论", description: "模拟英文会议发言、讨论与汇报", icon: "📊", duration: "10-15 分钟", difficulty: "困难", color: "bg-purple-50 text-purple-600" },
  { id: 4, name: "机场旅行", description: "模拟机场、酒店、问路、购物等旅行场景", icon: "✈️", duration: "5-10 分钟", difficulty: "简单", color: "bg-sky-50 text-sky-600" },
  { id: 5, name: "日常社交", description: "日常社交聊天，培养开口说英语的信心", icon: "💬", duration: "5-10 分钟", difficulty: "简单", color: "bg-green-50 text-green-600" },
];
```

### 5.3 个人中心虚拟数据

```typescript
const achievements = [
  { key: "first-step", label: "初出茅庐", description: "完成第一次练习", icon: "🎯", unlocked: true, unlockedAt: "2026-06-01" },
  { key: "week-streak", label: "坚持7天", description: "连续练习7天", icon: "🔥", unlocked: true, unlockedAt: "2026-06-07" },
  { key: "perfect-score", label: "完美发音", description: "单次评分达到90分以上", icon: "⭐", unlocked: false },
  { key: "hundred-minutes", label: "百分钟达人", description: "累计练习超过100分钟", icon: "⏱️", unlocked: true, unlockedAt: "2026-06-05" },
  { key: "all-scenarios", label: "场景通", description: "完成所有场景练习", icon: "🌍", unlocked: false },
  { key: "early-bird", label: "早起鸟", description: "在早上6点前完成练习", icon: "🐦", unlocked: false },
];

const heatmapData = [
  { date: "2026-05-25", count: 0 },
  { date: "2026-05-26", count: 1 },
  { date: "2026-05-27", count: 2 },
  { date: "2026-05-28", count: 0 },
  { date: "2026-05-29", count: 3 },
  { date: "2026-05-30", count: 1 },
  { date: "2026-05-31", count: 2 },
  { date: "2026-06-01", count: 2 },
  { date: "2026-06-02", count: 1 },
  { date: "2026-06-03", count: 3 },
  { date: "2026-06-04", count: 0 },
  { date: "2026-06-05", count: 2 },
  { date: "2026-06-06", count: 1 },
];

const scoreTrend = [
  { date: "2026-06-01", score: 72, type: "conversation" },
  { date: "2026-06-02", score: 78, type: "card" },
  { date: "2026-06-03", score: 85, type: "conversation" },
  { date: "2026-06-04", score: 80, type: "conversation" },
  { date: "2026-06-05", score: 82, type: "card" },
  { date: "2026-06-06", score: 88, type: "conversation" },
];

const reports = [
  { id: 1, scenario: { name: "面试场景", icon: "💼" }, date: "06/05", score: 82 },
  { id: 2, scenario: { name: "餐厅点餐", icon: "🍽️" }, date: "06/04", score: 78 },
  { id: 3, scenario: { name: "会议讨论", icon: "📊" }, date: "06/02", score: 88 },
  { id: 4, scenario: { name: "日常社交", icon: "💬" }, date: "06/01", score: 75 },
];
```

---

## 六、动画与交互

### 6.1 页面进入动画

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}
```

### 6.2 按钮点击反馈

```css
.btn-active {
  transition: transform 0.15s ease;
}
.btn-active:active {
  transform: scale(0.98);
}
```

### 6.3 卡片悬停效果

```css
.card-hover {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card-hover:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### 6.4 加载动画

```tsx
// 骨架屏
<div className="animate-pulse space-y-4">
  <div className="h-40 rounded-[14px] bg-slate-200" />
  <div className="h-24 rounded-[14px] bg-slate-200" />
  <div className="h-32 rounded-[14px] bg-slate-200" />
</div>

// 加载中
<div className="flex items-center justify-center gap-2 text-slate-400">
  <Loader2 className="h-5 w-5 animate-spin" />
  <span className="text-[14px]">加载中...</span>
</div>
```

---

## 七、状态设计

### 7.1 Loading 状态

```tsx
// 骨架屏
<div className="animate-pulse space-y-4">
  <div className="h-40 rounded-[14px] bg-slate-200" />
  <div className="h-24 rounded-[14px] bg-slate-200" />
  <div className="h-32 rounded-[14px] bg-slate-200" />
</div>
```

### 7.2 Empty 状态

```tsx
<div className="flex flex-col items-center rounded-[14px] border border-dashed border-slate-300 bg-white p-8 text-center">
  <MessageCircle className="mb-3 h-12 w-12 text-slate-300" />
  <p className="text-[15px] font-bold text-slate-700">还没有练习数据</p>
  <p className="mt-1 text-[13px] text-slate-400">完成第一次口语练习后，这里会展示你的成长数据</p>
  <button className="mt-4 h-[44px] rounded-[10px] bg-brand-600 px-5 text-[14px] font-semibold text-white">
    开始练习
  </button>
</div>
```

### 7.3 Error 状态

```tsx
<div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center">
  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
  <p className="text-red-700 mb-3">加载失败，请检查网络后重试</p>
  <button className="h-[44px] rounded-[10px] bg-red-600 px-5 text-[14px] font-semibold text-white">
    重试
  </button>
</div>
```

---

## 八、实施计划

| 阶段 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 1 | 安装字体依赖 + 更新 Tailwind 配置 | `tailwind.config.js`, `package.json` | 10min |
| 2 | 创建全局 CSS 变量 + 动画 | `src/styles/design-system.css` | 15min |
| 3 | 重写登录页 | `src/features/auth/LoginPage.tsx` | 30min |
| 4 | 重写注册页 | `src/features/auth/RegisterPage.tsx` | 30min |
| 5 | 重写首页（含虚拟数据） | `src/pages/NewHomePage.tsx` | 45min |
| 6 | 重写场景选择页（含虚拟数据） | `src/pages/ScenariosPage.tsx` | 30min |
| 7 | 重写个人中心（含虚拟数据） | `src/pages/ProfilePage.tsx` | 45min |
| 8 | 更新底部导航 + AppLayout | `src/app/AppLayout.tsx` | 15min |
| 9 | 构建 + E2E 测试 | `tests/e2e/` | 30min |
| 10 | 截图验证 + 部署 | FRP + 公网测试 | 20min |

**总计**: 约 4 小时
