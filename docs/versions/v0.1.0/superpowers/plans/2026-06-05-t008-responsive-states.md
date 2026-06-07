# T-008 Responsive UI + Page States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TalkMate MVP pages usable at 375px, 768px, and 1440px, and confirm or complete Default / Loading / Empty / Error states for login, register, home, conversation/history, and summary flows.

**Architecture:** Keep this as a frontend-only stabilization pass. Reuse existing Tailwind patterns and existing Zustand/API states; do not introduce new business capabilities, new backend contracts, or broad visual redesign. Fix only layout, overflow, touch-target, and state-rendering gaps discovered by the viewport matrix.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, Zustand, Tailwind CSS, Browser Web Speech API, existing FastAPI backend for smoke testing.

---

## Scope Guardrails

### Included
- Login page, register page, home page, conversation page, history replay page, summary page responsive checks and minimal fixes.
- 375px mobile, 768px tablet, 1440px desktop validation.
- Default / Loading / Empty / Error state confirmation for each core page.
- Horizontal overflow, text overflow, small touch target, fixed input-area usability fixes.
- Regression of T-001 ~ T-007 core flows.

### Excluded
- Dark mode, theme switching, large visual redesign.
- New features such as filtering, sorting, progress charts, export.
- Backend business expansion. Backend may only be touched if an existing frontend state cannot be validated because of missing/incorrect error response.
- Committing `talkmate.db`, `.env`, `.team-secrets.md`, keys, `dist`, `node_modules`, `venv`, or local runtime artifacts.

---

## File Responsibility Map

### Likely modified files
- `frontend/src/index.css`
  - Global mobile safety: `box-sizing`, `overflow-x` guard, body background if needed.
- `frontend/src/app/NavBar.tsx`
  - Header wrapping, small-screen spacing, touch target sizing.
- `frontend/src/features/auth/LoginPage.tsx`
  - Auth card responsive padding, full-width button touch target, error wrapping.
- `frontend/src/features/auth/RegisterPage.tsx`
  - Same as login plus password strength/captcha label wrapping.
- `frontend/src/app/HomePage.tsx`
  - Mobile stacking for section headers and refresh button.
- `frontend/src/features/scenario/ScenarioList.tsx`
  - Skeleton/empty responsive polish if needed.
- `frontend/src/features/scenario/ScenarioCard.tsx`
  - Card minimum touch target and text wrapping.
- `frontend/src/components/PracticeHistoryList.tsx`
  - History item date/score/summary link wrapping on 375px.
- `frontend/src/app/ConversationPage.tsx`
  - Mobile header stacking; action button layout; stable viewport height; history read-only tip wrapping; error states.
- `frontend/src/features/conversation/MessageList.tsx`
  - Empty state label for history vs active conversation if needed; overflow behavior.
- `frontend/src/features/conversation/MessageBubble.tsx`
  - Bubble max width and long-word behavior at 375px.
- `frontend/src/features/conversation/MessageInput.tsx`
  - Mobile layout for mic / textarea / send; avoid tiny buttons and input overflow.
- `frontend/src/components/voice/VoiceRecorder.tsx`
  - 44px touch target; error tooltip not causing horizontal overflow.
- `frontend/src/pages/SummaryPage.tsx`
  - Mobile typography, score card scaling, generated time wrapping, long feedback text wrapping.

### Validation-only files
- `frontend/src/app/router.tsx`
  - Confirm routes only; no expected change.
- `frontend/src/features/conversation/conversationStore.ts`
  - Confirm existing Loading/Error/Empty inputs; no expected change unless state bug appears.
- `frontend/src/features/scenario/scenarioStore.ts`
  - Confirm Home loading/error state source; no expected change.
- `frontend/src/services/*.ts`
  - Confirm API error surfaces; no expected change unless error state cannot be reproduced.

---

## Viewport + State Matrix

Use this matrix during implementation and final smoke. Record observed evidence in the final PM report.

| Page | Default | Loading | Empty | Error | 375px | 768px | 1440px |
|------|---------|---------|-------|-------|-------|-------|--------|
| Login | Form visible | Button `登录中…` | N/A, explain form has no empty data state | Store error text wraps | no overflow, button >= 44px | centered card | centered card |
| Register | Form visible | Button `注册中…` | N/A, explain form has no empty data state | Store error/mismatch wraps | no overflow, labels wrap | centered card | centered card |
| Home scenarios | Scenario cards | `ScenarioListSkeleton` | `ScenarioListEmpty` | `scenarios-error` | 1-col, no overflow | 2-col | 3-col |
| Home history | Records list | `history-loading` | `history-empty` | `history-error` | item stacks, date wraps | item readable | item horizontal layout |
| Conversation active | Messages + input | loading page | empty messages prompt | `conversation-error` or send banner | input usable, no horizontal overflow | stable layout | stable layout |
| History replay | Read-only messages + summary button | loading page | empty messages prompt if no messages | invalid id / load error | no send input, button reachable | stable layout | stable layout |
| Summary | Report cards | `summary-loading` | `summary-empty` | `summary-error` | score/text scales, cards single-col | readable | intended multi-col |

---

## Task 1: Baseline Audit and Safety Setup

**Files:**
- Read/check only initially: `frontend/src/**/*.tsx`, `frontend/src/index.css`
- Modify only if global overflow/box sizing is missing: `frontend/src/index.css`

- [ ] **Step 1: Confirm current dirty state before editing**

Run:
```bash
git -C /home/user13/Desktop/talkmate status --short
```
Expected:
- Existing T-006/T-007 source changes may appear.
- `talkmate.db` may be modified due to smoke data and must not be staged/committed.
- `.env`, `.team-secrets.md`, keys must not be staged.

- [ ] **Step 2: Document baseline responsive risks from code inspection**

Check these known risk areas:
- `ConversationPage.tsx` header uses a single row; at 375px the breadcrumb + action button may compress.
- `MessageInput.tsx` uses one row for mic + textarea + send; placeholder is long.
- `MessageBubble.tsx` uses `max-w-[75%]`; at 375px long text may feel cramped.
- `SummaryPage.tsx` uses `text-7xl` score and generated-time pill; may overflow on mobile.
- `PracticeHistoryList.tsx` date line and score/link row may overflow with long locale strings.

No code change in this step.

- [ ] **Step 3: Add global overflow safety only if needed**

Modify `frontend/src/index.css` to:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html, body, #root {
  min-height: 100%;
}

html,
body {
  overflow-x: hidden;
}

body {
  margin: 0;
}
```

Rationale:
- `overflow-x: hidden` is a safety net, not a substitute for fixing overflowing components.
- `min-height` avoids fragile `height: 100%` behavior in pages with tall content.

- [ ] **Step 4: Run frontend build after global CSS change**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

---

## Task 2: Auth Pages Responsive and State Polish

**Files:**
- Modify: `frontend/src/features/auth/LoginPage.tsx`
- Modify: `frontend/src/features/auth/RegisterPage.tsx`

- [ ] **Step 1: Update LoginPage layout and touch targets**

Change the outer/form/button/error classes in `LoginPage.tsx` to these patterns:
```tsx
<div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-6 sm:px-6">
  <form
    onSubmit={onSubmit}
    className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-md sm:p-6 space-y-4"
  >
```

Inputs should use at least 44px target height:
```tsx
className="min-h-11 w-full rounded-md border px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
```

Error should wrap safely:
```tsx
{error && <p className="break-words rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
```

Button should be at least 44px:
```tsx
className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
```

- [ ] **Step 2: Update RegisterPage layout and touch targets**

Apply the same outer/form/input/error/button patterns to `RegisterPage.tsx`.

For the captcha label, allow wrapping:
```tsx
<label className="text-sm text-gray-700 leading-5" htmlFor="captcha">
  验证码(MVP 固定值:1234)
</label>
```

For password strength row, avoid overflow:
```tsx
<div className="flex flex-wrap items-center gap-2 text-xs">
  <div className="min-w-24 flex-1 h-1.5 bg-gray-200 rounded">
```

- [ ] **Step 3: Verify auth states manually**

Run frontend app if not already running, then check:
- `/login` at 375px: form fits, button is tappable, no horizontal scroll.
- `/register` at 375px: captcha label and strength row wrap, button tappable.
- Login/register loading: submit once; button text changes to `登录中…` / `注册中…`.
- Error: use invalid credentials/captcha; error text wraps.

Expected: Default / Loading / Error present. Empty is N/A because auth pages are form pages without remote list content; record this as a reasonable explanation in final status matrix.

- [ ] **Step 4: Run frontend build**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

---

## Task 3: Home Page Scenario + History Responsive States

**Files:**
- Modify: `frontend/src/app/HomePage.tsx`
- Modify: `frontend/src/features/scenario/ScenarioList.tsx`
- Modify: `frontend/src/features/scenario/ScenarioCard.tsx`
- Modify: `frontend/src/components/PracticeHistoryList.tsx`

- [ ] **Step 1: Stack Home history header on mobile**

In `HomePage.tsx`, change the history section header wrapper from:
```tsx
<div className="flex items-center justify-between gap-4 mb-4">
```
to:
```tsx
<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

Change refresh button to full width on mobile:
```tsx
className="min-h-11 w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
```

- [ ] **Step 2: Improve ScenarioCard mobile tap target and wrapping**

In `ScenarioCard.tsx`, use:
```tsx
className="group min-h-40 w-full rounded-lg border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-brand-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500"
```

For the title:
```tsx
<h3 className="break-words text-lg font-semibold text-gray-900 group-hover:text-brand-600">
```

For description:
```tsx
<p className="mt-1 line-clamp-3 break-words text-sm text-gray-500">{scenario.description}</p>
```

- [ ] **Step 3: Make scenario empty/skeleton mobile-safe**

In `ScenarioList.tsx`, update empty container:
```tsx
<div className="rounded-lg border border-gray-100 bg-white p-6 text-center sm:p-10">
```

Update empty paragraph:
```tsx
<p className="text-sm text-gray-400 break-words">
```

Skeleton can stay grid-based; confirm no overflow at 375px.

- [ ] **Step 4: Improve PracticeHistoryList mobile layout**

In `PracticeHistoryList.tsx`, change `formatCreatedAt` to a shorter, stable local format:
```tsx
function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

Change loading skeleton row:
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

Change card class:
```tsx
className="rounded-lg border border-gray-100 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
```

Change date line:
```tsx
<span className="mt-1 block break-words text-sm text-gray-500">
```

Change score/link row:
```tsx
<div className="flex flex-wrap items-center gap-2 sm:justify-end">
```

Change summary link to a tappable pill:
```tsx
className="inline-flex min-h-9 items-center rounded-full px-2 text-sm font-medium text-blue-600 hover:text-blue-700"
```

- [ ] **Step 5: Verify Home states**

Manual/state checks:
- Default: logged-in home shows scenarios and history records if present.
- Loading: scenario skeleton and history skeleton visible during API wait.
- Empty: no scenarios uses `ScenarioListEmpty`; no history uses `history-empty`.
- Error: failed scenarios uses `scenarios-error`; failed history uses `history-error` with retry.

Viewport checks:
- 375px: one scenario column; history header stacks; refresh full width; no horizontal scroll.
- 768px: two scenario columns; history readable.
- 1440px: max width 6xl; three scenario columns.

- [ ] **Step 6: Run frontend build**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

---

## Task 4: Conversation + History Replay Responsive States

**Files:**
- Modify: `frontend/src/app/ConversationPage.tsx`
- Modify: `frontend/src/features/conversation/MessageList.tsx`
- Modify: `frontend/src/features/conversation/MessageBubble.tsx`
- Modify: `frontend/src/features/conversation/MessageInput.tsx`
- Modify: `frontend/src/components/voice/VoiceRecorder.tsx`

- [ ] **Step 1: Make ConversationPage height and header mobile-safe**

In `ConversationPage.tsx`, change root:
```tsx
<div className="mx-auto flex min-h-dvh max-w-4xl flex-col" data-testid="conversation-page">
```

Change top content wrapper:
```tsx
<div className="px-4 py-4 sm:px-6">
```

Change action header row:
```tsx
<div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

Change breadcrumb container:
```tsx
<div className="flex min-w-0 flex-wrap items-center gap-2">
```

Change scenario label:
```tsx
<span className="min-w-0 break-words text-base font-medium">
```

Change action buttons (`history-summary-button`, `end-conversation-button`) to:
```tsx
className="min-h-11 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
```

- [ ] **Step 2: Make alerts and content padding mobile-safe**

In `ConversationPage.tsx`, change read-only tip:
```tsx
className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 sm:mx-6"
```

Change content wrapper:
```tsx
<div className="flex min-h-0 flex-1 flex-col px-4 pb-2 sm:px-6">
```

Change error banners to include `break-words` and mobile-safe padding:
```tsx
className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 break-words sm:px-6"
```

- [ ] **Step 3: Make MessageList empty state explicit for history**

Change `MessageList` props:
```tsx
interface Props {
  messages: Message[];
  sending: boolean;
  emptyText?: string;
}

export default function MessageList({ messages, sending, emptyText = '开始一段对话吧' }: Props) {
```

Change empty rendering:
```tsx
<div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-10 text-center text-sm text-gray-400">
  {emptyText}
</div>
```

Update call in `ConversationPage.tsx`:
```tsx
<MessageList
  messages={conversation?.messages ?? []}
  sending={isHistoryMode ? false : sending}
  emptyText={isHistoryMode ? '这段历史对话暂无消息' : '开始一段对话吧'}
/>
```

- [ ] **Step 4: Make message bubbles wider on mobile and robust for long text**

In `MessageBubble.tsx`, change bubble class:
```tsx
className={`max-w-[88%] overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words sm:max-w-[75%] ${ROLE_STYLE[message.role]}`}
```

Change text paragraph:
```tsx
<p className="break-words">{message.text}</p>
```

Make TTS button at least 36px high:
```tsx
className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 shadow-sm hover:text-brand-700"
```

- [ ] **Step 5: Make MessageInput mobile-safe**

In `MessageInput.tsx`, change form:
```tsx
className="border-t border-gray-200 bg-white px-3 py-3 sm:px-4"
```

Change inner layout:
```tsx
<div className="flex items-end gap-2">
```

Change textarea placeholder to shorter mobile text:
```tsx
placeholder={disabled ? '请稍候…' : '输入消息，Enter 发送'}
```

Change textarea class:
```tsx
className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-base leading-6 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm"
```

Change send button:
```tsx
className="min-h-11 shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
```

- [ ] **Step 6: Make VoiceRecorder touch target and error tooltip safe**

In `VoiceRecorder.tsx`, unsupported button class:
```tsx
className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-300 cursor-not-allowed"
```

Main button class should include fixed touch size:
```tsx
className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-md transition ${
  recording
    ? 'bg-red-500 text-white'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
} disabled:opacity-50`}
```

Error tooltip should not force horizontal overflow:
```tsx
<span className="absolute -top-8 left-0 max-w-[12rem] rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white shadow-sm sm:left-1/2 sm:-translate-x-1/2 sm:whitespace-nowrap">
```

- [ ] **Step 7: Verify conversation/history states**

Manual checks:
- Active conversation Default: scenario title, message list, mic, textarea, send button visible.
- Loading: route initially shows `加载中…`.
- Empty: new conversation shows `开始一段对话吧`.
- Error: invalid `/conversation/not-a-number` or inaccessible id shows error block.
- Send Error: simulate network/backend stop only if safe; otherwise note existing `send-error-banner` state with retry path not applicable.
- History Default: `/conversation/history/:conversationId` shows read-only tip, messages, no input.
- History Empty: empty history conversation shows `这段历史对话暂无消息`.
- History Error: invalid or inaccessible id shows `无效的对话 ID`.

Viewport checks:
- 375px: header stacks; action button full width; input controls fit; no horizontal scroll.
- 768px: header can use row; input stable.
- 1440px: max width centered.

- [ ] **Step 8: Run frontend build**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

---

## Task 5: Summary Page Responsive States

**Files:**
- Modify: `frontend/src/pages/SummaryPage.tsx`

- [ ] **Step 1: Make generated-time and nav row stack on mobile**

In `SummaryPage.tsx`, change the row after `NavBar`:
```tsx
<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

Change generated-time span:
```tsx
<span className="w-fit rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm break-words">
```

- [ ] **Step 2: Scale hero and score on mobile**

Change hero card grid wrapper:
```tsx
<div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[240px_1fr] md:p-8">
```

Change score card:
```tsx
<div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-lg sm:p-6" data-testid="summary-score">
```

Change score number:
```tsx
<div className={`mt-4 text-5xl font-black tracking-tight sm:text-7xl ${scoreTone(summary.score)}`}>
```

Change hero title:
```tsx
<h1 className="mt-3 break-words text-2xl font-black text-slate-950 sm:text-3xl md:text-4xl">
```

- [ ] **Step 3: Make summary content cards robust for long AI text**

For card containers in feedback/suggestions/vocabulary, add `break-words` where long AI-generated text appears:
```tsx
<p className="mt-1 break-words text-sm text-rose-700 line-through decoration-rose-300">{item.original}</p>
<p className="mt-1 break-words text-base font-semibold text-emerald-700">{item.corrected}</p>
<p className="rounded-xl bg-white p-3 text-sm text-slate-600 break-words"><span className="font-semibold text-slate-900">原因：</span>{item.reason}</p>
<p className="rounded-xl bg-white p-3 text-sm text-slate-600 break-words"><span className="font-semibold text-slate-900">建议：</span>{item.suggestion}</p>
<p className="mt-1 break-words text-slate-500">{vocabulary.advanced_words_used?.join('、') || '暂无'}</p>
<p className="mt-1 break-words text-slate-500">{vocabulary.repetitive_words?.join('、') || '暂无'}</p>
<p className="mt-2 break-words text-sm leading-6 text-slate-700">{item.content}</p>
```

- [ ] **Step 4: Make loading/empty/error cards mobile-padded**

Change `summary-loading` card:
```tsx
<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
```

Change `summary-error` card:
```tsx
<div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
```

Change `summary-empty` card:
```tsx
<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
```

Make empty generate button at least 44px:
```tsx
className="mt-5 min-h-11 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
```

- [ ] **Step 5: Verify summary states**

Manual checks:
- Default: generated summary renders at 375/768/1440 without text overflow.
- Loading: `summary-loading` visible during GET.
- Empty: existing conversation without summary returns `3003` and renders `summary-empty` with generate button.
- Error: invalid id or inaccessible id renders `summary-error`.

Viewport checks:
- 375px: score card single column; score not overflowing; generated time wraps.
- 768px: readable; cards mostly single/dual as defined.
- 1440px: intended multi-column layout.

- [ ] **Step 6: Run frontend build**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

---

## Task 6: Multi-Viewport Smoke and Regression

**Files:**
- No required code changes.
- If a defect is found, return to the smallest relevant prior task and fix only that defect.

- [ ] **Step 1: Ensure backend is running safely**

If backend is already running, verify PID file before using it:
```bash
if [ -s /tmp/talkmate-backend.pid ]; then
  pid=$(cat /tmp/talkmate-backend.pid)
  ps -p "$pid" -o pid,pgid,args=
fi
python3 - <<'PY'
import json, urllib.request
with urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=5) as r:
    print(r.status, r.read().decode())
PY
```

Expected:
- PID command contains `uvicorn app.main:app`.
- Health returns `200` and `status=ok`.

Safety rule:
- Do not use `pkill -f`, `killall`, or broad process kills.
- Stop only by validated PID file if needed.

- [ ] **Step 2: Run backend regression tests**

Run:
```bash
cd /home/user13/Desktop/talkmate/backend && ./venv/bin/pytest app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py -q
```
Expected: `19 passed`.

- [ ] **Step 3: Run frontend build**

Run:
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
Expected: PASS.

- [ ] **Step 4: Run API smoke for T-001~T-007 core chain**

Run the existing Python smoke style:
```bash
python3 - <<'PY'
import json, time, urllib.request, urllib.error
BASE = 'http://127.0.0.1:8000/api/v1'
username = f't008smoke{int(time.time())}'
password = 'Test1234'

def req(method, path, body=None, token=None, timeout=60):
    data = None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if body is not None:
        data = json.dumps(body).encode()
    request = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw)
        except Exception:
            payload = raw
        return exc.code, payload

def must(name, status, payload):
    if not isinstance(payload, dict) or payload.get('code') != 0:
        raise SystemExit(f'{name} failed: status={status} payload={payload}')

steps = []
status, payload = req('POST', '/auth/register', {'username': username, 'password': password, 'captcha': '1234'})
must('register', status, payload); steps.append(('register', status, payload['code']))
status, payload = req('POST', '/auth/login', {'username': username, 'password': password})
must('login', status, payload); token = payload['data']['token']; steps.append(('login', status, payload['code']))
status, payload = req('GET', '/scenarios', token=token)
must('scenarios', status, payload); scenario_id = payload['data'][0]['id']; steps.append(('scenarios', status, payload['code'], len(payload['data'])))
status, payload = req('GET', '/conversations', token=token)
must('history_empty', status, payload); steps.append(('history_empty', status, len(payload['data'])))
status, payload = req('POST', '/conversations', {'scenario_id': scenario_id}, token=token)
must('create_conversation', status, payload); conv_id = payload['data']['id']; steps.append(('create_conversation', status, conv_id))
status, payload = req('POST', f'/conversations/{conv_id}/messages', {'text': 'Hello, this is a T-008 responsive regression smoke.'}, token=token)
must('send_message', status, payload); steps.append(('send_message', status, bool(payload['data']['ai_message']['text'])))
status, payload = req('GET', f'/conversations/{conv_id}', token=token)
must('detail', status, payload); steps.append(('detail', status, len(payload['data']['messages'])))
status, payload = req('POST', f'/conversations/{conv_id}/summary', token=token)
must('summary', status, payload); steps.append(('summary', status, payload['data']['score']))
status, payload = req('GET', '/conversations', token=token)
must('history_after_summary', status, payload); item = next(x for x in payload['data'] if x['id'] == conv_id); steps.append(('history_after_summary', status, item['has_summary'], item['summary_score']))
for step in steps:
    print(step)
PY
```
Expected:
- All steps print success tuples.
- AI message text is non-empty.
- History after summary has `has_summary=True` and score not null.

- [ ] **Step 5: Multi-viewport UI smoke**

Preferred if browser tooling is available:
- Use browser/devtools/Playwright to inspect 375x812, 768x1024, 1440x900.
- Visit `/login`, `/register`, `/`, active conversation route, history route, summary route.
- Confirm no horizontal scrolling by checking `document.documentElement.scrollWidth <= window.innerWidth + 1`.

Manual console snippet for each viewport/page:
```js
({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1 })
```
Expected: `hasHorizontalOverflow: false`.

If Playwright is installed or can run without adding dependencies, use:
```bash
cd /home/user13/Desktop/talkmate/frontend && npx playwright --version
```
If available, create a temporary one-off smoke script outside the repo or in `/tmp` only. Do not commit generated artifacts.

- [ ] **Step 6: Check forbidden artifacts**

Run:
```bash
git -C /home/user13/Desktop/talkmate status --short -- .team-secrets.md backend/.env frontend/.env talkmate.db backend/talkmate.db frontend/dist backend/venv frontend/node_modules
```
Expected:
- `talkmate.db` may be modified from smoke; must not be committed.
- `.team-secrets.md`, `.env`, keys, dist, venv, node_modules must not be staged.

- [ ] **Step 7: Final PM report with correct at tag**

Use Feishu post message with a real at tag, not plain text. Correct tag:
```json
{"tag":"at","user_id":"ou_efa35a31d71e97434b810c96d7a18995"}
```

Required report content:
- 改动范围。
- 375/768/1440 自测结果。
- 各页面 Default / Loading / Empty / Error 状态清单。
- 测试命令/结果。
- 是否有阻塞。
- Explicitly state forbidden local artifacts were not committed/staged.

---

## Self-Review Checklist

### Spec coverage
- Login/register/home/conversation/history/summary responsive checks: covered by Tasks 2~5.
- 375/768/1440 matrix: covered by matrix and Task 6.
- Default / Loading / Empty / Error: covered per page in matrix and task verification steps.
- No large redesign/new features: enforced by Scope Guardrails.
- Regression T-001~T-007: covered by Task 6 backend tests, frontend build, and smoke.
- No secret/runtime artifact commit: covered by Task 1 and Task 6.

### Placeholder scan
- No `TBD`, `TODO`, or unspecified “add tests” placeholders.
- Each code-changing step includes concrete target classes/code snippets.

### Type consistency
- `MessageList` optional `emptyText?: string` prop is defined before use.
- `ConversationPage` passes `emptyText` consistently.
- No backend API/types changes are introduced.
