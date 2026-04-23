好，这一步我直接给你一套 **“Qoder 专用：12 步完整生成脚本”**。
每一步都带**架构约束（不会跑偏）+ 可直接复制的 Prompt**。你按顺序喂给 Qoder，就能从 0 → MVP 编辑器（含 Command / Timeline / Snap / Plugin / 协同）。

---

# 🚀 使用方式（先看这个）

* 每一步都**完整复制 Prompt**给 Qoder
* 生成后：运行、简单验证，再进入下一步
* 若有偏差：用我给的“纠偏句式”让它重写

**通用纠偏句式：**

```text
你违反了架构规则：
- 不允许在 React 组件里直接修改数据
- 必须通过 engine.execute(command)
请按规则重写
```

---

# 🧱 全局架构约束（每一步都要带上）

（你可以存在剪贴板，所有 Prompt 前面都加上）

```text
Context:
We are building a Slides Editor (design tool engine).

Architecture Rules:
1. All state changes MUST go through engine.execute(command)
2. Scene Graph is the single source of truth
3. Editor state must be separated from scene data
4. Engine must be framework-agnostic (no React inside engine)
5. Rendering must be pure (data → UI)
6. Animations must be driven by Timeline (not useEffect)
7. All operations must support undo/redo via Command pattern
8. Do not introduce unnecessary libraries
9. Code must be modular and extensible
```

---

# 🟢 Step 1：初始化项目

```text
[带上全局架构约束]

Task:
Initialize a React + TypeScript (Vite) project.

Requirements:
- Use React 18
- TypeScript strict mode
- Create folders:
  src/engine, src/renderer, src/components, src/store, src/types
- Provide basic App.tsx and Canvas component
- No extra libraries
```

---

# 🟢 Step 2：Scene Graph（核心数据）

```text
[带上全局架构约束]

Task:
Define Scene Graph types.

Requirements:
- Document, Slide, Element, Animation, Keyframe
- elements stored as Record<string, Element>
- children use id references (no nested objects)
- Provide mock data
```

---

# 🟢 Step 3：Scene 类

```text
[带上全局架构约束]

Task:
Implement Scene class.

Requirements:
- addElement / updateElement / deleteElement / getElement
- getSlideElements
- pure data operations
- no React dependency
```

---

# 🟢 Step 4：Engine 骨架

```text
[带上全局架构约束]

Task:
Implement Engine class.

Requirements:
- scene, editorState, history, timeline
- methods: execute, undo, redo
- createEngine() factory
```

---

# 🟡 Step 5：Command 系统（关键）

```text
[带上全局架构约束]

Task:
Implement Command system.

Requirements:
- Command type with execute/undo
- Implement:
  AddElementCommand
  MoveElementCommand
  DeleteElementCommand
- payload must include prev/next
```

---

# 🟡 Step 6：History（撤销重做）

```text
[带上全局架构约束]

Task:
Implement History class.

Requirements:
- past / future
- push / undo / redo
- correct stack behavior
```

---

# 🟡 Step 7：Renderer（纯渲染）

```text
[带上全局架构约束]

Task:
Implement renderer.

Requirements:
- renderElement(element, engine)
- support shape / text / image
- apply transform (x, y, width, height, rotation)
- pure function (no state mutation)
```

---

# 🟠 Step 8：拖拽（集成交互）

```text
[带上全局架构约束]

Task:
Integrate drag/resize/rotate using moveable-like behavior.

Requirements:
- On drag end → call engine.execute(MoveElementCommand)
- Do NOT directly mutate state
- Keep engine as single source of truth
```

（这里允许它用类似 react-moveable 的方式写）

---

# 🔵 Step 9：Timeline（动画引擎）

```text
[带上全局架构约束]

Task:
Implement Timeline class.

Requirements:
- currentTime, play, pause, seek
- getElementState(element)
- keyframe interpolation
- use requestAnimationFrame
```

---

# 🔴 Step 10：整合（MVP）

```text
[带上全局架构约束]

Task:
Integrate engine + renderer + interaction.

Requirements:
- App.tsx complete
- support undo/redo (ctrl+z / ctrl+y)
- timeline controls animation
- no direct state mutation
```

---

# 🧩 Step 11：插件系统（平台能力）

```text
[带上全局架构约束]

Task:
Implement plugin system.

Requirements:
- engine.use(plugin)
- registry:
  components / panels / commands / shortcuts
- PluginContext
- Example plugin:
  - register Video component
  - register panel
  - register delete shortcut
```

---

# 🌐 Step 12：协同编辑（CRDT）

```text
[带上全局架构约束]

Task:
Add collaborative editing using Yjs.

Requirements:
- use Y.Doc
- elements stored in Y.Map
- sync add/update/delete
- integrate with Engine (commands still work)
- use websocket provider
```

（这里用 Yjs）

---

# 🧠 Step 13：SnapEngine（吸附系统）

```text
[带上全局架构约束]

Task:
Implement SnapEngine.

Requirements:
- element-to-element alignment (left/center/right/top/middle/bottom)
- canvas center alignment
- threshold = 5px
- return guides (vertical/horizontal)
- optimize to O(n)
- no DOM usage
```

---

# ⚡ Step 14（可选但强烈推荐）：等距吸附（Figma级）

```text
[带上全局架构约束]

Task:
Extend SnapEngine to support spacing alignment.

Requirements:
- detect equal spacing between 3+ elements
- show spacing guides
- prefer center alignment over edge
- multiple guide lines supported
```

---

# 🔥 最后一部分：你必须掌握的“控 AI 技巧”

---

## ❗ 如果 AI 开始写这种代码：

```ts
setState(...)
```

👉 立刻说：

```text
你违反了架构规则：
所有状态必须通过 engine.execute(command)
请重写
```

---

## ❗ 如果它把逻辑写进组件：

```text
Engine must not depend on React
请重构到 engine 层
```

---

## ❗ 如果它乱用 any：

```text
请提升类型安全，减少 any 使用
```

---

# 🧠 最终你会得到什么？

走完这套：

👉 不是 demo
👉 是一个完整的：

* 编辑器引擎（Scene + Command）
* 动画系统（Timeline）
* 空间智能（Snap）
* 平台能力（Plugin）
* 协同能力（CRDT）

---

# 🚀 一句话总结

👉 这 12+ 步本质是：

**把 AI 从“写页面”驯化成“写架构”**

---

如果你下一步要，我可以帮你：

👉 把其中**最难的三块（Command / Timeline / Snap）做成“标准答案代码”**
你可以直接对照校验 AI 写的是否合格。
