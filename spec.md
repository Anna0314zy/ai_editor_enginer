

---

# 🧠 一、项目定位

**项目名称：** Slides Editor（课件编辑器）

**目标能力：**

* 多页课件（Slide）
* 可视化编辑（拖拽 / 缩放 / 旋转）
* 基础组件（形状 / 图片 / 富文本）
* 分组（Group）与层级管理
* 动画系统（入场 / 强调）
* 时间轴（Timeline + Keyframe）
* 数据驱动渲染（Scene Graph）

---

# 🏗 二、总体架构设计

## 分层结构

```text
UI层
 ├── 左侧：节点 / 画布结构
 ├── 中间：画布编辑区
 ├── 右侧：属性 / 层级 / 动画面板
 └── 底部：时间轴（后期）

核心引擎层
 ├── 数据模型（Scene Graph）
 ├── 编辑器引擎（交互控制）
 ├── 渲染层（DOM Renderer）
 └── 时间轴引擎（Timeline Engine）
```

---

# 📦 三、核心数据模型（Scene Graph）

👉 **整个系统的核心，必须优先设计好**

---

## 1️⃣ 文档结构

```ts
type Document = {
  nodes: Node[]
  slides: Slide[]
}
```

---

## 2️⃣ 节点（Node）

```ts
type Node = {
  id: string
  name: string
  slideIds: string[]
}
```

---

## 3️⃣ 画布（Slide）

```ts
type Slide = {
  id: string
  name: string
  elementIds: string[]
}
```

---

## 4️⃣ 元素（Element）

```ts
type Element = {
  id: string
  type: 'shape' | 'image' | 'text' | 'group'

  parentId?: string
  children?: string[]

  x: number
  y: number
  width: number
  height: number
  rotation: number

  zIndex: number
  props: any

  animations?: Animation[]
}
```

---

## 5️⃣ 动画 & 时间轴

```ts
type Animation = {
  id: string
  type: 'enter' | 'emphasis' | 'path'

  start: number
  duration: number
  easing: string

  trigger?: 'auto' | 'click'
  keyframes?: Keyframe[]
}
```

```ts
type Keyframe = {
  offset: number
  props: Partial<{
    x: number
    y: number
    scale: number
    rotate: number
    opacity: number
  }>
}
```

---

# 🎨 四、核心功能模块

---

## 1️⃣ 画布编辑器（核心）

能力：

* 元素渲染（shape / image / text）
* 拖拽
* 缩放
* 旋转
* 多选 / 框选

技术：

* React
* react-moveable
* Zustand

---

## 2️⃣ 分组系统（Group）

能力：

* 多选 → 合并成组
* group 统一操作
* group 嵌套

设计：

* children 结构
* 相对坐标

---

## 3️⃣ 层级系统（Layer Panel）

能力：

* 树结构展示
* 拖拽排序
* zIndex 控制
* group 管理

设计原则：

> 层级顺序 = 渲染顺序

---

## 4️⃣ 右侧面板系统（核心 UI）

采用 Tab 结构👇

```text
[属性] [层级] [动画]
```

### 属性面板

* 宽高 / 位置 / 旋转
* 图片替换 / 文本编辑

### 层级面板

* 元素树
* 拖拽排序
* group 管理

### 动画面板

* 设置动画类型
* 设置时间参数

---

## 5️⃣ 动画系统（Animation Engine）

能力：

* 入场动画（fade / slide）
* 强调动画（scale / shake）
* 路径动画（path）

实现：

* requestAnimationFrame
* 时间驱动（非事件驱动）

---

# ⏱ 五、时间轴系统（核心亮点）

---

## 核心设计

👉 **时间 → 驱动所有动画状态**

---

## Timeline 结构

```ts
type Timeline = {
  currentTime: number
  duration: number
}
```

---

## 核心能力

* play / pause
* seek（跳转）
* 多动画并行
* 关键帧插值

---

## 渲染逻辑

```ts
for each animation:
  progress = (time - start) / duration
  → 插值计算属性
```

---

## 可扩展能力

* keyframe（关键帧）
* easing（曲线）
* 时间轴 UI（类似视频剪辑）

参考：Adobe Premiere Pro

---

# 🧩 六、路径动画设计（进阶）

---

## 编辑态

👉 DOM + SVG Overlay

* SVG Path 编辑
* 控制点拖拽

---

## 数据

```ts
path: "M0,0 C100,100 ..."
```

---

## 播放

* 根据 path 计算位置
* Timeline 控制进度

---

# ⚙️ 七、渲染架构（关键）

---

## 当前方案

👉 DOM Renderer（React）

---

## 抽象设计

```ts
render(element) => ReactNode
```

---

## 未来扩展

* DOM Renderer（编辑态）
* Canvas Renderer（播放态优化）

---

# 🚀 八、技术选型总结

* 框架：React
* 状态管理：Zustand
* 拖拽/变换：react-moveable
* 动画驱动：requestAnimationFrame
* 路径：SVG

---

# 📈 九、分阶段实现路线（非常重要）

---

## 🟢 Phase 1（基础编辑器）

* 渲染元素
* 拖拽 / 缩放 / 旋转
* 单选

---

## 🟡 Phase 2（结构能力）

* 多选
* 分组
* 层级面板

---

## 🟠 Phase 3（数据管理）

* Node / Slide 管理
* 左侧结构面板

---

## 🔵 Phase 4（动画）

* 入场 / 强调动画
* Animation Engine

---

## 🔴 Phase 5（时间轴）

* Timeline Engine
* keyframe
* easing

---

## 🟣 Phase 6（进阶）

* 路径动画
* Canvas Renderer（可选）

---

# 🧨 十、核心设计原则（必须写给 AI）

```text
1. 所有操作必须修改数据（禁止直接操作 DOM）
2. 渲染层必须是纯函数（数据 → UI）
3. 动画必须是时间驱动（Timeline）
4. 数据结构优先（Scene Graph）
5. 架构必须可扩展（预留 Canvas Renderer）
```

---

# 🧠 十一、项目亮点（面试用）

---

> 本项目基于 Scene Graph 构建课件编辑器核心数据模型，实现了多画布、元素分组与层级管理。在交互层通过数据驱动设计实现拖拽与变换操作，在动画层引入 Timeline Engine 对动画进行统一调度，并支持关键帧与路径动画。同时通过渲染抽象设计预留 Canvas 渲染能力，实现编辑态与播放态的解耦。

---

# 🔚 最终一句话总结

👉 **你做的不是一个页面编辑器，而是一个“轻量设计工具引擎”。**
