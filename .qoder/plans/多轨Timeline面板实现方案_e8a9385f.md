## 多轨 Timeline 面板实现方案（对标剪映 NLE 架构）

## 现状分析

- `src/engine/timeline.ts` - 仅有 play/pause/seek/duration，无轨道概念
- `src/types/index.ts` - Page 上的 `animations: Record<string, AnimationConfig>` 是扁平的
- `src/App.tsx` - 布局为 header + (left | canvas | right)，无底部面板
- 当前动画系统面向"课件演示"设计（click step/batch），非音视频剪辑模型

## 核心架构原则

1. **Track 是容器，Clip 决定内容类型** - 符合 Premiere/CapCut 专业 NLE 设计
2. **Timeline 是主时钟（Master Clock）** - Timeline.currentTime 驱动一切，而非 video 驱动 timeline
3. **分层解耦**：Timeline Engine -> RenderScheduler -> Renderer
4. **资源与片段分离** - Clip 通过 resourceId 引用素材，不直接持有 src
5. **虚拟化渲染** - 只渲染可视区域内的 clips

## 整体架构

```
+----------------------------------------------------------+
|  Header                                                   |
+----------+-------------------------------+---------------+
|  Left    |   Canvas (可缩小)             |  Right Panel  |
|  Panel   |                               |               |
+----------+-------------------------------+---------------+
|  Timeline Panel (底部，可拖拽调整高度)                     |
|  [播放控制] [时间标尺 + Playhead]                          |
|  [视频轨]   clip1(video)  |  clip2(video)                |
|  [overlay] text1  |  sticker1  | shape1                  |
|  [overlay] pip(video)                                    |
|  [音频轨]  audio1           |  audio2                    |
+----------------------------------------------------------+
```

```
Timeline Engine (Master Clock)
      |
 RenderScheduler (帧调度)
      |
 Media Resource Layer (资源管理)
      |
 Renderer (DOM/Canvas/WebGL)
```

---

## 目录结构

```
src/
  engine/
    timeline/
      index.ts            # Timeline 类（主时钟 + 多轨管理）
      types.ts            # Track/Clip/Project 类型定义
      commands.ts         # Timeline 相关 Commands
    renderScheduler.ts    # 帧调度器
  media/
    resourceManager.ts    # 资源统一管理
  store/
    timelineStore.ts      # 响应式 Timeline 状态
  components/
    TimelinePanel/
      TimelinePanel.tsx   # 主容器
      TimeRuler.tsx       # 时间标尺
      Playhead.tsx        # 播放指针
      TrackRow.tsx        # 轨道行
      ClipBlock.tsx       # 片段色块
      TrackLabels.tsx     # 轨道标签列
      interactions.ts     # Pointer events 交互层
      snap.ts             # 吸附系统
```

---

## Task 1: 定义多轨数据模型（类型系统）

新建 `src/engine/timeline/types.ts`：

```ts
// === 轨道类型 ===
// Track 是容器，不关心具体内容类型
export type TrackType = 'video' | 'audio' | 'overlay';

// === 片段内容类型 ===
// Clip.type 决定内容，一个 overlay track 可包含 text/sticker/shape/effect
export type ClipType = 'video' | 'audio' | 'text' | 'sticker' | 'shape' | 'effect';

// === 合成属性 ===
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';

// === 媒体资源引用 ===
export interface MediaResource {
  id: string;
  type: 'video' | 'audio' | 'image';
  src: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// === 片段基础接口 ===
export interface BaseClip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  startTime: number;    // 轨道上的起始时间 (ms)
  duration: number;     // 片段时长 (ms)
  endTime: number;      // startTime + duration，冗余字段，修改时同步更新
  inPoint: number;      // 素材内部裁剪偏移起点 (ms)
  resourceId?: string;  // 引用 MediaResource，而非直接持有 src
}

// === 具体片段类型 ===
export interface VideoClip extends BaseClip {
  type: 'video';
  volume: number;
  speed: number;
  transform?: ClipTransform;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TextClip extends BaseClip {
  type: 'text';
  content: string;
  style: TextClipStyle;
}

export interface StickerClip extends BaseClip {
  type: 'sticker';
  transform?: ClipTransform;
}

export interface ShapeClip extends BaseClip {
  type: 'shape';
  shapeType: string;
  fill: string;
  transform?: ClipTransform;
}

export interface EffectClip extends BaseClip {
  type: 'effect';
  effectType: string;
  params: Record<string, unknown>;
}

export type Clip = VideoClip | AudioClip | TextClip | StickerClip | ShapeClip | EffectClip;

// === 变换 ===
export interface ClipTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface TextClipStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

// === 轨道 ===
export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
  locked: boolean;
  visible: boolean;
  order: number;        // 越小越靠上
  // 合成属性（用于画中画、字幕层级、转场）
  zIndex?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

// === Timeline 项目 ===
export interface TimelineProject {
  id: string;
  tracks: Track[];
  resources: MediaResource[];  // 素材资源池
  duration: number;            // 总时长，由最远的 clip.endTime 决定
  fps: number;
}
```

---

## Task 2: 媒体资源管理器

新建 `src/media/resourceManager.ts`：

```ts
export class ResourceManager {
  private resources = new Map<string, MediaResource>();

  add(resource: MediaResource): void;
  remove(id: string): void;
  get(id: string): MediaResource | undefined;
  getAll(): MediaResource[];

  // 预加载（后期扩展缩略图/波形）
  preload(id: string): Promise<void>;
}
```

职责：
- 统一管理视频/音频/图片资源的注册、缓存、预加载
- Clip 通过 `resourceId` 引用，不直接持有 src
- 后期可扩展缩略图抽帧、波形计算、decode 生命周期管理

---

## Task 3: 扩展 Timeline 引擎（主时钟 + 多轨管理）

重构 `src/engine/timeline/index.ts`：

```ts
export class Timeline {
  // === 主时钟（保留现有逻辑） ===
  private currentTime = 0;
  private duration = 0;
  private playing = false;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  // === 多轨数据 ===
  private project: TimelineProject;

  // === 主时钟 API ===
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;

  // === 轨道 CRUD ===
  addTrack(track: Track): void;
  removeTrack(trackId: string): void;
  reorderTracks(trackIds: string[]): void;
  getTrack(trackId: string): Track | undefined;
  getTracks(): Track[];

  // === 片段 CRUD ===
  addClip(trackId: string, clip: Clip): void;
  removeClip(clipId: string): void;
  moveClip(clipId: string, newTrackId: string, newStartTime: number): void;
  resizeClip(clipId: string, newStartTime: number, newDuration: number): void;
  splitClip(clipId: string, splitTime: number): [Clip, Clip];
  getClip(clipId: string): Clip | undefined;

  // === 查询（支持虚拟化） ===
  getClipsAtTime(time: number): Clip[];
  getVisibleClips(viewportStart: number, viewportEnd: number): Clip[];
  getProject(): TimelineProject;

  // === 内部 ===
  private recalcDuration(): void;  // 遍历所有 clip.endTime 取最大值
  private syncEndTime(clip: BaseClip): void; // 修改 startTime/duration 时同步 endTime
  private tick(): void;  // RAF 驱动，仅推进 currentTime
}
```

关键设计：
- **Timeline 只负责时间推进和数据管理，不直接驱动渲染**
- `getVisibleClips(start, end)` 支持虚拟化，只返回可视范围内的 clips
- 修改 clip 的 startTime/duration 时自动同步 endTime

---

## Task 4: RenderScheduler（帧调度器）

新建 `src/engine/renderScheduler.ts`：

```ts
export class RenderScheduler {
  private timeline: Timeline;
  private frameCallbacks = new Set<(time: number, activeClips: Clip[]) => void>();

  constructor(timeline: Timeline);

  // 每帧调用：计算 active clips 并通知所有 renderer
  onFrame(callback: (time: number, activeClips: Clip[]) => void): () => void;

  // 内部：subscribe timeline.tick -> 计算当前帧的活跃 clips -> 通知
  private scheduleFrame(): void;

  // 丢帧控制
  private lastFrameTime: number;
  private targetFrameInterval: number; // 1000/fps
}
```

职责：
- 订阅 Timeline 的时间变化
- 每帧计算哪些 clip 处于活跃状态（startTime <= currentTime < endTime）
- 通知 Renderer 层渲染对应内容
- 管理帧率、丢帧检测
- 后期可扩展为调度 WebCodecs decode / WebGL render

---

## Task 5: Timeline Commands（命令系统，支持 Undo/Redo）

新建 `src/engine/timeline/commands.ts`：

- `AddTrackCommand`
- `RemoveTrackCommand`
- `AddClipCommand`
- `RemoveClipCommand`
- `MoveClipCommand` (含跨轨道移动)
- `ResizeClipCommand` (trim)
- `SplitClipCommand`
- `UpdateClipCommand`（修改属性）

所有 Command 实现 `{ execute(), undo() }` 接口，通过 `engine.execute(cmd)` 走统一命令通道。

---

## Task 6: TimelineStore（响应式状态）

新建 `src/store/timelineStore.ts`：

```ts
export interface TimelineSnapshot {
  project: TimelineProject;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  // UI 视口状态
  zoom: number;           // px/ms
  scrollLeft: number;     // 水平滚动偏移 (ms)
  viewportStart: number;  // 当前可视范围起始时间
  viewportEnd: number;    // 当前可视范围结束时间
}
```

注册到 `StoreProvider`，提供 `useTimelineStore` hook。

---

## Task 7: Timeline 底部面板 UI 组件

新建 `src/components/TimelinePanel/` 目录：

### 7.1 `TimelinePanel.tsx` - 主容器
- 底部面板，高度可拖拽调整（默认 220px，最小 120px，最大 400px）
- 上方播放控制栏：Play/Pause、时间码显示、缩放滑块
- 下方分两区：左侧 TrackLabels（固定宽度）+ 右侧时间区域（可滚动）

### 7.2 `TimeRuler.tsx` - 时间标尺
- 顶部刻度尺，显示秒/帧标记
- 响应 zoom 级别动态调整刻度密度
- 点击可 seek

### 7.3 `Playhead.tsx` - 播放指针
- 红色竖线 + 顶部三角形 handle
- 可拖拽进行 seek
- 播放时自动跟随 currentTime

### 7.4 `TrackRow.tsx` - 单个轨道行
- 固定高度（video 60px, overlay 48px, audio 40px）
- 背景色区分轨道类型
- 渲染该轨道上 **可视范围内** 的 clips（虚拟化）

### 7.5 `ClipBlock.tsx` - 片段色块
- 根据 clip.type 显示不同颜色
  - video: #4A90D9, audio: #48BB78, text: #ECC94B, sticker: #9F7AEA, shape: #ED8936
- absolute 定位：left = (clip.startTime - scrollLeft) * zoom, width = clip.duration * zoom
- 左右边缘 trim handles（4px 宽热区）
- 选中高亮边框
- 内部显示 clip.name

### 7.6 `TrackLabels.tsx` - 轨道标签列
- 固定左侧 160px，不随时间轴水平滚动
- 每行显示：轨道名称、类型图标、锁定/可见 toggle

### 7.7 `interactions.ts` - Pointer Events 交互层
- 使用原生 Pointer Events（不用 dnd-kit）
- 实现：clip drag、clip trim resize、playhead drag
- sub-pixel 精度控制

### 7.8 `snap.ts` - 吸附系统
- 片段边缘吸附到其他片段边缘（阈值 5px）
- 吸附到 Playhead 位置
- 吸附到整数秒/帧
- 显示吸附指示线

---

## Task 8: 修改 App 布局

改造 `src/App.tsx`：

```
现有：header + main(left | center | right)
改为：
  header
  + 上半区 flex-1 (left | center | right)  -- 可压缩
  + resizable splitter
  + TimelinePanel 底部 (固定/可拖拽高度)
```

Canvas 区域随 Timeline 面板高度变化自适应。使用 flex 布局 + 自定义 resizer div 实现拖拽调整。

---

## 实施阶段（优先级已调整）

### Phase A: 核心交互骨架（最高优先级）

先把 Timeline 面板做到"可用"，核心是交互体验：

| 顺序 | 任务 | 说明 |
|------|------|------|
| A1 | Task 1: 类型系统 | 定义 Track/Clip/Resource 类型 |
| A2 | Task 2: ResourceManager | 媒体资源管理（简单版） |
| A3 | Task 3: Timeline 引擎扩展 | 多轨数据管理 + getVisibleClips |
| A4 | Task 6: TimelineStore | 响应式状态 |
| A5 | Task 8: App 布局改造 | 底部面板骨架 |
| A6 | Task 7.1-7.6: UI 组件 | TimelinePanel 全部子组件 |
| A7 | Playhead 交互 | 可拖拽 seek |
| A8 | Zoom + Horizontal Scroll | Ctrl+滚轮缩放、水平滚动 |
| A9 | Clip Drag | 片段拖拽移动 |
| A10 | Clip Resize | 片段 trim 调整时长 |
| A11 | Split Clip | S 键在 Playhead 处分割 |
| A12 | Snap System | 吸附对齐 |

### Phase B: 命令系统 + 播放

| 顺序 | 任务 | 说明 |
|------|------|------|
| B1 | Task 5: Commands | Undo/Redo 支持 |
| B2 | Task 4: RenderScheduler | 帧调度器 |
| B3 | 播放同步 | HTMLVideoElement + HTMLAudioElement 同步 |

### Phase C: 增强功能（后续迭代）

- 缩略图/波形预览
- 轨道拖拽排序
- 跨轨道拖拽
- 右键菜单
- 键盘快捷键完善
- WebCodecs 精确 seek
- WebGL/WebGPU 合成渲染

---

## 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染方案 | DOM + absolute positioning | 交互迭代快，性能瓶颈后再切 Canvas2D |
| 拖拽方案 | 原生 Pointer Events | 需要 sub-pixel 精度、magnetic snapping、velocity |
| 播放模型 | Timeline 作为 Master Clock | 后期多视频/音频/WebCodecs 同步需要统一时钟源 |
| 音视频 | HTMLVideoElement + HTMLAudioElement | MVP 阶段够用，后期引入 WebCodecs |
| 虚拟化 | getVisibleClips(start, end) | 从第一天就设计，避免后期重构 |
| 缩略图/波形 | Phase C | 当前核心是交互，不是预览 |
