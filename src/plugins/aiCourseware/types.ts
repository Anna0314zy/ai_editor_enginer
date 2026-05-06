import type { Page } from '../../types';
import type { BackendSlide, BackendElement, EditPageResponse } from './schema';

export { type BackendSlide, type BackendElement, type EditPageResponse };

export interface AICoursewareService {
  generateCourseware(topic: string): Promise<BackendSlide[]>;
  editPage(page: Page, instruction: string): Promise<EditPageResponse>;
}
