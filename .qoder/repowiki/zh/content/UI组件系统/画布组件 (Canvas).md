# 画布组件 (Canvas)

<cite>
**本文档引用的文件**
- [Canvas.tsx](file://src/components/Canvas.tsx)
- [engine.ts](file://src/engine/engine.ts)
- [scene.ts](file://src/engine/scene.ts)
- [commands.ts](file://src/engine/commands.ts)
- [index.tsx](file://src/renderer/index.tsx)
- [MoveableLayer.tsx](file://src/components/MoveableLayer.tsx)
- [snapEngine.ts](file://src/engine/snapEngine.ts)
- [GuidesLayer.tsx](file://src/components/GuidesLayer.tsx)
- [App.tsx](file://src/App.tsx)
- [index.ts](file://src/types/index.ts)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件为画布组件（Canvas）的详细技术文档，涵盖其核心功能、接口定义、坐标系统、元素渲染机制、事件处理流程以及拖拽交互的实现细节。重点说明从拖拽放置元素到命令执行的完整流程，并记录画布的样式配置与响应式设计策略。文档同时提供可直接定位到源码位置的路径引用，便于开发者快速查阅与验证。

## 项目结构
Canvas 组件位于组件层，负责承载页面元素的渲染与交互；其数据模型由引擎层的 Scene 管理，命令层通过命令对象实现撤销/重做；渲染层负责将元素以 React 节点形式输出；移动控制层（MoveableLayer）提供拖拽、旋转、缩放等编辑能力；吸附与引导线层（snapEngine 与 GuidesLayer）提供对齐与视觉反馈。

```mermaid
graph TB
subgraph "应用层"
APP["App.tsx"]
end
subgraph "组件层"
CANVAS["Canvas.tsx"]
MOVEABLE["MoveableLayer.tsx"]
GUIDES["GuidesLayer.tsx"]
end
subgraph "引擎层"
ENGINE["engine.ts"]
SCENE["scene.ts"]
COMMANDS["commands.ts"]
SNAP["snapEngine.ts"]
end
subgraph "渲染层"
RENDERER["renderer/index.tsx"]
end
APP --> CANVAS
CANVAS --> RENDERER
CANVAS --> MOVEABLE
MOVEABLE --> SNAP
MOVEABLE --> SCENE
CANVAS --> SCENE
ENGINE --> SCENE
ENGINE --> COMMANDS
```

图表来源
- [App.tsx:155-286](file://src/App.tsx#L155-L286)
- [Canvas.tsx:22-128](file://src/components/Canvas.tsx#L22-L128)
- [MoveableLayer.tsx:15-188](file://src/components/MoveableLayer.tsx#L15-L188)
- [engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [scene.ts:3-247](file://src/engine/scene.ts#L3-L247)
- [commands.ts:4-18](file://src/engine/commands.ts#L4-L18)
- [snapEngine.ts:242-258](file://src/engine/snapEngine.ts#L242-L258)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)

章节来源
- [App.tsx:155-286](file://src/App.tsx#L155-L286)
- [Canvas.tsx:22-128](file://src/components/Canvas.tsx#L22-L128)

## 核心组件
- Canvas：承载画布容器、处理拖拽放置、元素点击选择、背景色渲染与 Moveable 控制层挂载。
- MoveableLayer：基于 react-moveable 的可选中元素的拖拽、旋转、缩放控制，集成吸附与引导线。
- Renderer：根据元素类型渲染形状、文本、图片等节点，并支持选择框与占位图。
- Engine/Scene/Commands：管理文档、页面、元素与动画数据，提供命令模式的撤销/重做能力。
- snapEngine/GuidesLayer：提供吸附算法与视觉引导线展示。

章节来源
- [Canvas.tsx:15-128](file://src/components/Canvas.tsx#L15-L128)
- [MoveableLayer.tsx:8-188](file://src/components/MoveableLayer.tsx#L8-L188)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)
- [engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [scene.ts:3-247](file://src/engine/scene.ts#L3-L247)
- [commands.ts:4-18](file://src/engine/commands.ts#L4-L18)
- [snapEngine.ts:242-258](file://src/engine/snapEngine.ts#L242-L258)
- [GuidesLayer.tsx:19-65](file://src/components/GuidesLayer.tsx#L19-L65)

## 架构总览
Canvas 作为视图层组件，依赖引擎层的数据与命令，渲染层负责具体元素的可视化，移动控制层提供交互能力。版本号（version）用于触发重渲染与同步动画状态。

```mermaid
sequenceDiagram
participant User as "用户"
participant Canvas as "Canvas"
participant Renderer as "Renderer"
participant Engine as "Engine"
participant Scene as "Scene"
participant Moveable as "MoveableLayer"
participant Snap as "snapEngine"
participant Guides as "GuidesLayer"
User->>Canvas : 拖拽元素到画布
Canvas->>Canvas : 计算鼠标相对画布坐标
Canvas->>Canvas : 创建元素对象
Canvas->>Engine : 执行 AddElementCommand
Engine->>Scene : 添加元素
Engine-->>Canvas : 历史记录更新
Canvas->>Renderer : 渲染元素列表
User->>Canvas : 点击元素
Canvas->>Engine : 更新选中元素ID
Canvas->>Renderer : 重新渲染并高亮选中
User->>Moveable : 拖拽/旋转/缩放
Moveable->>Snap : 计算吸附偏移
Snap-->>Moveable : 返回偏移与引导线
Moveable->>Engine : 执行 MoveElementCommand
Engine->>Scene : 更新元素属性
Moveable->>Guides : 展示引导线
```

图表来源
- [Canvas.tsx:44-69](file://src/components/Canvas.tsx#L44-L69)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)
- [engine.ts:29-32](file://src/engine/engine.ts#L29-L32)
- [scene.ts:94-106](file://src/engine/scene.ts#L94-L106)
- [MoveableLayer.tsx:44-183](file://src/components/MoveableLayer.tsx#L44-L183)
- [snapEngine.ts:242-258](file://src/engine/snapEngine.ts#L242-L258)
- [GuidesLayer.tsx:19-65](file://src/components/GuidesLayer.tsx#L19-L65)

## 详细组件分析

### Canvas 组件接口与职责
- Props 接口
  - engine: 引擎实例，提供场景访问、命令执行与历史管理。
  - animationEngine: 动画引擎实例，用于在编辑态下限定动画作用域。
  - onRefresh: 刷新回调，用于触发版本号递增与重渲染。
  - version: 版本号，驱动 Moveable 同步与动画重载。
- 核心职责
  - 处理拖拽放置：计算坐标、创建元素、执行添加命令、更新选中状态。
  - 元素点击选择：更新编辑器状态中的选中元素ID。
  - 画布背景设置：读取当前页面背景色并渲染容器背景。
  - 渲染元素：遍历当前页面元素，调用渲染器输出节点。
  - 挂载移动控制层：提供拖拽、旋转、缩放与吸附能力。

章节来源
- [Canvas.tsx:15-20](file://src/components/Canvas.tsx#L15-L20)
- [Canvas.tsx:22-128](file://src/components/Canvas.tsx#L22-L128)

### 坐标系统与渲染机制
- 画布坐标系
  - 画布容器尺寸固定为 960x540，采用绝对定位布局。
  - 鼠标坐标通过 clientX/Y 减去容器边界矩形左上角偏移，得到元素放置的相对坐标。
- 元素渲染
  - 渲染器根据元素类型分别生成 SVG 形状、文本容器或图片节点。
  - 通过 CSS transform 实现旋转，通过绝对定位实现平移与尺寸控制。
  - 选中状态通过外层边框高亮显示。
- 事件处理
  - 元素节点绑定点击事件，阻止冒泡后调用 Canvas 的点击处理器。
  - 画布容器绑定指针按下事件，若点击空白区域则清空选中。

章节来源
- [Canvas.tsx:57-62](file://src/components/Canvas.tsx#L57-L62)
- [index.tsx:14-27](file://src/renderer/index.tsx#L14-L27)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)
- [Canvas.tsx:79-90](file://src/components/Canvas.tsx#L79-L90)

### 拖拽交互实现细节
- handleDragOver
  - 设置 dropEffect 为 copy，允许放置。
- handleDrop
  - 从拖拽数据中解析元素类型与形状类型。
  - 计算相对画布坐标，创建元素对象。
  - 执行添加命令，更新选中状态，并触发刷新。
- 元素创建流程
  - 根据类型分支创建不同元素对象，填充默认尺寸与样式。
  - 生成唯一 ID 并返回给命令执行器。

```mermaid
flowchart TD
Start(["开始拖拽"]) --> GetData["读取拖拽数据<br/>JSON 解析"]
GetData --> HasData{"存在数据？"}
HasData -- 否 --> End(["结束"])
HasData -- 是 --> GetRect["获取画布容器边界"]
GetRect --> RectOK{"有边界？"}
RectOK -- 否 --> End
RectOK -- 是 --> CalcXY["计算相对坐标 x,y"]
CalcXY --> CreateEl["创建元素对象"]
CreateEl --> ExecCmd["执行添加命令"]
ExecCmd --> SelectEl["设置选中元素"]
SelectEl --> Refresh["触发刷新"]
Refresh --> End
```

图表来源
- [Canvas.tsx:39-69](file://src/components/Canvas.tsx#L39-L69)
- [Canvas.tsx:130-190](file://src/components/Canvas.tsx#L130-L190)

章节来源
- [Canvas.tsx:39-69](file://src/components/Canvas.tsx#L39-L69)
- [Canvas.tsx:130-190](file://src/components/Canvas.tsx#L130-L190)

### 元素点击选择与画布空白处点击
- handleElementClick
  - 将选中元素ID写入编辑器状态，触发刷新。
- handleCanvasPointerDown
  - 若点击目标不在元素或控制框上，则清空选中集合，触发刷新。

章节来源
- [Canvas.tsx:71-90](file://src/components/Canvas.tsx#L71-L90)

### 移动控制层与吸附机制
- MoveableLayer
  - 监听选中元素变化，动态更新目标节点并同步边界。
  - 支持拖拽、旋转、缩放事件，结合 snapEngine 计算吸附偏移。
  - 在拖拽/旋转/缩放结束时，执行 MoveElementCommand 更新场景数据。
- snapEngine
  - 提供边缘对齐、中心对齐与等间距吸附三种优先级。
  - 返回吸附偏移与引导线信息，MoveableLayer 应用到 DOM 并展示 GuidesLayer。
- GuidesLayer
  - 根据引导线类型与种类绘制水平/垂直引导线，颜色区分对齐方式。

```mermaid
sequenceDiagram
participant User as "用户"
participant Moveable as "MoveableLayer"
participant Snap as "snapEngine"
participant Scene as "Scene"
participant Engine as "Engine"
participant Guides as "GuidesLayer"
User->>Moveable : 开始拖拽
Moveable->>Snap : 计算吸附偏移
Snap-->>Moveable : 返回偏移与引导线
Moveable->>Guides : 展示引导线
User->>Moveable : 结束拖拽
Moveable->>Engine : 执行 MoveElementCommand
Engine->>Scene : 更新元素属性
Moveable-->>User : 刷新界面
```

图表来源
- [MoveableLayer.tsx:44-183](file://src/components/MoveableLayer.tsx#L44-L183)
- [snapEngine.ts:242-258](file://src/engine/snapEngine.ts#L242-L258)
- [GuidesLayer.tsx:19-65](file://src/components/GuidesLayer.tsx#L19-L65)

章节来源
- [MoveableLayer.tsx:15-188](file://src/components/MoveableLayer.tsx#L15-L188)
- [snapEngine.ts:35-258](file://src/engine/snapEngine.ts#L35-L258)
- [GuidesLayer.tsx:19-65](file://src/components/GuidesLayer.tsx#L19-L65)

### 命令执行与撤销/重做
- AddElementCommand
  - 执行：向当前页面添加元素。
  - 撤销：删除该元素。
- MoveElementCommand
  - 执行：更新元素的 x/y/width/height/rotation 等属性。
  - 撤销：回滚到变更前的状态。
- Engine
  - 提供 execute、undo、redo、canUndo、canRedo 等方法，维护历史栈。

章节来源
- [commands.ts:4-18](file://src/engine/commands.ts#L4-L18)
- [commands.ts:20-44](file://src/engine/commands.ts#L20-L44)
- [engine.ts:29-48](file://src/engine/engine.ts#L29-L48)

### 类型与数据模型
- 元素类型
  - BaseElement：通用字段（位置、尺寸、旋转、透明度、可见性、父子关系）。
  - ShapeElement、TextElement、ImageElement、GroupElement：扩展字段与约束。
- 文档与页面
  - Document：包含页面集合、节点集合、结构项与当前页ID。
  - Page：包含背景色、元素映射、动画映射。
- 编辑器状态
  - EditorState：选中元素ID数组、视口、工具模式、悬停元素ID。

章节来源
- [index.ts:12-54](file://src/types/index.ts#L12-L54)
- [index.ts:69-84](file://src/types/index.ts#L69-L84)
- [index.ts:144-158](file://src/types/index.ts#L144-L158)

## 依赖关系分析

```mermaid
classDiagram
class Engine {
+scene : Scene
+history : History
+timeline : Timeline
+getEditorState()
+setEditorState()
+execute()
+undo()
+redo()
+canUndo()
+canRedo()
}
class Scene {
+getDocument()
+addPage()
+removePage()
+setCurrentPageId()
+addNode()
+removeNode()
+addNode()
+addElement()
+updateElement()
+deleteElement()
+getElement()
+getPageElements()
+addAnimation()
+removeAnimation()
+updateAnimation()
+getAnimation()
+getPageAnimations()
+reorderAnimations()
}
class Canvas {
+props.engine
+props.animationEngine
+props.onRefresh
+props.version
+handleDragOver()
+handleDrop()
+handleElementClick()
+handleCanvasPointerDown()
}
class MoveableLayer {
+props.engine
+props.onRefresh
+props.version
+props.containerRef
}
class Renderer {
+renderElement()
}
Engine --> Scene : "持有"
Canvas --> Engine : "使用"
Canvas --> Renderer : "渲染"
MoveableLayer --> Scene : "查询元素"
MoveableLayer --> Engine : "执行命令"
```

图表来源
- [engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [scene.ts:3-247](file://src/engine/scene.ts#L3-L247)
- [Canvas.tsx:22-128](file://src/components/Canvas.tsx#L22-L128)
- [MoveableLayer.tsx:15-188](file://src/components/MoveableLayer.tsx#L15-L188)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)

章节来源
- [engine.ts:7-49](file://src/engine/engine.ts#L7-L49)
- [scene.ts:3-247](file://src/engine/scene.ts#L3-L247)
- [Canvas.tsx:22-128](file://src/components/Canvas.tsx#L22-L128)
- [MoveableLayer.tsx:15-188](file://src/components/MoveableLayer.tsx#L15-L188)
- [index.tsx:189-202](file://src/renderer/index.tsx#L189-L202)

## 性能考虑
- 渲染优化
  - 使用版本号（version）驱动重渲染，避免不必要的全量更新。
  - Moveable 同步通过 useEffect 监听 version，减少手动 updateRect 的开销。
- 事件处理
  - 事件回调使用 useCallback 缓存，降低子组件重渲染频率。
- DOM 查询
  - MoveableLayer 仅查询选中元素对应的 DOM 节点，避免全局扫描。
- 动画作用域
  - 在编辑态限定动画作用域，避免影响非目标元素。

[本节为通用性能建议，不直接分析具体文件，故无章节来源]

## 故障排除指南
- 拖拽放置无效
  - 检查拖拽数据是否为合法 JSON，且包含类型与形状类型。
  - 确认画布容器存在边界矩形，否则无法计算相对坐标。
- 选中状态异常
  - 确保元素节点包含 data-element-id 属性，点击事件需阻止冒泡。
  - 画布空白处点击应清空选中集合。
- 移动控制不可用
  - 确认选中元素已正确映射到 Moveable 的 target。
  - 检查 snapEngine 是否返回有效偏移，引导线是否正确渲染。
- 动画播放异常
  - 确认 animationEngine 的作用域根节点已设置到画布容器。
  - 版本号变化后是否重新同步动画配置。

章节来源
- [Canvas.tsx:39-69](file://src/components/Canvas.tsx#L39-L69)
- [Canvas.tsx:71-90](file://src/components/Canvas.tsx#L71-L90)
- [MoveableLayer.tsx:24-35](file://src/components/MoveableLayer.tsx#L24-L35)
- [snapEngine.ts:242-258](file://src/engine/snapEngine.ts#L242-L258)
- [GuidesLayer.tsx:19-65](file://src/components/GuidesLayer.tsx#L19-L65)
- [Canvas.tsx:27-32](file://src/components/Canvas.tsx#L27-L32)

## 结论
Canvas 组件通过清晰的分层架构实现了拖拽放置、元素选择、渲染与交互控制。借助命令模式与历史管理，系统具备良好的可撤销/重做能力；通过吸附与引导线提升了编辑体验。整体设计遵循关注点分离原则，便于扩展与维护。

[本节为总结性内容，不直接分析具体文件，故无章节来源]

## 附录

### 使用场景与最佳实践
- 拖拽放置元素
  - 从组件面板拖拽到画布，自动创建元素并选中。
  - 可在放置后立即进行移动、旋转或缩放操作。
- 画布背景设置
  - 页面背景色来自文档数据，Canvas 渲染容器背景色。
- 响应式设计
  - 画布容器固定尺寸，外部容器通过 Flex 布局自适应窗口。
  - 动画作用域限定在画布容器内，确保编辑态下的动画行为一致。

章节来源
- [Canvas.tsx:106-127](file://src/components/Canvas.tsx#L106-L127)
- [App.tsx:28-36](file://src/App.tsx#L28-L36)