import type { Page } from '../../types';
import type { BackendSlide, BackendElement, EditPageResponse } from './schema';

export { type BackendSlide, type BackendElement, type EditPageResponse };

export interface GenerateCoursewareOptions {
  /** Called for each SSE `type: "node"` event with the backend step label. */
  onNodeProgress?: (label: string) => void;
}

export interface AICoursewareService {
  generateCourseware(topic: string, options?: GenerateCoursewareOptions): Promise<BackendSlide[]>;
  editPage(page: Page, instruction: string): Promise<EditPageResponse>;
}
