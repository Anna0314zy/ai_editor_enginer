import { useState } from 'react';
import MediaTab from './MediaTab';
import TextTab from './TextTab';
import StickerTab from './StickerTab';
import EffectTab from './EffectTab';

// ============================================================================
// MaterialLibrary - 左侧素材库容器
// 顶部 Tab 切换：媒体 / 文本 / 贴纸 / 特效
// 子组件统一从 VideoTimelineContext 取 timeline 与 resourceManager
// ============================================================================

type TabKey = 'media' | 'text' | 'sticker' | 'effect';

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'media', icon: '🎬', label: '媒体' },
  { key: 'text', icon: 'T', label: '文本' },
  { key: 'sticker', icon: '⭐', label: '贴纸' },
  { key: 'effect', icon: '✨', label: '特效' },
];

export default function MaterialLibrary() {
  const [activeTab, setActiveTab] = useState<TabKey>('media');

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-800 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer border-none ${
              activeTab === tab.key
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                : 'bg-transparent text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'sticker' && <StickerTab />}
        {activeTab === 'effect' && <EffectTab />}
      </div>
    </div>
  );
}
