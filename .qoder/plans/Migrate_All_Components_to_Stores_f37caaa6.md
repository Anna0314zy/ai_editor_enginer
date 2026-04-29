# Migrate All Components to Precise Store Subscription

## Architecture
- `main.tsx` creates Engine and wraps the app in `StoreProvider`
- Components use `useStores()` to access store instances
- Components use `useSceneStore`, `useSelectionStore`, etc. for reactive reads
- `engine` prop is retained on components that execute commands (mutations still go through Engine)
- `PreviewModal` is read-only and can drop the `engine` prop entirely

---

## Task 1: Wire StoreProvider in main.tsx
**File:** `src/main.tsx`

Move engine and animationEngine creation from `App.tsx` to `main.tsx`. Wrap `<App />` with `<StoreProvider engine={engine}>`.

```tsx
const engine = createEngine();
const animationEngine = new AnimationEngine(new WebAnimationAdapter());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider engine={engine}>
      <App engine={engine} animationEngine={animationEngine} />
    </StoreProvider>
  </StrictMode>,
);
```

---

## Task 2: Migrate App.tsx
**File:** `src/App.tsx`

**Remove:** `useEngineSnapshot` import and `const snapshot = useEngineSnapshot(engine)`.

**Add:** `useStores`, `useSceneStore`, `useSelectionStore`, `useHistoryStore`, `useAnimationStore` imports.

**Replace render-time reads:**
- `engine.scene.getDocument().currentPageId` and `engine.scene.getPageElements(...).length` → `useSceneStore(sceneStore)`
- `engine.canUndo()` / `engine.canRedo()` in toolbar → `useHistoryStore(historyStore)`
- `engine.getEditorState().selectedElementIds` in Delete handler → `useSelectionStore(selectionStore)`

**Replace effect dependencies:**
- Effects that previously depended on `snapshot` now depend on specific snapshot values (e.g., `currentPageAnimations`, `currentPageId`) from `useAnimationStore` and `useSceneStore`.

**Keep:** `engine` prop for passing to children and for `engine.execute()` / `engine.setEditorState()` in event handlers.

---

## Task 3: Migrate Canvas.tsx
**File:** `src/components/Canvas.tsx`

**Add:** `useStores`, `useSceneStore`, `useSelectionStore` imports.

**Replace:**
- `const doc = engine.scene.getDocument()` and `const currentPageId = doc.currentPageId` → `const { currentPageId, currentPage } = useSceneStore(sceneStore)`
- `const elements = engine.scene.getPageElements(currentPageId)` → `const { currentPageElements: elements } = useSceneStore(sceneStore)`
- `const selectedIds = engine.getEditorState().selectedElementIds` → `const { selectedIds } = useSelectionStore(selectionStore)`
- `engine.setEditorState({ selectedElementIds: [element.id] })` → `selectionStore.select(element.id)`
- `engine.setEditorState({ selectedElementIds: [] })` → `selectionStore.clear()`

**Keep:** `engine` prop for `engine.execute(new AddElementCommand(...))`.

---

## Task 4: Migrate MoveableLayer.tsx
**File:** `src/components/MoveableLayer.tsx`

**Remove:** `useEngineSnapshot` import and `const version = useEngineSnapshot(engine)`.

**Add:** `useStores`, `useSelectionStore`, `useSceneStore` imports.

**Replace:**
- `engine.getEditorState().selectedElementIds` in `useEffect` → `const { selectedIds } = useSelectionStore(selectionStore)`
- `engine.scene.getDocument().currentPageId` and `engine.scene.getPageElements(pageId)` in `useEffect` → `const { currentPageId, currentPageElements } = useSceneStore(sceneStore)`
- `engine.scene.getElement(id)` in event handlers → `sceneStore.getElement(id)`

**Update `useEffect` dependencies:** Replace `[engine, version]` with `[selectionStore, sceneStore, containerRef]` and read from store snapshots inside the effect.

**Keep:** `engine` prop for `engine.execute(MoveElementCommand / BatchMoveCommand)`.

---

## Task 5: Migrate PropertyPanel.tsx
**File:** `src/components/PropertyPanel.tsx`

**Add:** `useStores`, `useSelectionStore`, `useSceneStore` imports.

**Replace:**
- `engine.getEditorState().selectedElementIds` → `const { selectedIds, firstSelectedId } = useSelectionStore(selectionStore)`
- `engine.scene.getElement(selectedIds[0])` → `sceneStore.getElement(firstSelectedId ?? '')`

**Keep:** `engine` prop for `engine.execute(new MoveElementCommand(...))`.

---

## Task 6: Migrate StructurePanel.tsx
**File:** `src/components/StructurePanel.tsx`

**Add:** `useStores`, `useSceneStore` imports.

**Replace:**
- `const doc = engine.scene.getDocument()` and all `doc.pages`, `doc.nodes`, `doc.structureItems`, `doc.currentPageId` reads → `const { document: doc, currentPageId } = useSceneStore(sceneStore)`

**Keep:** `engine` prop for command execution (`AddPageCommand`, `RemovePageCommand`, `ReorderStructureItemsCommand`, etc.) and `engine.setCurrentPageId()`.

---

## Task 7: Migrate AnimationPanel.tsx
**File:** `src/components/AnimationPanel.tsx`

**Add:** `useStores`, `useSceneStore`, `useSelectionStore`, `useAnimationStore` imports.

**Replace:**
- `engine.scene.getDocument()` / `doc.currentPageId` / `doc.pages[pageId]` → `useSceneStore(sceneStore)`
- `engine.scene.getPageAnimations(pageId)` → `useAnimationStore(animationStore).currentPageAnimations`
- `engine.getEditorState().selectedElementIds` / `selectedIds[0]` → `useSelectionStore(selectionStore)`
- `engine.scene.getPageElements(pageId)` → `sceneStore.getPageElements(pageId)`
- `engine.scene.getAnimation(id)` → `sceneStore.getAnimation(id)` or `animationStore.getAnimation(id)`

**Keep:** `engine` prop for command execution (`AddAnimationCommand`, `RemoveAnimationCommand`, `UpdateAnimationCommand`, `ReorderAnimationsCommand`).

---

## Task 8: Migrate PreviewModal.tsx
**File:** `src/components/PreviewModal.tsx`

**Add:** `useStores`, `useSceneStore`, `useAnimationStore` imports.

**Replace:**
- `engine.scene.getDocument()` / `doc.structureItems` / `doc.currentPageId` / `doc.pages[previewPageId]` → `useSceneStore(sceneStore)`
- `engine.scene.getPageElements(previewPageId)` → `sceneStore.getPageElements(previewPageId)`
- `engine.scene.getPageAnimations(previewPageId)` → `animationStore.getAnimation(...)` or derive from store snapshot

**Drop:** `engine` prop entirely. `PreviewModal` is read-only; it only needs `animationEngine` for playback control.

---

## Task 9: Verify TypeScript Compilation
Run `npx tsc --noEmit` to ensure all migrated components compile cleanly.

---

## Deliverables Summary

| File | Change Type |
|------|------------|
| `src/main.tsx` | Wrap App with StoreProvider, move engine creation here |
| `src/App.tsx` | Remove `useEngineSnapshot`, adopt store hooks |
| `src/components/Canvas.tsx` | Replace direct engine reads with SceneStore + SelectionStore |
| `src/components/MoveableLayer.tsx` | Replace `useEngineSnapshot` + direct reads with store hooks |
| `src/components/PropertyPanel.tsx` | Replace direct reads with SelectionStore + SceneStore |
| `src/components/StructurePanel.tsx` | Replace `doc` reads with SceneStore snapshot |
| `src/components/AnimationPanel.tsx` | Replace scene/selection reads with store hooks |
| `src/components/PreviewModal.tsx` | Drop `engine` prop, use SceneStore + AnimationStore |
