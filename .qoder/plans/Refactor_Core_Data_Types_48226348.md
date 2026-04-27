# Refactor Core Data Types

## Goal
Replace the hierarchical `Slide`-based data model in `src/types/index.ts` with the new `Node`/`Page`/`StructureItem` flat model as specified.

## Changes to `src/types/index.ts`

1. **Remove** `Slide` interface (replaced by `Page`).
2. **Add** new core types:
   - `StructureItem`: union of `{ type: 'node'; id: string } | { type: 'page'; id: string }`
   - `Node`: `{ id: string; name: string }` (no `pageIds`)
   - `Page`: `{ id: string; name: string; background: string; elements: Record<string, Element>; animations: Record<string, AnimationConfig> }`
3. **Rewrite** `Document` interface:
   - Remove: `elements`, `slides`, `animations`, `currentSlideId`, `slideOrder`
   - Add: `pages: Record<string, Page>`, `nodes: Record<string, Node>`, `structureItems: StructureItem[]`, `currentPageId: string`
4. **Remove** mock data functions (`createMockDocument`, `createMockAnimations`) because they reference the old `Slide` type and will cause compilation errors.
5. **Preserve** all unrelated types exactly as-is: `Element` hierarchy, `Guide`, `SnapResult`, `Command`, `Animation`, `Keyframe`, `EditorState`, `Viewport`, `ToolMode`.

## Verification
- Ensure `src/types/index.ts` compiles after changes.
- Confirm no references to old `Slide` or `Document` shapes remain in the types file.
