# Command Pattern System

<cite>
**Referenced Files in This Document**
- [engine/index.ts](file://src/engine/index.ts)
- [engine/engine.ts](file://src/engine/engine.ts)
- [engine/commands.ts](file://src/engine/commands.ts)
- [engine/history.ts](file://src/engine/history.ts)
- [engine/scene.ts](file://src/engine/scene.ts)
- [engine/timeline.ts](file://src/engine/timeline.ts)
- [engine/animationCommands.ts](file://src/engine/animationCommands.ts)
- [types/index.ts](file://src/types/index.ts)
- [App.tsx](file://src/App.tsx)
- [StructurePanel.tsx](file://src/components/StructurePanel.tsx)
</cite>

## Update Summary
**Changes Made**
- Complete implementation of command pattern with concrete command classes
- Added comprehensive multi-page management commands (AddPageCommand, RemovePageCommand, AddNodeCommand, RemoveNodeCommand, ReorderStructureItemsCommand)
- Enhanced state management with full redo functionality for page and node operations
- Implemented Scene graph mutation methods for page and node operations
- Added Timeline system for animation playback
- Added comprehensive type definitions for commands, animations, pages, and nodes
- Integrated Engine as central coordinator for all operations

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Command Implementation Details](#command-implementation-details)
7. [Multi-Page Management Commands](#multi-page-management-commands)
8. [History Management System](#history-management-system)
9. [Scene Graph Operations](#scene-graph-operations)
10. [Timeline Integration](#timeline-integration)
11. [Type System and Interfaces](#type-system-and-interfaces)
12. [Performance Considerations](#performance-considerations)
13. [Integration Examples](#integration-examples)
14. [Conclusion](#conclusion)

## Introduction
This document describes the fully implemented command pattern system that enables undo/redo functionality and centralized state management for a presentation editor. The system provides a robust framework where all state changes flow through a central engine, ensuring consistency across the scene graph and enabling comprehensive history management. The implementation includes concrete command classes, a sophisticated history management system, and seamless integration with the timeline for animation playback. Recent enhancements include comprehensive multi-page management commands with full redo functionality and enhanced state management capabilities.

## Project Structure
The repository follows a clean layered architecture with the engine module serving as the central coordination point:

```mermaid
graph TB
subgraph "Application Layer"
App["App.tsx<br/>React Application"]
Canvas["Canvas Component"]
Palette["Component Palette"]
StructurePanel["Structure Panel<br/>Page/Node Management"]
end
subgraph "Engine Layer"
Engine["Engine<br/>Central Coordinator"]
History["History<br/>Undo/Redo Stack"]
Timeline["Timeline<br/>Animation Playback"]
Scene["Scene<br/>Document Operations"]
Commands["Commands<br/>Concrete Implementations"]
end
subgraph "Types Layer"
Types["Types<br/>Shared Interfaces"]
end
App --> Engine
Canvas --> Engine
Palette --> Engine
StructurePanel --> Engine
Engine --> History
Engine --> Timeline
Engine --> Scene
Engine --> Commands
Commands --> Scene
Scene --> Types
History --> Types
Timeline --> Types
StructurePanel --> Commands
```

**Diagram sources**
- [engine/index.ts:1-9](file://src/engine/index.ts#L1-L9)
- [App.tsx:1-41](file://src/App.tsx#L1-L41)
- [StructurePanel.tsx:1-400](file://src/components/StructurePanel.tsx#L1-L400)

## Core Components

### Command Interface
The command pattern is implemented through a well-defined interface that ensures all operations are reversible:

- **Command Interface**: Defines the contract with `execute()` and `undo()` methods
- **Reversible Operations**: Each command captures state before and after execution
- **Atomic Operations**: Commands encapsulate complete state changes

### Engine
The Engine serves as the central coordinator managing all state changes:

- **Single Source of Truth**: All mutations must pass through `engine.execute(command)`
- **History Coordination**: Manages command execution and history stack operations
- **State Management**: Coordinates between scene, history, timeline, and editor state

### History System
A sophisticated stack-based system for managing command execution history:

- **Undo Stack**: Stores executed commands for potential reversal
- **Redo Stack**: Maintains undone commands for potential re-execution
- **State Tracking**: Provides `canUndo()` and `canRedo()` status checks

### Scene Graph
Persistent document representation with comprehensive element management:

- **Element Operations**: Add, update, delete elements with parent-child relationships
- **Group Hierarchy**: Maintains consistent group and parent-child relationships
- **Slide Management**: Handles element membership within slides
- **Page Management**: Comprehensive page CRUD operations with structure tracking
- **Node Management**: Hierarchical node organization with page association

### Timeline System
Animation playback and keyframe management:

- **Playback Control**: Play, pause, seek functionality
- **Animation Management**: Stores and manages animation definitions
- **Real-time Updates**: Uses requestAnimationFrame for smooth playback

**Section sources**
- [engine/engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [engine/history.ts:3-44](file://src/engine/history.ts#L3-L44)
- [engine/scene.ts:3-121](file://src/engine/scene.ts#L3-L121)
- [engine/timeline.ts:3-67](file://src/engine/timeline.ts#L3-L67)

## Architecture Overview
The command pattern system creates a clear separation of concerns with the Engine as the central orchestrator:

```mermaid
classDiagram
class Engine {
+scene : Scene
+history : History
+timeline : Timeline
+editorState : EditorState
+execute(command : Command)
+undo()
+redo()
+canUndo() : boolean
+canRedo() : boolean
}
class Command {
<<interface>>
+execute() : void
+undo() : void
}
class AddElementCommand {
+execute() : void
+undo() : void
}
class MoveElementCommand {
+execute() : void
+undo() : void
}
class DeleteElementCommand {
+execute() : void
+undo() : void
}
class AddPageCommand {
+execute() : void
+undo() : void
}
class RemovePageCommand {
+execute() : void
+undo() : void
}
class AddNodeCommand {
+execute() : void
+undo() : void
}
class RemoveNodeCommand {
+execute() : void
+undo() : void
}
class ReorderStructureItemsCommand {
+execute() : void
+undo() : void
}
class History {
+undoStack : Command[]
+redoStack : Command[]
+push(command : Command)
+undo() : void
+redo() : void
+canUndo() : boolean
+canRedo() : boolean
}
class Scene {
+addDocument(document : Document)
+addElement(slideId : string, element : Element)
+updateElement(elementId : string, updates : Partial)
+deleteElement(elementId : string)
+getElement(elementId : string) : Element
+getSlideElements(slideId : string) : Element[]
+addPage(page : Page, insertIndex? : number)
+removePage(pageId : string)
+addNode(node : Node, targetPageId? : string)
+removeNode(nodeId : string)
+reorderStructureItems(newOrder : StructureItem[])
}
Engine --> Command : "executes"
Engine --> History : "manages"
Engine --> Scene : "mutates"
AddElementCommand --|> Command
MoveElementCommand --|> Command
DeleteElementCommand --|> Command
AddPageCommand --|> Command
RemovePageCommand --|> Command
AddNodeCommand --|> Command
RemoveNodeCommand --|> Command
ReorderStructureItemsCommand --|> Command
History --> Command : "stores"
```

**Diagram sources**
- [engine/engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [engine/commands.ts:4-279](file://src/engine/commands.ts#L4-L279)
- [engine/history.ts:3-44](file://src/engine/history.ts#L3-L44)
- [engine/scene.ts:3-247](file://src/engine/scene.ts#L3-L247)

## Detailed Component Analysis

### Engine Implementation
The Engine class serves as the central coordinator for all operations:

- **Constructor**: Initializes Scene, History, Timeline, and EditorState
- **Command Execution**: Executes commands and automatically pushes them to history
- **State Management**: Provides getters and setters for editor state
- **History Integration**: Delegates undo/redo operations to the History instance

**Section sources**
- [engine/engine.ts:14-49](file://src/engine/engine.ts#L14-L49)

### Command Interface Design
The Command interface defines the contract for all reversible operations:

- **execute()**: Applies the state change to the scene graph
- **undo()**: Reverses the effect of execute() using captured state
- **Type Safety**: Strongly typed with TypeScript interfaces

**Section sources**
- [types/index.ts:107-110](file://src/types/index.ts#L107-L110)

## Command Implementation Details

### AddElementCommand
Adds new elements to the scene graph:

- **Construction**: Captures scene reference, slideId, and element data
- **Execute**: Calls `scene.addElement()` to create the element
- **Undo**: Removes the element using `scene.deleteElement()`
- **State Management**: Automatically handles parent-child relationships

**Section sources**
- [engine/commands.ts:4-18](file://src/engine/commands.ts#L4-L18)

### MoveElementCommand
Moves elements by updating their properties:

- **State Capture**: Captures current element state before updates
- **Partial Updates**: Supports updating only specified properties
- **Undo Restoration**: Restores captured state during undo operations
- **Property Validation**: Only allows non-id, non-type properties

**Section sources**
- [engine/commands.ts:20-44](file://src/engine/commands.ts#L20-L44)

### DeleteElementCommand
Removes elements from the scene graph:

- **Deletion Tracking**: Captures deleted element for potential restoration
- **Cascade Removal**: Handles parent-child relationship cleanup
- **Slide Cleanup**: Removes element from all slide memberships
- **Child Detachment**: Ensures child elements are properly detached

**Section sources**
- [engine/commands.ts:46-66](file://src/engine/commands.ts#L46-L66)

## Multi-Page Management Commands

### AddPageCommand
Creates new pages with comprehensive state management:

- **Construction**: Captures scene reference, page data, and setCurrent flag
- **Execute**: Adds page to document and optionally sets as current page
- **Undo**: Removes page and restores previous current page state
- **State Preservation**: Maintains document structure and current page tracking

### RemovePageCommand
Deletes pages with full state restoration:

- **State Capture**: Captures removed page data and structure index
- **Current Page Handling**: Preserves current page state during deletion
- **Structure Restoration**: Restores page to original position during undo
- **Cleanup**: Removes page from document structure items

### AddNodeCommand
Manages hierarchical node organization:

- **Construction**: Captures scene reference, node data, and optional target page
- **Target Page Association**: Associates node with specific page when provided
- **Structure Integration**: Adds node to document structure items
- **Undo Support**: Removes node and associated structure items

### RemoveNodeCommand
Handles node deletion with intelligent page association:

- **State Capture**: Captures removed node and determines target page
- **Page Detection**: Automatically finds target page for node restoration
- **Structure Cleanup**: Removes node from document structure items
- **Undo Restoration**: Re-adds node with proper page association

### ReorderStructureItemsCommand
Manages document structure ordering:

- **State Capture**: Captures current structure order before reordering
- **Flexible Ordering**: Supports arbitrary reordering of pages and nodes
- **Undo Restoration**: Restores original structure order during undo
- **Consistency**: Maintains document structure integrity

**Section sources**
- [engine/commands.ts:166-279](file://src/engine/commands.ts#L166-L279)

## History Management System

### Stack Architecture
The History class implements a sophisticated stack-based system:

- **Undo Stack**: Commands executed in chronological order
- **Redo Stack**: Commands that can be re-executed
- **Clear Operations**: Maintains stack integrity during operations

### Operation Flow
- **Push**: Adds executed commands to undo stack, clears redo stack
- **Undo**: Pops from undo stack, executes undo(), pushes to redo stack
- **Redo**: Pops from redo stack, executes execute(), pushes to undo stack

```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Engine as "Engine"
participant History as "History"
participant Command as "Command"
UI->>Engine : "execute(command)"
Engine->>Command : "execute()"
Command-->>Engine : "state changed"
Engine->>History : "push(command)"
History-->>Engine : "acknowledged"
UI->>Engine : "undo()"
Engine->>History : "undo()"
History->>Command : "undo()"
Command-->>Engine : "state reverted"
```

**Diagram sources**
- [engine/engine.ts:29-32](file://src/engine/engine.ts#L29-L32)
- [engine/history.ts:12-30](file://src/engine/history.ts#L12-L30)

**Section sources**
- [engine/history.ts:3-44](file://src/engine/history.ts#L3-L44)

## Scene Graph Operations

### Element Management
The Scene class provides comprehensive element manipulation:

- **Add Element**: Creates new elements and maintains slide membership
- **Update Element**: Applies property changes with automatic validation
- **Delete Element**: Removes elements with cascade cleanup
- **Query Operations**: Retrieves elements and slide contents

### Page Management
Enhanced page operations with structure tracking:

- **Add Page**: Creates new pages with optional insertion index
- **Remove Page**: Deletes pages with current page state preservation
- **Page Query**: Retrieves pages by ID with structure validation
- **Current Page Tracking**: Maintains active page state

### Node Management
Hierarchical node organization:

- **Add Node**: Creates nodes with optional target page association
- **Remove Node**: Deletes nodes with structure item cleanup
- **Node Query**: Retrieves nodes by ID with structure validation
- **Structure Integration**: Automatically adds nodes to document structure

### Structure Ordering
Document structure management:

- **Reorder Items**: Supports arbitrary reordering of pages and nodes
- **Structure Validation**: Maintains document structure integrity
- **State Preservation**: Captures and restores structure order

### Parent-Child Relationships
Maintains consistency in hierarchical structures:

- **Group Hierarchy**: Ensures group elements properly track children
- **Parent Tracking**: Maintains parentId references for all elements
- **Relationship Cleanup**: Automatic cleanup when parents or children change

**Section sources**
- [engine/scene.ts:18-88](file://src/engine/scene.ts#L18-L88)
- [engine/scene.ts:94-167](file://src/engine/scene.ts#L94-L167)
- [engine/scene.ts:179-233](file://src/engine/scene.ts#L179-L233)

## Timeline Integration

### Animation Playback
The Timeline system provides real-time animation control:

- **Playback Control**: Start, pause, and seek functionality
- **Animation Storage**: Manages animation definitions with keyframes
- **Timing System**: Uses requestAnimationFrame for smooth updates
- **State Synchronization**: Integrates with scene graph for property updates

### Keyframe Management
Supports complex animation sequences:

- **Keyframe Definitions**: Time-based property values with easing
- **Animation Properties**: Supports various element properties
- **Easing Functions**: Built-in timing functions for smooth motion

### Animation Commands
Batch animation operations for performance:

- **BatchAnimationCommand**: Groups multiple animation changes into single commands
- **Snapshot Management**: Captures before/after states for undo/redo
- **Efficient Updates**: Minimizes animation engine registration/unregistration calls

**Section sources**
- [engine/timeline.ts:25-66](file://src/engine/timeline.ts#L25-L66)
- [engine/animationCommands.ts:9-44](file://src/engine/animationCommands.ts#L9-L44)
- [types/index.ts:118-130](file://src/types/index.ts#L118-L130)

## Type System and Interfaces

### Element Types
Comprehensive type definitions for different element types:

- **BaseElement**: Common properties for all elements
- **ShapeElement**: Geometric shapes with fill and stroke
- **TextElement**: Text content with styling properties
- **ImageElement**: Image assets with positioning
- **GroupElement**: Container elements for grouping

### Document Structure Types
Enhanced document structure with pages and nodes:

- **StructureItem**: Union type for page and node references
- **Node**: Hierarchical organizational units
- **Page**: Individual presentation slides with elements and animations
- **Document**: Complete presentation with pages, nodes, and structure

### Command Types
Strongly typed command implementations:

- **Command Interface**: Defines execute/undo contracts
- **Generic Commands**: Support partial property updates
- **Multi-Page Commands**: Handle page and node operations
- **Type Safety**: Compile-time validation of operations

**Section sources**
- [types/index.ts:7-55](file://src/types/index.ts#L7-L55)
- [types/index.ts:60-84](file://src/types/index.ts#L60-L84)
- [types/index.ts:107-110](file://src/types/index.ts#L107-L110)

## Performance Considerations

### Memory Management
- **Command Lifecycle**: Commands are garbage collected after undo/redo operations
- **History Limits**: Consider implementing history depth limits for large documents
- **Scene Optimization**: Efficient element lookup using id-based indexing
- **Structure Tracking**: Optimized structure item management for large documents

### Execution Efficiency
- **Batch Operations**: Consider batching multiple commands for better performance
- **Delta Updates**: Only store necessary state changes in commands
- **Lazy Evaluation**: Defer expensive operations until needed
- **Animation Batching**: Use BatchAnimationCommand to minimize animation engine calls

### Timeline Performance
- **Request Animation Frame**: Uses browser optimization for smooth playback
- **Animation Caching**: Potential for caching computed animation values
- **Frame Rate Control**: Adjustable timing for different performance requirements

## Integration Examples

### Basic Command Usage
```typescript
// Create and execute commands
const addCommand = new AddElementCommand(scene, slideId, element);
engine.execute(addCommand);

// Undo the last operation
engine.undo();

// Redo the undone operation
engine.redo();
```

### Multi-Page Management
```typescript
// Add a new page
const addPageCommand = new AddPageCommand(engine.scene, {
  id: 'page-new',
  name: 'New Page',
  background: '#ffffff',
  elements: {},
  animations: {}
});
engine.execute(addPageCommand);

// Add a node under a specific page
const addNodeCommand = new AddNodeCommand(
  engine.scene,
  { id: 'node-new', name: 'New Section' },
  'page-existing'
);
engine.execute(addNodeCommand);

// Reorder structure items
const reorderCommand = new ReorderStructureItemsCommand(engine.scene, [
  { type: 'node', id: 'node-new' },
  { type: 'page', id: 'page-new' },
  { type: 'page', id: 'page-existing' }
]);
engine.execute(reorderCommand);
```

### Complex Operations
```typescript
// Chain multiple operations
const moveCommand = new MoveElementCommand(scene, elementId, { x: 100, y: 100 });
const scaleCommand = new MoveElementCommand(scene, elementId, { width: 200, height: 150 });

engine.execute(moveCommand);
engine.execute(scaleCommand);

// Both operations can be undone independently
engine.undo(); // Undoes scaling
engine.undo(); // Undoes moving
```

### Timeline Integration
```typescript
// Set up animations
const animations = createMockAnimations();
engine.timeline.setAnimations(animations);

// Start playback
engine.timeline.play();

// Seek to specific time
engine.timeline.seek(1000); // 1 second
```

**Section sources**
- [App.tsx:8-34](file://src/App.tsx#L8-L34)
- [StructurePanel.tsx:48-91](file://src/components/StructurePanel.tsx#L48-L91)
- [types/index.ts:207-228](file://src/types/index.ts#L207-L228)

## Conclusion
The implemented command pattern system provides a robust foundation for state management, undo/redo functionality, and timeline-driven animation in the presentation editor. The system's architecture ensures consistency through centralized command execution, maintains precise history stacks for reliable operations, and integrates seamlessly with the timeline for complex animation scenarios. Recent enhancements include comprehensive multi-page management commands with full redo functionality, enabling sophisticated document structure operations while maintaining type safety and performance considerations. The concrete implementations demonstrate practical applications of the pattern while preserving the system's reliability and user experience. This foundation enables extensible development of additional commands and advanced features while preserving the system's scalability and maintainability.