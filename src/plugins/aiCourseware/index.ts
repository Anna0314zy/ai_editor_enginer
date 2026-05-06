import type { EnginePlugin } from '../../engine/pluginRegistry';
import AICoursewarePanel from './panel';

export const aiCoursewarePlugin: EnginePlugin = {
  id: 'ai-courseware',
  name: 'AI Courseware',
  version: '1.0.0',
  enabled: true,
  panel: {
    id: 'ai',
    label: 'AI',
    component: AICoursewarePanel,
  },
  onRegister() {
    console.log('[AI Courseware Plugin] Registered');
  },
  onUnregister() {
    console.log('[AI Courseware Plugin] Unregistered');
  },
};
