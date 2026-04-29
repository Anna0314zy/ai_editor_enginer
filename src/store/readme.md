

---

## 一、订阅链路隔离：每个 Store 只监听特定 Topic

看 `EngineStore` 的构造函数（[`src/store/baseStore.ts`](file:///Users/zouyu/Desktop/practice/ai_editor_enginer/src/store/baseStore.ts#L28-L38)）：

```ts
constructor(protected engine: Engine, topics: EngineTopic[]) {
  super();
  const handler = (): void => this.emit();
  for (const topic of topics) {
    this.engine.subscribe(topic, handler);
  }
}
```

每个 Store 实例化时传入的 topic 列表是**互不相交**的：

| Store | 订阅的 Topic | 触发源 |
|-------|-------------|--------|
| `SceneStore` | `['scene']` | `execute()` / `undo()` / `redo()` / `setCurrentPageId()` |
| `SelectionStore` | `['editorState']` | `setEditorState()` |
| `EditorUIStore` | `['editorState']` | `setEditorState()` |
| `HistoryStore` | `['history']` | `undo()` / `redo()` |
| `AnimationStore` | `['scene']` + `timeline.subscribe()` | 场景变更 + 时间轴播放 |

而 Engine 的 `notify()`（[`src/engine/engine.ts`](file:///Users/zouyu/Desktop/practice/ai_editor_enginer/src/engine/engine.ts#L62-L72)）是**分 topic 派发**的：

```ts
private notify(topic: EngineTopic): void {
  for (const cb of this.listeners) { cb(); }     // 全局 listeners（旧模式）
  const topicSet = this.topicListeners.get(topic);
  if (topicSet) {
    for (const cb of topicSet) { cb(); }         // 只有该 topic 的 listeners 被触发
  }
}
```

当调用 `engine.setEditorState({ selectedElementIds: [id] })` 时，Engine 只 `notify('editorState')`。此时：
- `SelectionStore` 和 `EditorUIStore` 收到回调 → `emit()` → React 重渲染
- `SceneStore`、`HistoryStore` **不会**收到回调 → 不触发重渲染

这就是精准订阅的第一层证明：**topic 级别的物理隔离**。

---

## 二、React 层面：组件只订阅自己关心的 Store

看 hooks 的实现（[`src/store/hooks.ts`](file:///Users/zouyu/Desktop/practice/ai_editor_enginer/src/store/hooks.ts#L6-L8)）：

```ts
export function useSelectionStore(store: SelectionStore): SelectionSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
```

`useSyncExternalStore` 的语义是：只有当 `store.subscribe` 的回调被触发时，React 才会调度重渲染。

假设一个组件只使用 `useSelectionStore`：

```tsx
function SelectionInspector() {
  const { selectionStore } = useStores();
  const { selectedIds } = useSelectionStore(selectionStore);
  console.log('SelectionInspector render');
  return <div>{selectedIds.join(', ')}</div>;
}
```

当用户拖拽一个元素时，App 调用 `engine.execute(new MoveElementCommand(...))`，Engine `notify('scene')`。此时：
- `SelectionInspector` **不会**重渲染，因为它只订阅了 `selectionStore`，而 `selectionStore` 监听的是 `'editorState'`，不是 `'scene'`。

但如果用旧的 `useEngineSnapshot(engine)`：

```tsx
function SelectionInspectorOld() {
  useEngineSnapshot(engine);  // 订阅全局 listeners
  const selectedIds = engine.getEditorState().selectedElementIds;
  console.log('SelectionInspectorOld render');
  return <div>{selectedIds.join(', ')}</div>;
}
```

同样的拖拽操作会触发 `notify('scene')`，而 `notify('scene')` 里的全局 listener 循环（`for (const cb of this.listeners)`）会触发 **所有**全局订阅者。所以这个组件会**无故重渲染**。

---

## 三、对比旧模式：从"全量订阅"到"精准订阅"

| 维度 | `useEngineSnapshot(engine)`（旧） | `useXxxStore(store)`（新） |
|------|----------------------------------|---------------------------|
| **订阅粒度** | Engine 全局（`listeners` Set） | Store 实例（`topicListeners` Map） |
| **触发范围** | 任何 mutation 都触发所有订阅组件 | 只有相关 topic 的 mutation 触发 |
| **数据来源** | 组件直接从 engine 读取 | Store 派生 snapshot |
| **隔离性** | 无隔离 | Scene/Selection/History/UI 完全隔离 |

---

## 四、如果需要一个可运行的实验证明

可以临时在控制台跑这段验证逻辑（不需要修改任何文件）：

```ts
const engine = (window as any)._engine;

// 1. 创建 Store
const sceneStore = new SceneStore(engine);
const selectionStore = new SelectionStore(engine);
const historyStore = new HistoryStore(engine);

// 2. 给每个 Store 加日志
sceneStore.subscribe(() => console.log('SceneStore emitted'));
selectionStore.subscribe(() => console.log('SelectionStore emitted'));
historyStore.subscribe(() => console.log('HistoryStore emitted'));

// 3. 测试：只改 selection（应该只有 SelectionStore 触发）
selectionStore.select('el-test');
// 控制台输出: SelectionStore emitted
// SceneStore 和 HistoryStore 无输出

// 4. 测试：执行一个命令（应该只有 SceneStore 触发）
engine.execute(new MoveElementCommand(engine.scene, 'el-test', { x: 100 }));
// 控制台输出: SceneStore emitted
// SelectionStore 和 HistoryStore 无输出
```

由于 `(window as any)._engine = engine` 已经在 [`App.tsx`](file:///Users/zouyu/Desktop/practice/ai_editor_enginer/src/App.tsx#L14) 中设置，你可以直接在浏览器控制台运行这段代码来验证。

---

## 总结

精准订阅的证明链是：

1. **Engine 层面**：`notify(topic)` 只遍历该 topic 的 `topicListeners`，不会误触其他 topic
2. **Store 层面**：每个 `EngineStore` 构造时只 `subscribe(topic, handler)` 到自己的 topic 列表
3. **React 层面**：`useSyncExternalStore` 只在 `store.subscribe` 的回调触发时重渲染
4. **行为层面**：修改 selection 不会触发 SceneStore 的 listener，反之亦然

这套机制保证了组件只在自己关心的数据域变化时才重渲染。