# Define Scene Graph Types

## Task 1: Design and implement core Scene Graph types

Update `src/types/index.ts` to include:

### Element Types
- `BaseElement`: Common fields (id, type, name, x, y, width, height, rotation, opacity, visible)
- Specific element types: `ShapeElement`, `TextElement`, `ImageElement`
- `Element` as a discriminated union of all element types
- `ElementType` enum for extensibility

### Document & Slide Types
- `Slide`: id, name, elementIds (string[]), order, background
- `Document`: id, name, slides (Record<string, Slide>), currentSlideId, slideOrder

### Animation Types
- `Keyframe`: time, value, easing function
- `Animation`: id, elementId, property, keyframes[]

### Editor State (separate from scene data per Rule 3)
- `EditorState`: selectedElementIds, zoom, viewport, tool mode

### Key Design Decisions
- Elements stored as `Record<string, Element>` (flat map, not nested)
- Slides reference elements by `elementIds: string[]` (id references, no nested objects)
- `children` relationships use id references, not nested objects
- No React dependency (Rule 4)

## Task 2: Provide mock data

Create a `createMockDocument()` factory function that returns a `Document` with:
- 1 slide containing at least 3 elements (shape, text, image)
- Sample animations with keyframes
- Validates the flat Record structure

## Task 3: Verify TypeScript compilation

Run `npx tsc --noEmit` to ensure all types compile cleanly in strict mode.
