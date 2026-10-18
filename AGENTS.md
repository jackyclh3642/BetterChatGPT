# BetterChatGPT Agent Guide

## Overview
BetterChatGPT is a React (Vite) frontend for LLM chat. It uses **Zustand** (not Redux) for state with custom persistence via `localforage`. Messages are stored in a **tree structure** for branching conversations, though the linear path is computed on the fly.

## Key Files
- `src/store/store.ts` — Zustand root store + custom persistence (`localforage`)
- `src/store/chat-slice.ts` — Chat/message state
- `src/store/config-slice.ts` — User settings (theme, defaults, jailbreak flags)
- `src/hooks/useSubmit.ts` — Core generation logic + prompt pipeline
- `src/api/api.ts` — `fetch` to OpenAI-compatible endpoints (stream + non-stream)
- `src/utils/chat.ts` — `getMessages(chat)`: flattens message tree into linear history
- `src/utils/messageUtils.ts` — Token counting / truncation with `tiktoken`
- `src/types/chat.ts` — `Role = 'user' | 'assistant' | 'system' | 'jailbreak' | 'prefill'`

---

## 1. Output Generation & Processing

### Submit Flow (`useSubmit.ts` `handleSubmit`)
1. **Clone current chat** to a local `dummyChats` (avoids mutating store mid-stream).
2. **Get linear messages** via `getMessages(dummyChats[currentChatIndex])`.
3. **Token-limit** messages with `limitMessageTokens` (truncates older messages, keeps first system message).
4. **Apply prompt variables** via `simpleMustache` using the prompt library.
5. **Pipeline preprocesses** messages (see §3 below).
6. **Call API**:
   - `getChatCompletionStream(endpoint, messages, config, apiKey, additionalBodyParameters)` for streaming.
   - `getChatCompletion(...)` for title generation.
7. **Stream parsing**: `parseEventSource` splits SSE chunks; reads `delta.content` into a string and appends to the **last assistant message** in store.
   - If `simulateThinking` is enabled, content between `<thinking>` and `</thinking>` is redirected to the `alt` field (model reasoning).
   - `reasoning` field from providers is also read into `alt`.
8. **After stream**: update total token usage, auto-generate title if enabled (`autoTitle`).

### Streaming Data Flow
- API body → `messages.map((m)=>({role: m.role, content: m.content}))` + `config` + `stream: true`.
- Responses are parsed as EventSource chunks. Incomplete chunks are buffered in `partial`.

---

## 2. Persistence (Zustand + localforage)

### Architecture
- **State manager**: Zustand with the `persist` middleware.
- **Storage backend**: `localforage` (IndexedDB/WebSQL/localStorage fallback).
- **Key naming**:
  - Meta key: `free-chat-gpt` — stores the *partialized* state (chats replaced by `chatsID` list).
  - Individual keys: each `ChatInterface.id` stores its own JSON blob.

### Partialization (`store.ts` `createPartializedState`)
Persisted fields include:
- `chats`, `currentChatIndex`
- `folders`, `prompts`
- `apiKey`, `apiEndpoint`
- `theme`, `autoTitle`, `advancedMode`, `enterToSubmit`
- `defaultChatConfig`, `defaultSystemMessage`
- `systemJailbreak`, `squashSystemMessages`, `simulateThinking`
- `promptEngineeringEnabled`, `promptEngineeringScript`
- `totalTokenUsed`, `additionalBodyParameters`, etc.

### Granular Chat Writes
The `customJSONStorage` implements a delta-optimization:
- On save, chats are compared against previous `chatsID`. 
- Only **added or currently-focused** chats are written.
- Removed chats are deleted.

### Important Guard
- `setItem` **bails out if `generating === true`** — this prevents serializing mid-stream state and corrupting the store.

### Migrations
Migrations from V0 → V8 exist in `store/migrate.ts`; currently commented out but structural definitions remain.

---

## 3. Prompt Preprocessing Pipeline (`useSubmit.ts`)

Messages are mutated in a specific order before being sent to the API:

### Step 1: Mustache Substitution
```ts
messages.forEach((m) => {
  if (m.content) m.content = simpleMustache(m.content, prompts);
});
```
- Replaces `{{ variable }}` in message content with values from the Prompt Library (`prompts` store slice).

### Step 2: Extract `prefill` messages
- All `role === 'prefill'` messages are **removed** from the array.
- Their contents are concatenated in order (top to bottom) with `\n\n` separators.
- Result is prepended to the **last assistant message** if one exists.
  - This simulates assistant-prefix prompting (useful for Claude-style APIs).

### Step 3: Extract `jailbreak` message
- Finds the single `jailbreak` message (error if >1).
- Removes it from the array.
- Applies based on `systemJailbreak` flag:
  - **If `systemJailbreak === true`**:
    - Role set to `system.
    - Inserted **before** the last assistant message (if present), or appended.
  - **If `systemJailbreak === false`**:
    - Concatenated to the **most recent `user` message** (trimmed + `\n\n` separator).
    - Error if no user message exists to attach to.

### Step 4: Squash Messages
- **`squashSystemMessages`**: consecutive `system` messages merged with `\n\n`.
- **Always squash**: consecutive `user` messages merged with `\n\n` (hardcoded `true`).

### Step 5: Pop empty last message
- If the final message is empty after processing, it is removed.

### Final message roles sent to API
Only `user`, `assistant`, `system` reach the backend. `prefill` and `jailbreak` are resolved away.

---

## Message Tree Structure
- `ChatInterface.messages` is a **single root `MessageInterface`**.
- Each message has `children: MessageInterface[]` and `childId: number` (index into `children`).
- Linear history = walk from root following `childId` pointers.
- Branching happens by adding an extra child at any message node.
- This is why `getMessages(chat)` is needed everywhere.
- **Messages have an optional `identifier` field** (user-editable label in the editor, shown as a badge in view mode).

## Important Settings
| Setting | Slice | Effect |
|---------|-------|--------|
| `systemJailbreak` | config | Converts jailbreak to system vs appending to last user |
| `squashSystemMessages` | config | Merges adjacent system messages |
| `simulateThinking` | config | Parses `<thinking>` tags into `alt` / reasoning field |
| `additionalBodyParameters` | config | JSON merged into API request body (custom model support) |
| `autoTitle` | config | Sends a summary request after first assistant reply |
| `promptEngineeringEnabled` | config | Toggles custom JS scripting |
| `promptEngineeringScript` | config | JS function body that transforms messages or returns full body |

### Prompt Engineering UI
- **Location**: Settings → Prompt Library → Prompt Engineering
- **Editor**: Custom `CodeEditor` component with PrismJS syntax highlighting, tab insertion, dark/light themes. `PopupModal` uses `fullWidth` for a large editing surface.
- **Preview**: Runs script against the current flattened chat branch, shows:
  - Result JSON (messages or body) with syntax highlighting
  - Captured `console.log` output for debugging
  - Errors in a red banner (non-blocking)