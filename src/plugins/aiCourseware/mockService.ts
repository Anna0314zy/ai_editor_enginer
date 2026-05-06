import type { Page, TextElement, ShapeElement } from '../../types';
import type { AICoursewareService } from './types';
import type { BackendSlide, BackendElement, EditPageResponse, BackendAnimationConfig } from './schema';

function anim(
  type: BackendAnimationConfig['type'],
  effect: BackendAnimationConfig['effect'],
  startType: BackendAnimationConfig['startType'] = 'click',
  duration: number = 0.8,
  params?: BackendAnimationConfig['params']
): BackendAnimationConfig {
  return {
    name: effect,
    type,
    effect,
    startType,
    duration,
    delay: 0,
    easing: 'ease-out',
    repeatCount: 0,
    params,
  };
}

function createTextElement(
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  fontSize: number = 24,
  color: string = '#1f2937',
  animations?: BackendAnimationConfig[]
): BackendElement {
  return {
    type: 'text',
    x,
    y,
    width,
    height,
    text,
    fontSize,
    color,
    animations,
  };
}

function createShapeElement(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = '#e5e7eb',
  shapeType: ShapeElement['shapeType'] = 'rectangle',
  animations?: BackendAnimationConfig[]
): BackendElement {
  return {
    type: 'shape',
    x,
    y,
    width,
    height,
    shapeType,
    fill,
    animations,
  };
}

export class MockAICoursewareService implements AICoursewareService {
  async generateCourseware(topic: string): Promise<BackendSlide[]> {
    const slides: BackendSlide[] = [
      {
        title: topic,
        elements: [
          createShapeElement(0, 0, 960, 540, '#3b82f6', 'rectangle', [
            anim('enter', 'fadeIn', 'click', 1, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(80, 160, 800, 80, topic, 56, '#ffffff', [
            anim('enter', 'zoomIn', 'afterPrev', 0.8, { fromScale: 0.5, toScale: 1 }),
          ]),
          createTextElement(80, 260, 800, 40, 'AI Generated Courseware', 24, '#dbeafe', [
            anim('enter', 'fadeIn', 'afterPrev', 0.6, { fromOpacity: 0, toOpacity: 1 }),
          ]),
        ],
      },
      {
        title: 'Introduction',
        elements: [
          createTextElement(60, 40, 400, 50, 'Introduction', 36, '#1f2937', [
            anim('enter', 'slideIn', 'click', 0.6, { direction: 'left', distance: 60 }),
          ]),
          createShapeElement(60, 100, 840, 4, '#3b82f6', 'rectangle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.4, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(
            60,
            130,
            840,
            300,
            `This courseware covers the fundamentals of ${topic}. We will explore key concepts, practical applications, and best practices to help you build a solid understanding.`,
            20,
            '#4b5563',
            [anim('enter', 'fadeIn', 'afterPrev', 0.6, { fromOpacity: 0, toOpacity: 1 })]
          ),
        ],
      },
      {
        title: 'Key Points',
        elements: [
          createTextElement(60, 40, 400, 50, 'Key Points', 36, '#1f2937', [
            anim('enter', 'slideIn', 'click', 0.6, { direction: 'left', distance: 60 }),
          ]),
          createShapeElement(60, 100, 840, 4, '#3b82f6', 'rectangle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.4, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createShapeElement(60, 130, 20, 20, '#3b82f6', 'circle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(100, 126, 780, 40, 'Core concepts and definitions', 20, '#374151', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createShapeElement(60, 190, 20, 20, '#3b82f6', 'circle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(100, 186, 780, 40, 'Practical use cases and examples', 20, '#374151', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createShapeElement(60, 250, 20, 20, '#3b82f6', 'circle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(100, 246, 780, 40, 'Best practices and guidelines', 20, '#374151', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
        ],
      },
      {
        title: 'Summary',
        elements: [
          createTextElement(60, 40, 400, 50, 'Summary', 36, '#1f2937', [
            anim('enter', 'slideIn', 'click', 0.6, { direction: 'left', distance: 60 }),
          ]),
          createShapeElement(60, 100, 840, 4, '#3b82f6', 'rectangle', [
            anim('enter', 'fadeIn', 'afterPrev', 0.4, { fromOpacity: 0, toOpacity: 1 }),
          ]),
          createTextElement(
            60,
            130,
            840,
            200,
            `In summary, ${topic} is an essential topic that combines theory and practice. Keep exploring and applying what you have learned.`,
            20,
            '#4b5563',
            [anim('enter', 'fadeIn', 'afterPrev', 0.6, { fromOpacity: 0, toOpacity: 1 })]
          ),
          createShapeElement(60, 380, 840, 60, '#dbeafe', 'rounded-rectangle', [
            anim('enter', 'slideIn', 'afterPrev', 0.6, { direction: 'down', distance: 40 }),
          ]),
          createTextElement(80, 392, 800, 36, 'Thank you for your attention!', 22, '#1e40af', [
            anim('enter', 'fadeIn', 'afterPrev', 0.5, { fromOpacity: 0, toOpacity: 1 }),
          ]),
        ],
      },
    ];
    return new Promise((resolve) => setTimeout(() => resolve(slides), 800));
  }

  async editPage(page: Page, instruction: string): Promise<EditPageResponse> {
    const lower = instruction.toLowerCase();
    const result: EditPageResponse = {
      elementsToAdd: [],
      elementsToUpdate: [],
      elementsToRemove: [],
    };

    const existingTextElements = Object.values(page.elements).filter(
      (el): el is TextElement => el.type === 'text'
    );

    if (lower.includes('add')) {
      result.elementsToAdd.push(
        createShapeElement(60, 450, 840, 4, '#ef4444', 'rectangle'),
        createTextElement(60, 470, 840, 40, 'Added by AI: ' + instruction, 18, '#ef4444')
      );
    }

    if (lower.includes('delete') || lower.includes('remove')) {
      const lastText = existingTextElements[existingTextElements.length - 1];
      if (lastText) {
        result.elementsToRemove.push(lastText.id);
      }
    }

    if (lower.includes('update') || lower.includes('change') || lower.includes('modify')) {
      const firstText = existingTextElements[0];
      if (firstText) {
        result.elementsToUpdate.push({
          id: firstText.id,
          updates: { text: firstText.text + ' [Updated by AI]' },
        });
      }
    }

    if (result.elementsToAdd.length === 0 && result.elementsToUpdate.length === 0 && result.elementsToRemove.length === 0) {
      result.elementsToAdd.push(
        createTextElement(60, 460, 840, 40, `AI Note: ${instruction}`, 18, '#6b7280')
      );
    }

    return new Promise((resolve) => setTimeout(() => resolve(result), 600));
  }
}
