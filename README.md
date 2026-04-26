# ai_editor_enginer
课件编辑器

动画配置 预览态
设计意图
"Step X / Y" 是预览模式的进度指示器，基于 Step/Batch 执行模型：
概念	含义
Step（步骤）	用户一次点击触发的动画集合
Batch（批次）	Step 内部串行执行的动画组
Batch 内动画	并行同时播放
只有 startType === 'click' 的动画才会开启一个新 Step。比如：
动画1: click → 创建 Step 1
动画2: withPrev → 加入 Step 1 的同一 Batch（同时播放）
动画3: afterPrev → 创建 Step 1 的新 Batch（等上一个 Batch 完后再播放）
动画4: click → 创建 Step 2