# 插件开发指南

本文档介绍如何为 Slides Editor 开发自定义插件，包括注册新组件类型和扩展右侧面板。

---

## 一、插件系统概览

编辑器的插件系统基于 `PluginRegistry` 实现，支持两种扩展方式：

| 扩展方式 | 能力 | 典型场景 |
|---------|------|---------|
| **组件型插件** | 注册新组件类型，支持拖拽到画布、渲染、缩略图 | video、chart、table 等 |
| **面板型插件** | 注册右侧面板 Tab | AI 生成、素材库、设置等 |

插件在应用启动时通过 `engine.use(plugin)` 注册，注册后自动集成到编辑器的组件面板、画布渲染、右侧面板中。

---

## 二、核心接口

### 2.1 EnginePlugin

```ts
export interface EnginePlugin {
  id: string;           // 插件唯一标识
  name: string;         // 插件名称
  version?: string;     // 版本号
  enabled?: boolean;    // 是否启用（默认 true）
  panel?: PanelDescriptor;         // 右侧面板（可选）
  components?: ComponentDescriptor[]; // 组件列表（可选）
  onRegister?(engine: Engine): void;   // 注册时回调
  onUnregister?(engine: Engine): void; // 卸载时回调
}
```

### 2.2 ComponentDescriptor（组件描述符）

```ts
export interface ComponentDescriptor {
  type: string;                                    // 组件类型标识，全局唯一
  label: string;                                   // 在组件面板显示的名称
  icon: ReactNode;                                 // 在组件面板显示的图标
  createDefaultElement(x: number, y: number): Element; // 拖拽释放时创建默认元素
  render(element: Element, props: ComponentRenderProps): ReactNode; // 画布渲染
  renderThumbnail(element: Element): ReactNode;     // 结构面板缩略图
}
```

### 2.3 ComponentRenderProps

`render` 函数接收的 `props` 包含画布交互所需的所有信息：

```ts
export interface ComponentRenderProps {
  onClick?: (id: string) => void;
  onMouseDown?: (e: MouseEvent, id: string) => void;
  isSelected?: boolean;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}
```

---

## 三、开发组件型插件

以 `videoPlugin` 为例，演示如何注册一个可在画布上使用的 video 组件。

### 3.1 目录结构

```
src/plugins/myPlugin/
  └── index.tsx
```

### 3.2 完整代码示例

```tsx
import type { ComponentDescriptor, ComponentRenderProps, EnginePlugin } from '../../engine/pluginRegistry';
import type { Element } from '../../types';
import type { MouseEvent } from 'react';

// 1. 定义 createDefaultElement：拖拽到画布时创建的元素数据
function createDefaultElement(x: number, y: number): Element {
  return {
    id: `mytype_${Date.now()}`,
    name: 'My Component',
    type: 'mytype',        // 必须唯一，不能与已有 type 冲突
    x,
    y,
    width: 400,
    height: 300,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
    // 自定义属性...
    src: 'https://example.com/asset',
  } as unknown as Element;
}

// 2. 定义 render：画布上的渲染函数
// ⚠️ 必须返回带定位容器的 div，不能直接返回裸标签
function render(element: Element, props: ComponentRenderProps): React.ReactNode {
  const el = element as unknown as { src: string };

  // 定位样式必须包含，否则元素在画布上看不见
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x + (props.offsetX ?? 0),
    top: element.y + (props.offsetY ?? 0),
    width: element.width,
    height: element.height,
    transform: `rotate(${props.rotation ?? element.rotation}deg)`,
    opacity: element.opacity,
    display: element.visible ? 'block' : 'none',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div
      key={element.id}              // 必须自备 key
      data-element-id={element.id}  // 用于 DOM 查询和选择
      style={baseStyle}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(element.id);
      }}
      onMouseDown={(e: MouseEvent) => props.onMouseDown?.(e, element.id)}
    >
      {/* 业务内容 */}
      <div style={{ width: '100%', height: '100%' }}>
        My Component Content: {el.src}
      </div>

      {/* 选中边框 */}
      {props.isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '2px solid #3b82f6',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// 3. 定义 renderThumbnail：结构面板中的缩略图
function renderThumbnail(element: Element): React.ReactNode {
  return (
    <div
      key={element.id}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        color: '#9ca3af',
        fontSize: 12,
      }}
    >
      My Component
    </div>
  );
}

// 4. 组装 ComponentDescriptor
const myDescriptor: ComponentDescriptor = {
  type: 'mytype',
  label: 'My Component',
  icon: '🧩',
  createDefaultElement,
  render,
  renderThumbnail,
};

// 5. 导出 EnginePlugin
export const myPlugin: EnginePlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  enabled: true,
  components: [myDescriptor],
  onRegister() {
    console.log('[My Plugin] Registered');
  },
};
```

### 3.3 注册插件

在 `src/main.tsx` 中注册：

```ts
import { myPlugin } from './plugins/myPlugin';

const engine = createEngine();
engine.use(myPlugin);   // ← 添加这一行
```

注册后：
- 左侧 **ComponentPalette** 的 `Plugins` 分组下会自动显示该组件
- 拖拽到画布后会通过 `createDefaultElement` 创建元素
- 画布通过 `renderElement` -> 插件 `render` 渲染到正确位置
- 结构面板通过 `renderThumbnail` 显示缩略图

---

## 四、开发面板型插件

以 `aiCoursewarePlugin` 为例，演示如何扩展右侧 Tab 面板。

### 4.1 目录结构

```
src/plugins/myPanelPlugin/
  ├── index.ts    // 插件定义
  └── panel.tsx   // 面板组件
```

### 4.2 面板组件

面板组件接收 `engine` 和 `animationEngine` 两个 props：

```tsx
// panel.tsx
import type { Engine } from '../../engine';

interface PanelProps {
  engine: Engine;
  animationEngine: unknown;
}

export default function MyPanel({ engine }: PanelProps) {
  return (
    <div style={{ padding: 16 }}>
      <h3>My Panel</h3>
      {/* 通过 engine.scene / engine.execute 等 API 与编辑器交互 */}
    </div>
  );
}
```

### 4.3 插件定义

```ts
// index.ts
import type { EnginePlugin } from '../../engine/pluginRegistry';
import MyPanel from './panel';

export const myPanelPlugin: EnginePlugin = {
  id: 'my-panel',
  name: 'My Panel',
  version: '1.0.0',
  enabled: true,
  panel: {
    id: 'my-panel-tab',   // Tab 标识
    label: 'My Panel',    // Tab 显示名称
    component: MyPanel,   // 面板组件
  },
};
```

### 4.4 注册

同样在 `src/main.tsx` 中 `engine.use(myPanelPlugin)`。

注册后，右侧 Tab 栏会自动增加 `My Panel` 标签页。

---

## 五、关键注意事项

### 5.1 render 函数必须返回定位容器

**错误**：直接返回裸标签，元素没有位置信息。
```tsx
function render(element: Element, props: ComponentRenderProps) {
  return <video src="..." />;  // ❌ 画布上看不见
}
```

**正确**：用 `<div>` 包裹，设置 `position: absolute` 和 `left/top/width/height`。
```tsx
function render(element: Element, props: ComponentRenderProps) {
  return (
    <div style={{ position: 'absolute', left: element.x, top: element.y, ... }}>
      <video src="..." />
    </div>
  );
}
```

### 5.2 render 函数必须自备 key

插件组件的 `render` 返回的顶层 JSX 必须显式声明 `key={element.id}`，父组件不再额外包装 Fragment 来补 key。

### 5.3 type 必须全局唯一

`ComponentDescriptor.type` 不能与已有内置类型（`shape`、`text`、`image`、`group`）或其他插件冲突。

### 5.4 透传 props

`onClick`、`onMouseDown`、`isSelected`、`offsetX/Y`、`rotation` 必须正确透传，否则元素无法被选中、拖拽和变换。

### 5.5 自定义属性通过类型断言

由于 `Element` 类型是固定的，插件自定义属性需要通过 `as unknown as { ... }` 访问：
```tsx
const el = element as unknown as { src: string; autoplay?: boolean };
```

---

## 六、插件与编辑器的交互

插件可以通过 `Engine` 实例与编辑器核心交互：

```ts
// 读取当前页面元素
const pageId = engine.scene.getDocument().currentPageId;
const elements = engine.scene.getPageElements(pageId);

// 执行命令（会自动入历史栈和通知UI更新）
engine.execute(new AddElementCommand(engine.scene, pageId, element));

// 订阅状态变化
engine.subscribe('scene', () => {
  console.log('scene changed');
});
```

常用 Engine API：

| API | 说明 |
|-----|------|
| `engine.scene.getDocument()` | 获取完整文档 |
| `engine.scene.getPageElements(pageId)` | 获取页面元素列表 |
| `engine.scene.getPageAnimations(pageId)` | 获取页面动画列表 |
| `engine.execute(command)` | 执行命令（支持撤销重做） |
| `engine.pluginRegistry.getComponents()` | 获取所有已注册组件 |
