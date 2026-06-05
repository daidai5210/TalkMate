# T-007 Practice History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a historical practice list on the home page so users can open a past conversation, review all messages, and access its summary when available.

**Architecture:** Keep T-007 minimal by extending the existing conversation module instead of adding a separate records module. Backend adds a current-user conversation list endpoint with summary score metadata and tight ownership checks on conversation detail/message endpoints. Frontend adds a small history service/component and reuses the existing `ConversationPage`, `MessageList`, and `SummaryPage` routes.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic v2, SQLite, React 18, TypeScript, Zustand, React Router v6, Axios, Tailwind CSS.

---

## Scope and Constraints

- Do not implement filtering/sorting UI, export, progress charts, historical comparison, independent record management page, or T-008 responsive cleanup.
- Do not submit `.team-secrets.md`, `backend/.env`, `frontend/.env`, `talkmate.db`, `backend/talkmate.db`, caches, or build artifacts.
- PM allowed `frontend/src/pages/HomePage.tsx`, but this repo's actual home page is `frontend/src/app/HomePage.tsx`; use the real file and mention this in the final report.
- Keep backend changes inside `backend/app/modules/conversation/` unless docs update is needed.
- Preserve T-001~T-006 flows.

## File Structure

### Backend

- Modify `backend/app/modules/conversation/schemas.py`
  - Add `ConversationHistoryItem` schema for list records.
  - Add optional `summary_score` and `has_summary` metadata.
- Modify `backend/app/modules/conversation/repository.py`
  - Add `list_by_user(user_id)` query joining scenario and summary data via ORM-safe loading.
  - Keep existing `get_by_id()` behavior for full detail.
- Modify `backend/app/modules/conversation/service.py`
  - Add `list_history(user_id)`.
  - Add user ownership checks to `get()` and `send_message()`.
  - Keep `create()` unchanged except cleanup only if needed.
- Modify `backend/app/modules/conversation/routes.py`
  - Add `GET /api/v1/conversations` list endpoint before `GET /{conversation_id}`.
  - Pass `user_id` into `get()` and `send_message()`.
- Modify `backend/app/modules/conversation/tests/test_conversation.py`
  - Add tests for list records, score metadata, empty list, ownership restrictions.

### Frontend

- Modify `frontend/src/features/conversation/types.ts`
  - Add `ConversationHistoryItem`.
- Modify `frontend/src/features/conversation/conversationService.ts`
  - Add `listConversations()`.
- Create `frontend/src/services/historyService.ts` only if we want to keep history out of `features/conversation`; preferred minimal approach is to keep list API in `features/conversation/conversationService.ts` because it is the same backend resource.
- Create `frontend/src/components/PracticeHistoryList.tsx`
  - Render Loading / Empty / Error / list states.
  - Each item links to `/conversation/history/:id`.
  - If `has_summary`, show a summary link to `/conversation/:id/summary`.
- Modify `frontend/src/app/HomePage.tsx`
  - Fetch history on mount.
  - Render history section below scenario selection.
- Modify `frontend/src/app/router.tsx`
  - Add `/conversation/history/:conversationId` route to `ConversationPage`.
- Modify `frontend/src/app/ConversationPage.tsx`
  - Support two modes:
    - scenario mode: `/conversation/:id` creates/loads current scenario session.
    - history mode: `/conversation/history/:conversationId` loads existing conversation and disables sending new messages.
  - Show summary link when reviewing history.

### Docs

- Modify `docs/api/conversations.md` if endpoint response shape changes.

---

## Task 1: Backend list endpoint and ownership-safe detail

**Files:**
- Modify: `backend/app/modules/conversation/schemas.py`
- Modify: `backend/app/modules/conversation/repository.py`
- Modify: `backend/app/modules/conversation/service.py`
- Modify: `backend/app/modules/conversation/routes.py`
- Test: `backend/app/modules/conversation/tests/test_conversation.py`

- [ ] **Step 1: Add failing backend tests**

Append these tests to `backend/app/modules/conversation/tests/test_conversation.py`:

```python
def test_list_conversations_empty(client: TestClient) -> None:
    token = _register_login(client, "hist_empty")
    resp = client.get("/api/v1/conversations", headers=_auth_header(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"] == []


def test_list_conversations_includes_scenario_date_score(client: TestClient, mock_ai_client) -> None:
    token = _register_login(client, "hist_user")
    create = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 1},
        headers=_auth_header(token),
    )
    conv_id = create.json()["data"]["id"]
    msg = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"text": "I am go to school"},
        headers=_auth_header(token),
    )
    assert msg.status_code == 200

    # Insert a persisted summary directly so the list can expose score metadata
    from app.db.session import get_db  # imported to document dependency override path only
    from app.modules.summary.models import Summary

    db = next(app.dependency_overrides[get_db]())
    db.add(
        Summary(
            conversation_id=conv_id,
            score=82,
            feedback="[]",
            suggestions="[]",
        )
    )
    db.commit()
    db.close()

    resp = client.get("/api/v1/conversations", headers=_auth_header(token))
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert len(data) == 1
    item = data[0]
    assert item["id"] == conv_id
    assert item["scenario"]["name"] == "面试"
    assert item["scenario"]["icon"]
    assert item["created_at"]
    assert item["finished_at"] is None
    assert item["message_count"] == 2
    assert item["summary_score"] == 82
    assert item["has_summary"] is True


def test_list_conversations_only_current_user(client: TestClient) -> None:
    token_a = _register_login(client, "hist_owner_a")
    token_b = _register_login(client, "hist_owner_b")
    create = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 2},
        headers=_auth_header(token_a),
    )
    conv_id = create.json()["data"]["id"]

    resp_a = client.get("/api/v1/conversations", headers=_auth_header(token_a))
    resp_b = client.get("/api/v1/conversations", headers=_auth_header(token_b))

    assert [item["id"] for item in resp_a.json()["data"]] == [conv_id]
    assert resp_b.json()["data"] == []


def test_get_conversation_forbidden_for_other_user(client: TestClient) -> None:
    token_a = _register_login(client, "hist_detail_a")
    token_b = _register_login(client, "hist_detail_b")
    create = client.post(
        "/api/v1/conversations",
        json={"scenario_id": 1},
        headers=_auth_header(token_a),
    )
    conv_id = create.json()["data"]["id"]

    resp = client.get(f"/api/v1/conversations/{conv_id}", headers=_auth_header(token_b))

    assert resp.status_code == 400
    assert resp.json()["code"] == 4001
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend && ./venv/bin/pytest app/modules/conversation/tests/test_conversation.py -q
```

Expected: failures because `GET /api/v1/conversations` does not exist and service does not enforce ownership on detail.

- [ ] **Step 3: Add backend schemas**

In `backend/app/modules/conversation/schemas.py`, add after `ConversationPublic`:

```python
class ConversationHistoryItem(BaseModel):
    id: int
    scenario: ScenarioSummary
    created_at: datetime
    finished_at: Optional[datetime] = None
    message_count: int = 0
    summary_score: Optional[int] = None
    has_summary: bool = False
```

- [ ] **Step 4: Add repository list query**

In `backend/app/modules/conversation/repository.py`, update imports:

```python
from sqlalchemy.orm import Session, joinedload
```

Add method to `ConversationRepository`:

```python
    def list_by_user(self, user_id: int) -> List[Conversation]:
        return (
            self.db.query(Conversation)
            .options(joinedload(Conversation.messages))
            .filter(Conversation.user_id == user_id, Conversation.deleted_at.is_(None))
            .order_by(Conversation.created_at.desc(), Conversation.id.desc())
            .all()
        )
```

- [ ] **Step 5: Add service list and ownership checks**

In `backend/app/modules/conversation/service.py`, update schema imports:

```python
from app.modules.conversation.schemas import (
    ConversationHistoryItem,
    ConversationPublic,
    MessagePublic,
    ScenarioSummary,
    SendMessageResponse,
)
```

Replace `get()` and `send_message()` signatures and add list method:

```python
    def list_history(self, user_id: int) -> list[ConversationHistoryItem]:
        conversations = self.conv_repo.list_by_user(user_id)
        scenarios = self.scenario_repo.list_ordered()
        scenario_by_id = {s.id: s for s in scenarios}
        items: list[ConversationHistoryItem] = []
        for conv in conversations:
            scen = scenario_by_id.get(conv.scenario_id)
            if scen is None:
                continue
            summary_obj = None
            raw_summary = getattr(conv, "summary", None)
            if isinstance(raw_summary, list):
                summary_obj = raw_summary[0] if raw_summary else None
            else:
                summary_obj = raw_summary
            items.append(
                ConversationHistoryItem(
                    id=conv.id,
                    scenario=ScenarioSummary(id=scen.id, name=scen.name, icon=scen.icon),
                    created_at=conv.created_at,
                    finished_at=conv.finished_at,
                    message_count=len(conv.messages),
                    summary_score=summary_obj.score if summary_obj else None,
                    has_summary=summary_obj is not None,
                )
            )
        return items

    def get(self, conversation_id: int, user_id: int) -> ConversationPublic:
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(self.ERR_CONVERSATION_NOT_FOUND, "对话不存在")
        if conv.user_id != user_id:
            raise BusinessError(4001, "无权访问该对话")
        return self._to_public(conv)

    def send_message(self, conversation_id: int, text: str, user_id: int) -> SendMessageResponse:
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(self.ERR_CONVERSATION_NOT_FOUND, "对话不存在")
        if conv.user_id != user_id:
            raise BusinessError(4001, "无权访问该对话")
        # keep the existing method body after this point
```

Keep the existing body of `send_message()` after the new ownership check.

- [ ] **Step 6: Add route and pass user_id**

In `backend/app/modules/conversation/routes.py`, update imports:

```python
from app.modules.conversation.schemas import (
    ConversationPublic,
    CreateConversationRequest,
    SendMessageRequest,
    SendMessageResponse,
)
```

Add this route before `@router.get("/{conversation_id}")`:

```python
@router.get("")
def list_conversations(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    items = service.list_history(user_id=user_id)
    return ok(data=[item.model_dump(mode="json") for item in items])
```

Change detail route:

```python
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    conv = service.get(conversation_id=conversation_id, user_id=user_id)
```

Change send route:

```python
    user_id = _require_user_id(authorization)
    service = ConversationService(db)
    result: SendMessageResponse = service.send_message(
        conversation_id=conversation_id, text=payload.text, user_id=user_id
    )
```

- [ ] **Step 7: Run backend tests**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend && ./venv/bin/pytest app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py -q
```

Expected: all tests pass.

---

## Task 2: Frontend history service and list component

**Files:**
- Modify: `frontend/src/features/conversation/types.ts`
- Modify: `frontend/src/features/conversation/conversationService.ts`
- Create: `frontend/src/components/PracticeHistoryList.tsx`

- [ ] **Step 1: Add frontend type**

In `frontend/src/features/conversation/types.ts`, add:

```ts
export interface ConversationHistoryItem {
  id: number;
  scenario: ScenarioSummary;
  created_at: string;
  finished_at: string | null;
  message_count: number;
  summary_score: number | null;
  has_summary: boolean;
}
```

- [ ] **Step 2: Add list API function**

In `frontend/src/features/conversation/conversationService.ts`, update import:

```ts
import type { Conversation, ConversationHistoryItem, SendMessageResult } from './types';
```

Add function before `createConversation()`:

```ts
export async function listConversations(): Promise<ConversationHistoryItem[]> {
  try {
    const { data } = await api.get<ApiResponse<ConversationHistoryItem[]>>(
      '/api/v1/conversations',
    );
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message);
    }
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { message?: string } | undefined;
      if (body?.message) throw new Error(body.message);
    }
    if (err instanceof Error) throw err;
    throw new Error('获取练习记录失败');
  }
}
```

- [ ] **Step 3: Create history list component**

Create `frontend/src/components/PracticeHistoryList.tsx`:

```tsx
import { Link } from 'react-router-dom';
import type { ConversationHistoryItem } from '../features/conversation/types';

interface Props {
  records: ConversationHistoryItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function PracticeHistoryList({ records, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="grid gap-3" data-testid="history-loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm" data-testid="history-error">
        <p className="font-medium text-red-700">加载练习记录失败:{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          data-testid="history-retry"
        >
          重试
        </button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center" data-testid="history-empty">
        <p className="font-medium text-slate-700">暂无练习记录</p>
        <p className="mt-1 text-sm text-slate-500">完成一次对话并生成总结后，这里会显示你的历史练习。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3" data-testid="history-list">
      {records.map((record) => (
        <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link
              to={`/conversation/history/${record.id}`}
              className="min-w-0 flex-1 hover:text-brand-700"
              data-testid="history-item-link"
            >
              <p className="truncate text-base font-semibold text-slate-900">
                {record.scenario.icon} {record.scenario.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(record.created_at)} · {record.message_count} 条消息
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700" data-testid="history-score">
                {record.summary_score == null ? '未评分' : `${record.summary_score} 分`}
              </span>
              {record.has_summary && (
                <Link
                  to={`/conversation/${record.id}/summary`}
                  className="rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
                  data-testid="history-summary-link"
                >
                  查看总结
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run frontend build to catch type errors**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend && npm run build
```

Expected: build passes or only fails in HomePage because the new component is not yet wired.

---

## Task 3: Home page history section

**Files:**
- Modify: `frontend/src/app/HomePage.tsx`

- [ ] **Step 1: Add imports and state**

In `frontend/src/app/HomePage.tsx`, replace imports with:

```tsx
import { useEffect, useState } from 'react';
import NavBar from './NavBar';
import PracticeHistoryList from '../components/PracticeHistoryList';
import ScenarioList, {
  ScenarioListEmpty,
  ScenarioListSkeleton,
} from '../features/scenario/ScenarioList';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
```

Inside `HomePage`, after scenario store:

```tsx
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  async function fetchHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await listConversations();
      setHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取练习记录失败';
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
    }
  }
```

- [ ] **Step 2: Fetch history on mount**

Add effect after scenario fetch effect:

```tsx
  useEffect(() => {
    void fetchHistory();
  }, []);
```

- [ ] **Step 3: Render history section below scenarios**

After the scenario list rendering block, add:

```tsx
        <section className="mt-10" data-testid="practice-history-section">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">历史练习记录</h2>
              <p className="text-sm text-gray-500">回顾过去的对话、评分和课后总结</p>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand-300 hover:text-brand-700"
              data-testid="history-refresh"
            >
              刷新
            </button>
          </div>
          <PracticeHistoryList
            records={history}
            loading={historyLoading}
            error={historyError}
            onRetry={fetchHistory}
          />
        </section>
```

- [ ] **Step 4: Run frontend build**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend && npm run build
```

Expected: TypeScript and Vite build pass.

---

## Task 4: Conversation history review route

**Files:**
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/app/ConversationPage.tsx`

- [ ] **Step 1: Add history route**

In `frontend/src/app/router.tsx`, add route before `/conversation/:id/summary` or before `/conversation/:id`:

```tsx
      <Route
        path="/conversation/history/:conversationId"
        element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        }
      />
```

- [ ] **Step 2: Update ConversationPage route params and mode**

In `frontend/src/app/ConversationPage.tsx`, replace param extraction:

```tsx
  const { id: scenarioIdParam, conversationId: conversationIdParam } = useParams<{
    id?: string;
    conversationId?: string;
  }>();
```

Add after state declarations:

```tsx
  const isHistoryMode = Boolean(conversationIdParam);
  const historyConversationId = conversationIdParam ? Number(conversationIdParam) : NaN;
```

Change `scenarioId` line:

```tsx
  const scenarioId = scenarioIdParam ? Number(scenarioIdParam) : NaN;
```

- [ ] **Step 3: Load existing conversation in history mode**

Include `loadExisting` in store destructuring:

```tsx
    loadExisting,
```

Add effect before scenario loading effect:

```tsx
  useEffect(() => {
    if (!isHistoryMode) return;
    if (!Number.isFinite(historyConversationId)) return;
    void loadExisting(historyConversationId);
  }, [isHistoryMode, historyConversationId, loadExisting]);
```

Change existing scenario fetch/init effects to skip history mode:

```tsx
  useEffect(() => {
    if (isHistoryMode) return;
    if (!Number.isFinite(scenarioId)) {
      return;
    }
    if (scenarios.length === 0) {
      void fetchScenarios();
    }
  }, [isHistoryMode, scenarioId, scenarios.length, fetchScenarios]);

  useEffect(() => {
    if (isHistoryMode) return;
    if (scenario && !conversation) {
      void initFromScenario(scenario);
    }
  }, [isHistoryMode, scenario, conversation, initFromScenario]);
```

- [ ] **Step 4: Adjust invalid/loading UI**

Replace invalid check:

```tsx
  if (isHistoryMode && !Number.isFinite(historyConversationId)) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600">无效的对话 ID</p>
      </div>
    );
  }

  if (!isHistoryMode && !Number.isFinite(scenarioId)) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600">无效的场景 ID</p>
      </div>
    );
  }
```

Replace loading check:

```tsx
  if (loading || (!isHistoryMode && !scenario)) {
```

- [ ] **Step 5: Render history title and disable sending**

Replace title span:

```tsx
            <span className="text-base font-medium">
              {isHistoryMode
                ? `${conversation?.scenario.icon ?? ''} ${conversation?.scenario.name ?? '历史对话'}`
                : `${scenario?.icon ?? ''} ${scenario?.name ?? ''}`}
            </span>
```

Replace end conversation button with conditional block:

```tsx
          {isHistoryMode && conversation ? (
            <button
              type="button"
              onClick={() => navigate(`/conversation/${conversation.id}/summary`)}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
              data-testid="history-summary-button"
            >
              查看总结
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEndConversation}
              disabled={!conversation || ending || sending}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="end-conversation-button"
            >
              {ending ? '生成总结中…' : '结束对话'}
            </button>
          )}
```

Replace input rendering:

```tsx
        <MessageList messages={conversation?.messages ?? []} sending={sending && !isHistoryMode} />
        {isHistoryMode ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500" data-testid="history-readonly-tip">
            这是历史对话回溯，不能继续发送新消息。
          </div>
        ) : (
          <MessageInput onSend={send} disabled={sending} />
        )}
```

- [ ] **Step 6: Run frontend build**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend && npm run build
```

Expected: build passes.

---

## Task 5: API docs and final regression

**Files:**
- Modify: `docs/api/conversations.md`

- [ ] **Step 1: Document list endpoint**

Append to `docs/api/conversations.md`:

```markdown
## GET /api/v1/conversations

获取当前登录用户的历史练习记录列表。

### Headers

- `Authorization: Bearer <token>`

### Response

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "scenario": {
        "id": 1,
        "name": "面试",
        "icon": "💼"
      },
      "created_at": "2026-06-05T10:00:00",
      "finished_at": "2026-06-05T10:05:00",
      "message_count": 6,
      "summary_score": 82,
      "has_summary": true
    }
  ]
}
```

### Notes

- 仅返回当前用户自己的未删除对话。
- `summary_score` 为 `null` 表示该对话尚未生成总结。
- `has_summary=false` 时前端不展示“查看总结”入口。
```

- [ ] **Step 2: Run backend tests**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend && ./venv/bin/pytest app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py -q
```

Expected: pass.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend && npm run build
```

Expected: pass.

- [ ] **Step 4: Manual API smoke test without committing secrets**

Run against local backend if already running with valid DeepSeek config:

```bash
cd /home/user13/Desktop/talkmate/backend && ./venv/bin/python - <<'PY'
import json
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

base = 'http://127.0.0.1:8000/api/v1'

def call(method, path, body=None, token=None, timeout=60):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = Request(base + path, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except HTTPError as e:
        return e.code, json.loads(e.read().decode())

username = f't007_{int(time.time())}'
password = 'TestPass123'
print('register', call('POST', '/auth/register', {'username': username, 'password': password, 'captcha': '1234'})[0])
status, login = call('POST', '/auth/login', {'username': username, 'password': password})
token = login['data']['token']
status, empty = call('GET', '/conversations', token=token)
print('empty_history', status, empty['data'])
status, conv = call('POST', '/conversations', {'scenario_id': 1}, token=token)
conv_id = conv['data']['id']
call('POST', f'/conversations/{conv_id}/messages', {'text': 'I want to practice a job interview.'}, token=token, timeout=120)
status, before = call('GET', '/conversations', token=token)
print('history_before_summary', status, before['data'][0]['has_summary'], before['data'][0]['summary_score'])
call('POST', f'/conversations/{conv_id}/summary', token=token, timeout=180)
status, after = call('GET', '/conversations', token=token)
print('history_after_summary', status, after['data'][0]['has_summary'], after['data'][0]['summary_score'])
status, detail = call('GET', f'/conversations/{conv_id}', token=token)
print('detail_messages', status, len(detail['data']['messages']))
PY
```

Expected:

```text
empty_history 200 []
history_before_summary 200 False None
history_after_summary 200 True <non-null score>
detail_messages 200 2
```

- [ ] **Step 5: Check Git status for forbidden files**

Run:

```bash
cd /home/user13/Desktop/talkmate && git status --short --ignored
```

Expected:

- `.team-secrets.md`, `backend/.env`, `frontend/.env`, build outputs, caches show as ignored (`!!`) if present.
- `talkmate.db` and `backend/talkmate.db` must not be staged or committed.

---

## Self-Review

### Spec coverage

- 首页历史练习记录列表: Task 3.
- 展示场景名、日期、评分: Task 1 backend fields + Task 2 component.
- 点击记录进入对话详情: Task 2 links + Task 4 route.
- 查看完整对话消息: Task 4 reuses `MessageList` with `loadExisting()`.
- 已有总结可进入/展示总结: Task 2 summary link + Task 4 summary button + existing `SummaryPage`.
- Loading / Empty / Error: Task 2 component.
- 后端列表/详情字段最小补齐: Task 1 only.
- 不包含筛选/排序/导出/曲线/历史对比/独立记录页/T-008: respected.
- 不破坏 T-001~T-006: Task 5 tests and smoke.
- Secrets/db not committed: Task 5 status check.

### Placeholder scan

No TBD/TODO placeholders remain. Each implementation task has exact file paths and code blocks.

### Type consistency

Backend `ConversationHistoryItem` fields match frontend `ConversationHistoryItem`: `id`, `scenario`, `created_at`, `finished_at`, `message_count`, `summary_score`, `has_summary`.
