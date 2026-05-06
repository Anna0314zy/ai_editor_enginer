import type { Page } from '../../types';
import type { AICoursewareService } from './types';
import type { BackendSlide, EditPageResponse, GenerateCoursewareRequest, EditPageRequest } from './schema';

const DEFAULT_BASE_URL = 'http://localhost:8000';

function getApiBaseUrl(): string {
  const stored = localStorage.getItem('ai-courseware-api-base-url');
  return stored ? stored.replace(/\/$/, '') : DEFAULT_BASE_URL;
}

function setApiBaseUrl(url: string): void {
  localStorage.setItem('ai-courseware-api-base-url', url.replace(/\/$/, ''));
}

export { getApiBaseUrl, setApiBaseUrl };

export class ApiAICoursewareService implements AICoursewareService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? getApiBaseUrl()).replace(/\/$/, '');
  }

  async generateCourseware(topic: string): Promise<BackendSlide[]> {
    const url = `${this.baseUrl}/api/v1/courseware/generate`;
    const body: GenerateCoursewareRequest = { topic };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Generate failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as any

    console.log('Generated slides:', data);
    return data.data.courseware.slides as any
  }

  async editPage(page: Page, instruction: string): Promise<EditPageResponse> {
    const url = `${this.baseUrl}/api/v1/courseware/edit`;
    const body: EditPageRequest = {
      page: {
        id: page.id,
        name: page.name,
        elements: page.elements,
      },
      instruction,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Edit failed: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<EditPageResponse>;
  }
}
