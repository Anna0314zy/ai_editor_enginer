# Rendering System

<cite>
**Referenced Files in This Document**
- [index.tsx](file://src/renderer/index.tsx)
- [Canvas.tsx](file://src/components/Canvas.tsx)
- [index.ts](file://src/engine/index.ts)
- [index.ts](file://src/store/index.ts)
- [index.ts](file://src/types/index.ts)
- [App.tsx](file://src/App.tsx)
- [main.tsx](file://src/main.tsx)
- [package.json](file://package.json)
- [spec.md](file://spec.md)
</cite>

## Update Summary
**Changes Made**
- Enhanced renderer with robust error handling for image loading failures
- Added automatic fallback to custom SVG-based placeholder images
- Improved image source management with reliable placeholder service
- Updated image rendering section to document new error handling mechanism
- Added new section covering image error handling and fallback behavior
- Updated troubleshooting guide to include image loading error scenarios

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Image Error Handling](#enhanced-image-error-handling)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This document describes the Rendering System that transforms scene graph data into visual UI components. The renderer layer is designed as pure data-to-UI transformation utilities that are independent of React lifecycle and DOM rendering specifics. The system has been enhanced with TypeScript implementation providing improved type safety and developer experience, along with robust error handling for image loading failures and automatic fallback mechanisms.

Key architectural principles:
- Transform application for positioning, scaling, and rotation
- Coordinate mapping and layer ordering
- Relationship between renderer functions and React components
- Performance optimization techniques
- Examples of rendering shapes, images, and text
- Managing visual feedback during user interactions
- Future plans for canvas renderer integration and extensibility
- **Enhanced**: Robust error handling for image loading failures with automatic fallback to placeholder images

## Project Structure
The project follows a layered architecture with TypeScript type safety:
- Application bootstrap and UI entry point
- Engine core (framework-agnostic state machine)
- Renderer layer (pure data-to-UI utilities with TypeScript interfaces and enhanced error handling)
- Store (editor state separated from scene data)
- Types (shared TypeScript types)
- Components (React UI shell around the canvas)

```mermaid
graph TB
subgraph "Application Layer"
APP["App.tsx"]
ROOT["main.tsx"]
end
subgraph "UI Shell"
CANVAS["Canvas.tsx"]
END
subgraph "Core Engine"
ENGINE["engine/index.ts"]
END
subgraph "Enhanced Rendering"
RENDERER["renderer/index.tsx<br/>(TypeScript with Error Handling)"]
END
subgraph "State"
STORE["store/index.ts"]
TYPES["types/index.ts<br/>(TypeScript Types)"]
END
ROOT --> APP
APP --> CANVAS
CANVAS --> RENDERER
RENDERER --> ENGINE
ENGINE --> STORE
STORE --> TYPES
```

**Diagram sources**
- [main.tsx:1-10](file://src/main.tsx#L1-L10)
- [App.tsx:1-318](file://src/App.tsx#L1-L318)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-2](file://src/store/index.ts#L1-L2)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)

**Section sources**
- [main.tsx:1-10](file://src/main.tsx#L1-L10)
- [App.tsx:1-318](file://src/App.tsx#L1-L318)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-2](file://src/store/index.ts#L1-L2)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)

## Core Components
- **Renderer layer**: Pure data-to-UI transformation utilities with comprehensive TypeScript interfaces, type safety, and enhanced error handling for image loading failures. See [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314).
- **Engine core**: Framework-agnostic state machine where all state changes must go through a command execution interface. See [index.ts:1-12](file://src/engine/index.ts#L1-L12).
- **Store**: Editor state separated from scene data. See [index.ts:1-2](file://src/store/index.ts#L1-L2).
- **Types**: Shared TypeScript types for the entire project with comprehensive type definitions. See [index.ts:1-159](file://src/types/index.ts#L1-L159).
- **UI shell**: Canvas component that hosts the rendered elements with TypeScript props. See [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191).

Key architectural principles:
- Renderers must be pure functions that accept scene data and produce React nodes without mutating state.
- Transform application includes translation (x, y), scaling, and rotation.
- Layer ordering equals rendering order, ensuring predictable z-index behavior.
- TypeScript provides compile-time type checking and enhanced developer experience.
- **Enhanced**: Image rendering includes robust error handling with automatic fallback to placeholder images.
- Future extension supports a canvas renderer for playback optimization while keeping the DOM renderer for editing.

**Section sources**
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.ts:1-2](file://src/store/index.ts#L1-L2)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)

## Architecture Overview
The rendering pipeline is:
- Engine produces scene graph updates via commands.
- Renderer consumes scene graph elements and applies transforms to compute DOM styles.
- React renders the computed styles into the Canvas component.
- Store holds editor state separate from scene data.
- **Enhanced**: Image rendering includes automatic error handling and fallback mechanisms.

```mermaid
sequenceDiagram
participant User as "User"
participant Engine as "Engine"
participant Renderer as "Renderer"
participant React as "React DOM"
participant Canvas as "Canvas Component"
User->>Engine : "execute(command)"
Engine->>Engine : "update scene graph"
Engine->>Renderer : "provide element(s)"
Renderer->>Renderer : "apply transforms (x,y,scale,rotate)<br/>(TypeScript type safety)"
Renderer->>React : "return ReactNode with computed styles"
React->>Canvas : "render element"
Canvas-->>User : "visual UI"
Note over Renderer : "Image error handling<br/>automatic fallback to placeholder"
```

**Diagram sources**
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)

## Detailed Component Analysis

### Renderer Layer
The renderer layer is a pure TypeScript function that converts scene graph elements into React nodes with computed styles. It provides comprehensive type safety and must:
- Accept an element and engine reference with proper TypeScript interfaces
- Support rendering shapes, images, and text with type-safe props
- Apply transforms: translation, scaling, and rotation
- Produce no side effects and avoid state mutation
- Utilize TypeScript interfaces for props and element types
- **Enhanced**: Implement robust error handling for image loading failures

```mermaid
flowchart TD
Start(["Render Entry<br/>(TypeScript)"]) --> GetElement["Get element from scene graph<br/>(Type-Safe)"]
GetElement --> ComputeTransforms["Compute transforms:<br/>x, y, width, height, rotation<br/>(TypeScript validation)"]
ComputeTransforms --> ApplyStyles["Apply styles to element:<br/>position, sizing, transform<br/>(CSSProperties type)"]
ApplyStyles --> RenderNode["Produce ReactNode<br/>(Type-Safe)"]
RenderNode --> End(["Render Exit"])
```

**Diagram sources**
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)

**Section sources**
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)

### Engine Core
The engine is the single source of truth for state changes. All modifications must go through engine.execute(command). It coordinates:
- Scene graph mutations
- History stack for undo/redo
- Timeline-driven animations

```mermaid
classDiagram
class Engine {
+execute(command)
+undo()
+redo()
}
class Command {
+execute()
+undo()
}
Engine --> Command : "executes"
```

**Diagram sources**
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)

**Section sources**
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)

### Canvas Component
The Canvas component serves as the container for rendered elements. It defines the viewport and centers the content. The renderer produces styled elements that are placed inside this container with TypeScript props.

```mermaid
graph TB
CONTAINER["Canvas Container<br/>width/height, centering<br/>(TypeScript Props)"]
RENDERER["Renderer Output<br/>styled elements<br/>(Type-Safe)"]
CONTAINER --> RENDERER
```

**Diagram sources**
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)

**Section sources**
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)

### Coordinate System and Layer Ordering
- Layer ordering equals rendering order, ensuring predictable z-index behavior.
- Transforms are applied in the order of translation, scaling, and rotation.
- The coordinate system is aligned with the browser's layout model (CSS transforms).
- TypeScript provides compile-time validation of coordinate types and units.

```mermaid
flowchart TD
A["Element in scene graph<br/>(Type-Safe)"] --> B["Translate (x, y)<br/>(Number types)"]
B --> C["Scale (sx, sy)<br/>(Number types)"]
C --> D["Rotate (angle)<br/>(Number types)"]
D --> E["Apply to DOM styles<br/>(CSSProperties)"]
```

**Diagram sources**
- [spec.md:184-187](file://spec.md#L184-L187)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)

**Section sources**
- [spec.md:184-187](file://spec.md#L184-L187)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)

### Rendering Different Element Types
- **Shapes**: Render rectangles, circles, or triangles with appropriate fill/stroke and transforms using TypeScript interfaces.
- **Images**: Render images with aspect ratio preservation and transforms with type-safe props and robust error handling.
- **Text**: Render text with font metrics and transforms using proper TypeScript typing.

Renderer responsibilities:
- Compute bounding boxes and transforms per element type with type safety
- Map transforms to CSS properties (e.g., translate, scale, rotate)
- Respect layer ordering for stacking
- Provide TypeScript interfaces for all rendering props and element types
- **Enhanced**: Handle image loading failures gracefully with automatic fallback to placeholder images

**Section sources**
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)

### Handling Layer Ordering and Visual Feedback
- Layer ordering equals rendering order, so elements are rendered in the intended z-index sequence.
- Visual feedback during interactions (e.g., selection, hover) is achieved by updating element properties in the scene graph and re-rendering.
- TypeScript ensures type safety for selection states and visual feedback props.

**Section sources**
- [spec.md:184-187](file://spec.md#L184-L187)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)

### Future Plans: Canvas Renderer Integration
- Current renderer: DOM-based (React) for editing scenarios with TypeScript type safety.
- Future renderer: Canvas-based for playback optimization.
- Extension strategy: Define a renderer interface; implement DOM and Canvas backends; switch backend based on mode (edit/playback).

```mermaid
graph TB
IFACE["Renderer Interface<br/>(TypeScript)"]
DOM["DOM Renderer<br/>(TypeScript)"]
CAN["Canvas Renderer"]
IFACE --> DOM
IFACE --> CAN
```

**Diagram sources**
- [spec.md:327-332](file://spec.md#L327-L332)

**Section sources**
- [spec.md:327-332](file://spec.md#L327-L332)

## Enhanced Image Error Handling

**Updated** The renderer now includes robust error handling for image loading failures with automatic fallback mechanisms.

### Automatic Fallback to Placeholder Images
The image rendering function implements comprehensive error handling to ensure graceful degradation when images fail to load:

- **Error Detection**: Uses React's `onError` event handler to detect image loading failures
- **Fallback Mechanism**: Automatically replaces failed image sources with custom SVG-based placeholder images
- **Prevention of Infinite Loops**: Ensures the placeholder image itself doesn't trigger additional fallback attempts
- **Visual Consistency**: Provides meaningful placeholders with descriptive text and styling

### Custom SVG-Based Placeholder Service
The renderer includes a dedicated placeholder service that generates SVG-based fallback images:

- **Self-Contained**: Uses data URI format to embed SVG directly in the HTML
- **Responsive Design**: Creates placeholders sized appropriately for common image dimensions
- **Descriptive Elements**: Includes visual indicators and text to communicate that the image is a placeholder
- **Consistent Styling**: Maintains visual consistency with the application's design system

### Implementation Details
The error handling mechanism operates at the image element level:

1. **Initial Load Attempt**: Attempts to load the specified image source
2. **Error Detection**: Listens for loading failures via React's `onError` event
3. **Fallback Execution**: Replaces the failed source with the generated placeholder SVG
4. **State Management**: Prevents subsequent fallback attempts to avoid infinite loops

```mermaid
flowchart TD
A["Image Element Rendered"] --> B["Attempt to Load Image"]
B --> C{"Load Success?"}
C --> |Yes| D["Display Original Image"]
C --> |No| E["Trigger onError Handler"]
E --> F["Check if Current Source is Placeholder"]
F --> |No| G["Set Source to Placeholder SVG"]
G --> H["Display Fallback Image"]
F --> |Yes| I["Ignore Error (Already Placeholder)"]
```

**Diagram sources**
- [index.tsx:127-171](file://src/renderer/index.tsx#L127-L171)

**Section sources**
- [index.tsx:127-171](file://src/renderer/index.tsx#L127-L171)

## Dependency Analysis
High-level dependencies:
- main.tsx bootstraps the app and mounts App.
- App renders Canvas with TypeScript props.
- Canvas is the host for renderer output with type-safe integration.
- Renderer depends on engine-provided scene data with TypeScript interfaces.
- Engine coordinates with store and types with comprehensive type definitions.
- **Enhanced**: Renderer includes internal dependency on placeholder image generation service.

```mermaid
graph LR
MAIN["main.tsx"] --> APP["App.tsx"]
APP --> CANVAS["Canvas.tsx<br/>(TypeScript)"]
CANVAS --> RENDERER["renderer/index.tsx<br/>(TypeScript with Error Handling)"]
RENDERER --> ENGINE["engine/index.ts<br/>(TypeScript)"]
ENGINE --> STORE["store/index.ts"]
STORE --> TYPES["types/index.ts<br/>(TypeScript Types)"]
RENDERER -.-> PLACEHOLDER["Placeholder Service<br/>(SVG Generation)"]
```

**Diagram sources**
- [main.tsx:1-10](file://src/main.tsx#L1-L10)
- [App.tsx:1-318](file://src/App.tsx#L1-L318)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.ts:1-2](file://src/store/index.ts#L1-L2)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)

**Section sources**
- [main.tsx:1-10](file://src/main.tsx#L1-L10)
- [App.tsx:1-318](file://src/App.tsx#L1-L318)
- [Canvas.tsx:1-191](file://src/components/Canvas.tsx#L1-L191)
- [index.tsx:1-314](file://src/renderer/index.tsx#L1-L314)
- [index.ts:1-12](file://src/engine/index.ts#L1-L12)
- [index.ts:1-2](file://src/store/index.ts#L1-L2)
- [index.ts:1-159](file://src/types/index.ts#L1-L159)

## Performance Considerations
- Keep renderer pure: No side effects, deterministic output from inputs with TypeScript guarantees.
- Minimize re-renders: Use stable keys and avoid unnecessary prop churn with type-safe props.
- Prefer CSS transforms for animations: They are GPU-accelerated and efficient.
- Batch updates: Group multiple element updates into a single render pass when possible.
- Virtualization: For large scenes, consider virtualizing visible elements.
- Canvas renderer: Offload heavy rendering to canvas for playback scenarios to reduce DOM overhead.
- TypeScript benefits: Compile-time optimizations and better tree-shaking for production builds.
- **Enhanced**: Image error handling is optimized to minimize performance impact during fallback operations.

## Troubleshooting Guide
Common issues and remedies:
- Incorrect transforms: Verify transform order (translate, scale, rotate) and ensure units are consistent with TypeScript type validation.
- Layering anomalies: Confirm layer ordering equals rendering order and that z-index is derived from order.
- Interaction feedback not appearing: Ensure engine.execute(command) is called and the scene graph is updated; re-render occurs automatically.
- Canvas vs DOM mismatch: Validate that the renderer produces equivalent styles for both backends.
- TypeScript compilation errors: Check interface implementations and type definitions for proper TypeScript integration.
- **Enhanced**: Image loading failures: Verify that the onError handler is functioning and the placeholder service is accessible; check network connectivity and image URLs.

**Section sources**
- [spec.md:309-332](file://spec.md#L309-L332)
- [index.tsx:127-171](file://src/renderer/index.tsx#L127-L171)

## Conclusion
The Rendering System is built around a pure renderer layer that transforms scene graph data into React nodes, decoupled from React lifecycle and DOM specifics. The TypeScript implementation provides enhanced type safety, better developer experience, and improved maintainability while preserving all existing functionality. 

**Enhanced**: The system now includes robust error handling for image loading failures with automatic fallback to custom SVG-based placeholder images, ensuring graceful degradation and improved user experience. By applying transforms consistently and maintaining layer ordering, it enables robust editing and playback experiences. The architecture is prepared for a canvas renderer to optimize playback performance while preserving the DOM renderer for editing. Following the design principles ensures scalability, maintainability, and extensibility with modern TypeScript development practices.

## Appendices
- Dependencies: React and React DOM are used for the UI runtime. TypeScript provides comprehensive type safety across the entire codebase. See [package.json:12-15](file://package.json#L12-L15).

**Section sources**
- [package.json:12-15](file://package.json#L12-L15)