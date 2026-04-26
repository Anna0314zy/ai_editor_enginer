// 开始触发方式 - 仅保留教学刚需3种
type StartType = 
  | 'click'      // 单击触发（课件默认）
  | 'withPrev'   // 与上一动画同时
  | 'afterPrev'; // 上一动画之后

  # 互动课件编辑器 · 动画配置【最终纯净教育版】
已剔除`autoDelay`、冗余自动播放逻辑，完全适配课堂授课、老师手动控节奏，可直接用于前端编码、数据库设计、表单配置。

## 1. 基础枚举定义
```typescript
/** 动画大类：进入/强调/退出/路径 */
type AnimationType = 'enter' | 'emphasis' | 'exit' | 'motionPath';

/** 具体动画效果 */
type AnimationEffect =
  // 进入动画
  | 'fadeIn' | 'zoomIn' | 'slideIn' | 'flyIn' | 'rotateIn' | 'typewriter'
  // 强调动画
  | 'pulse' | 'shake' | 'blink' | 'highlight' | 'scale' | 'colorChange'
  // 退出动画
  | 'fadeOut' | 'zoomOut' | 'slideOut' | 'flyOut' | 'rotateOut'
  // 自定义路径
  | 'linePath' | 'curvePath' | 'circlePath' | 'customPath';

/** 【核心】动画开始触发方式 - 纯教学刚需 */
type StartType = 
  | 'click'      // 单击触发（全局默认）
  | 'withPrev'   // 与上一个动画同时播放
  | 'afterPrev'; // 上一个动画结束后播放

/** 循环模式 */
type LoopMode = 'none' | 'loop' | 'alternate';

/** 缓动函数 */
type EasingMode = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';

/** 交互触发事件（答题/互动场景） */
type TriggerEvent = 'click' | 'hover' | 'dragEnd' | 'pageLoad' | 'answerRight' | 'answerWrong';

/** 触发后执行行为 */
type TriggerAction = 'play' | 'pause' | 'stop' | 'reset' | 'show' | 'hide';
```

## 2. 核心结构化类型
### 2.1 基础元数据
```typescript
interface AnimationBase {
  id: string;
  targetId: string;   // 绑定的画布元素ID
  name: string;       // 动画备注名称
  enable: boolean;    // 是否启用该动画
}
```

### 2.2 时序播放配置（已移除自动延时）
```typescript
interface AnimationTiming {
  startType: StartType;
  duration: number;   // 动画时长，单位：s，默认 0.8
  delay: number;      // 序列延迟，单位：s，默认 0
  loop: LoopMode;
  easing: EasingMode;
  repeatCount: number;// 播放次数，默认 1
}
```

### 2.3 交互触发配置
```typescript
interface AnimationTrigger {
  triggerEvent: TriggerEvent;
  triggerScope: 'self' | 'otherElement' | 'page';
  relateTargetId?: string; // 控制其他元素时的目标ID
  action: TriggerAction;
}
```

### 2.4 动画形变样式
```typescript
interface AnimationStyle {
  opacity: [number, number];    // [起始, 结束] 0~1
  scale: [number, number];     // 缩放区间
  rotate: number;               // 旋转角度
  translate: { x: number; y: number };
  color?: string;
  borderHighlight?: boolean;
  textPlayMode: 'all' | 'word' | 'line'; // 文本逐字/逐行动画
}
```

### 2.5 运动路径配置
```typescript
interface MotionPathConfig {
  pathType: 'line' | 'curve' | 'circle' | 'custom';
  points: Array<{ x: number; y: number }>;
  autoRotate: boolean; // 物体跟随路径旋转
}
```

### 2.6 音效配置
```typescript
interface AnimationAudio {
  audioEnable: boolean;
  audioSource: 'default' | 'custom';
  audioKey?: string;    // 内置音效：enter / right / wrong / tip
  customAudioUrl?: string;
  volume: number;       // 0~100，默认 80
}
```

### 2.7 答题反馈专属动画
```typescript
interface AnswerFeedbackAnim {
  rightAnim: AnimationEffect;
  wrongAnim: AnimationEffect;
  keepTime: number; // 反馈展示停留时长
}
```

### 2.8 页面过渡动画
```typescript
interface PageTransition {
  enable: boolean;
  transitionType: 'fade' | 'slide' | 'flip' | 'cube' | 'wipe';
  duration: number;
  easing: EasingMode;
}
```

## 3. 最终整合 · 单个元素动画完整结构
```typescript
interface ElementAnimation {
  base: AnimationBase;
  type: AnimationType;
  effect: AnimationEffect;
  timing: AnimationTiming;
  trigger: AnimationTrigger;
  style: AnimationStyle;
  pathConfig?: MotionPathConfig;
  audio: AnimationAudio;
  feedback?: AnswerFeedbackAnim;
}
```

## 4. 全局默认值（直接前端落地）
```
startType     = 'click'
duration      = 0.8
delay         = 0
loop          = 'none'
easing        = 'easeInOut'
repeatCount   = 1
volume        = 80
textPlayMode  = 'all'
```

## 5. 业务约束规则
1. 所有动画**强依赖手动/序列触发**，无页面载入自动动画；
2. `afterPrev + delay` 组合，满足知识点留白、思考停顿需求；
3. 答题交互动画强制绑定`answerRight / answerWrong`事件，禁止时序自动播放；
4. 编辑面板仅展示3种`StartType`，降低老师操作复杂度。

# 课件编辑器「编辑态」动画配置 + 预览 完整方案（教育课件最优实践）
结合你前面定好的**3种触发（click / withPrev / afterPrev）**，完全适配老师编辑、备课、预览、授课四种场景，不混乱、不自动乱播、体验统一。

## 一、核心原则（先定规则，避免Bug）
1. **编辑态默认：所有动画静止、不自动播放**
2. **编辑态只提供：单条动画即时预览 + 动画序列分步预览**
3. **只有「全屏预览/授课模式」才走真实触发逻辑（点击、序列联动）**
4. 编辑态禁用：`pageLoad` 自动触发、延时自动播放，只保留人工手动预览

---

## 二、编辑态：动画配置面板 交互规则
### 1. 右侧属性面板 - 动画配置区
1. 选中元素 → 显示「动画」Tab
2. 可新增多条动画（一个元素支持多个动画：进入+强调+退出）
3. 每条动画独立配置：
   - 动画效果（淡入/飞入/抖动…）
   - 时序：`点击/与上一同时/上一之后`
   - 时长、延迟、缓动、循环
4. 动画列表（时间轴极简版）
   - 显示当前页面**全部动画顺序**
   - 支持上下拖拽排序、复制、删除、单独开关启用

### 2. 关键：编辑态下「三个触发项」怎么理解（给老师看的文案）
- `click 点击触发`：授课时点击页面才播
- `withPrev 与上一动画同时`：和上一步动画一起播
- `afterPrev 上一动画之后`：上一步播完自动接着播

> 重点：**编辑态不管选哪种，都不会自动跑，只在预览/授课生效**

---

## 三、编辑态「动画预览」两种能力（必做）
### 能力1：单条动画「即时小预览」（配置页实时看效果）
适用场景：老师调动画快慢、效果、样式
1. 操作：选中某一条动画 → 点击【播放】小按钮
2. 行为：
   - 只播放**当前这一条动画**
   - 无视它的 `startType` 触发规则
   - 播放完自动重置元素到「初始状态」
3. 作用：调时长、缓动、缩放/透明度、路径，所见即所得

### 能力2：整页「动画序列分步预览」（时间轴预览）
适用场景：看整页知识点分步呈现顺序
1. 顶部/时间轴工具栏增加：
   - 【从头播放】【下一步】【重置】
2. 逻辑：
   - 严格按照动画排序 + `withPrev / afterPrev` 时序关系执行
   - 模拟授课分步效果，但**不需要点击**，由按钮控制下一步
   - `click` 类型动画，在分步预览里改为「点击下一步按钮触发」
3. 重置按钮：一键还原所有元素初始状态（非常重要）

---

## 四、三种状态严格隔离（杜绝编辑态乱动画）
### 1. 编辑态（Canvas 编辑）
- 所有元素**初始态永久静止**
- 不执行任何自动动画、序列动画
- 仅支持：单条动画预览、整页分步预览
- 交互事件（点击/hover）全部禁用，防止编辑时误触发动画

### 2. 普通预览态（弹窗/右侧预览）
- 完全还原**真实授课逻辑**
- 遵循：
  - `click`：点击页面播放
  - `withPrev`：同步播放
  - `afterPrev`：顺序自动衔接
- 支持鼠标点击一步步讲课

### 3. 授课/放映态
- 和普通预览逻辑一致
- 全屏、隐藏编辑控件、键盘空格/回车=下一步

---

## 五、编辑态元素「初始状态」设计（极易踩坑）
动画存在**初始态 / 结束态**，必须存两套样式：
1. **元素默认渲染 = 动画初始状态**
   - 进入动画：初始透明/缩小/在外，编辑态一直显示初始态
   - 强调动画：初始正常样式
   - 退出动画：初始正常显示
2. 动画播放时 → 过渡到结束态
3. 【重置】动作：强制所有元素回归**初始态**

> 举例：
> 一个飞入动画，编辑时永远老老实实停在最终位置？❌错误
> 正确：编辑态停在「入场前初始位置」，预览时飞入进来。

---

## 六、极简UI落地方案（直接抄）
### 1. 右侧动画面板
- 动画列表（排序+开关+删除）
- 效果选择器
- 时序配置：开始方式 / 时长 / 延迟 / 缓动
- 【预览此动画】按钮

### 2. 顶部全局动画工具
- 整页【动画重置】
- 【分步预览｜下一步】
- 【完整页面预览】

---

## 七、避坑要点（教育编辑器高频问题）
1. ❌ 不要在编辑态监听元素点击，会导致选元素时突然播放动画
2. ✅ 所有动画预览播放后，**强制延时回滚初始样式**
3. ✅ 多动画叠加（同元素进入+强调），预览要支持叠加执行
4. ✅ 路径动画、逐字文本动画，编辑态单独预览适配
5. ✅ 禁用编辑态循环动画自动无限播放，预览时只播放1次

---

## 八、一句话总结落地逻辑
1. **编辑态 = 静态画布 + 手动触发预览**
2. **预览/授课态 = 真实交互 + 完整动画时序规则**
3. 单条动画用来「调效果」，分步预览用来「看讲课顺序」

## 需要注意
编辑器 UI + 自动兜底方案（前端直接落地）
新增动画时，实时校验
若已存在 click 动画，新增下拉直接置灰「click」选项
提交 / 保存时二次校验
同属性重复 → 弹窗提示：当前元素已存在缩放/位移动画，无法重复添加
输入框自动修正
afterPrev 的 delay 输入 0 / 负数 → 失焦自动回填 0.2
编辑态预览兜底
非法冲突动画，预览时自动忽略后添加的冲突项，防止画布炸裂
动画所有增删改排序，全量加入 undo/redo
✅ 采用「数组整体快照」方案，开发成本最低、最稳
✅ 动画预览、临时播放，不进撤回栈
✅ 和元素编辑历史共用一套全局历史管理器，统一管控