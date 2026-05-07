import { useState, useCallback, useMemo } from 'react';
import type { Engine } from '../../engine';
import {
  CompositeCommand,
  AddPageCommand,
  AddElementCommand,
  MoveElementCommand,
  DeleteElementCommand,
} from '../../engine';

import type { Page, Element, TextElement, ShapeElement, ImageElement } from '../../types';
import type { AnimationConfig } from '../../types/animation';
import { defaultParamsForEffect } from '../../animation';
import { AddAnimationCommand } from '../../engine';
import { ApiAICoursewareService } from './apiService';
import type { BackendElement, BackendAnimationConfig } from './schema';

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 9)}`;
}

function toElement(backend: BackendElement): Element {
  const base = {
    id: generateId(),
    name: backend.type === 'text' ? 'Text' : backend.type === 'shape' ? 'Shape' : 'Image',
    source: backend.source ?? 'ai',
    x: backend.x,
    y: backend.y,
    width: backend.width,
    height: backend.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
  };

  if (backend.type === 'text') {
    return {
      ...base,
      type: 'text',
      text: backend.text,
      fontSize: backend.fontSize ?? 24,
      fontFamily: backend.fontFamily ?? 'Arial, sans-serif',
      color: backend.color ?? '#1f2937',
      align: backend.align ?? 'left',
    } as TextElement;
  }

  if (backend.type === 'shape') {
    return {
      ...base,
      type: 'shape',
      shapeType: backend.shapeType,
      fill: backend.fill ?? '#e5e7eb',
      stroke: backend.stroke ?? 'transparent',
      strokeWidth: backend.strokeWidth ?? 0,
      cornerRadius: backend.cornerRadius,
    } as ShapeElement;
  }

  return {
    ...base,
    type: 'image',
    src: (backend as ImageElement).src,
    objectFit: (backend as ImageElement).objectFit ?? 'cover',
  } as ImageElement;
}

function toAnimationConfig(
  backend: BackendAnimationConfig,
  elementId: string
): AnimationConfig {
  return {
    id: generateId(),
    elementId,
    name: backend.name ?? backend.effect,
    enable: true,
    type: backend.type,
    effect: backend.effect,
    startType: backend.startType ?? 'afterPrev',
    duration: backend.duration ?? 0.8,
    delay: backend.delay ?? 0,
    easing: backend.easing ?? 'ease-out',
    repeatCount: backend.repeatCount ?? 0,
    params: backend.params ?? defaultParamsForEffect(backend.effect),
  };
}

interface AICoursewarePanelProps {
  engine: Engine;
  animationEngine: unknown;
}

type Mode = 'generate' | 'edit';

export default function AICoursewarePanel({ engine }: AICoursewarePanelProps) {
  const currentPageId = engine.scene.getDocument().currentPageId;
  const currentPage = engine.scene.getPage(currentPageId);

  const [mode, setMode] = useState<Mode>('generate');
  const [topic, setTopic] = useState('生成一个教小朋友加法的课件，幽默风格，可以4页');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const service = useMemo(() => new ApiAICoursewareService(), []);
  const handleGenerateDefault = useCallback(async () => {
    const data = [
    {
        "id": null,
        "name": null,
        "title": "加法是什么？—— 小猴子的水果派对",
        "background": {
            "type": "solid",
            "color": "#7ec885",
            "angle": null,
            "stops": null,
            "src": null,
            "fit": null,
            "opacity": null
        },
        "elements": [
            {
                "id": "el-text-1",
                "name": null,
                "x": 80,
                "y": 20,
                "width": 800,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "加法是什么？—— 小猴子的水果派对",
                "fontSize": 30,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-2",
                "name": null,
                "x": 150,
                "y": 150,
                "width": 100,
                "height": 100,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "bounceIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "🍎",
                "fontSize": 60,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-3",
                "name": null,
                "x": 440,
                "y": 150,
                "width": 160,
                "height": 100,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "bounceIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "🍎🍎",
                "fontSize": 60,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-4",
                "name": null,
                "x": 330,
                "y": 150,
                "width": 60,
                "height": 100,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "+",
                "fontSize": 60,
                "fontFamily": "Arial, sans-serif",
                "color": "#f59e0b",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-5",
                "name": null,
                "x": 100,
                "y": 350,
                "width": 760,
                "height": 50,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "1个苹果 + 2个苹果 = 3个苹果 🍎🍎🍎",
                "fontSize": 20,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            }
        ]
    },
    {
        "id": null,
        "name": null,
        "title": "加法的魔法符号",
        "background": {
            "type": "gradient",
            "color": null,
            "angle": 135,
            "stops": [
                {
                    "offset": 0,
                    "color": "#e0f2fe"
                },
                {
                    "offset": 1,
                    "color": "#bae6fd"
                }
            ],
            "src": null,
            "fit": null,
            "opacity": null
        },
        "elements": [
            {
                "id": "el-text-1",
                "name": null,
                "x": 80,
                "y": 20,
                "width": 800,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "加法的魔法符号",
                "fontSize": 30,
                "fontFamily": "Arial, sans-serif",
                "color": "#1e3a8a",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-1",
                "name": null,
                "x": 40,
                "y": 100,
                "width": 280,
                "height": 220,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#6366f1",
                "strokeWidth": 2,
                "cornerRadius": 10,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-2",
                "name": null,
                "x": 60,
                "y": 120,
                "width": 240,
                "height": 30,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "加号 `+`",
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#6366f1",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-3",
                "name": null,
                "x": 100,
                "y": 160,
                "width": 160,
                "height": 60,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "+",
                "fontSize": 50,
                "fontFamily": "Arial, sans-serif",
                "color": "#6366f1",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-4",
                "name": null,
                "x": 60,
                "y": 230,
                "width": 240,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "像十字路口🛤️，\n把两个数引到一处",
                "fontSize": 16,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-2",
                "name": null,
                "x": 340,
                "y": 100,
                "width": 280,
                "height": 220,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#6366f1",
                "strokeWidth": 2,
                "cornerRadius": 10,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-5",
                "name": null,
                "x": 360,
                "y": 120,
                "width": 240,
                "height": 30,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "等号 `=`",
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#6366f1",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-6",
                "name": null,
                "x": 400,
                "y": 160,
                "width": 160,
                "height": 60,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "=",
                "fontSize": 50,
                "fontFamily": "Arial, sans-serif",
                "color": "#6366f1",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-7",
                "name": null,
                "x": 360,
                "y": 230,
                "width": 240,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "像一座小桥🌉，\n告诉我们结果是多少",
                "fontSize": 16,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-3",
                "name": null,
                "x": 640,
                "y": 100,
                "width": 280,
                "height": 220,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#6366f1",
                "strokeWidth": 2,
                "cornerRadius": 10,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-8",
                "name": null,
                "x": 660,
                "y": 115,
                "width": 240,
                "height": 30,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "一起读一读：",
                "fontSize": 20,
                "fontFamily": "Arial, sans-serif",
                "color": "#6366f1",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-9",
                "name": null,
                "x": 680,
                "y": 150,
                "width": 200,
                "height": 50,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "3 + 1 = 4",
                "fontSize": 36,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-10",
                "name": null,
                "x": 660,
                "y": 210,
                "width": 240,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "😊 + 😊😊 = 3个笑脸",
                "fontSize": 18,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            }
        ]
    },
    {
        "id": null,
        "name": null,
        "title": "一起来练习！—— 小动物数零食",
        "background": {
            "type": "solid",
            "color": "#fef3c7",
            "angle": null,
            "stops": null,
            "src": null,
            "fit": null,
            "opacity": null
        },
        "elements": [
            {
                "id": "el-text-1",
                "name": null,
                "x": 80,
                "y": 20,
                "width": 800,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "一起来练习！—— 小动物数零食",
                "fontSize": 30,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-1",
                "name": null,
                "x": 20,
                "y": 80,
                "width": 290,
                "height": 420,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#f59e0b",
                "strokeWidth": 2,
                "cornerRadius": 15,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-2",
                "name": null,
                "x": 35,
                "y": 100,
                "width": 260,
                "height": 80,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "题目①：\n小猫有2条鱼 🐟🐟\n小狗有1根骨头 🦴",
                "fontSize": 16,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-3",
                "name": null,
                "x": 95,
                "y": 190,
                "width": 140,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "2 + 1 = 3",
                "fontSize": 28,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-4",
                "name": null,
                "x": 35,
                "y": 250,
                "width": 260,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "🧠 小笑话：猫加狗等于多少条尾巴？答：1+1=2条尾巴！",
                "fontSize": 14,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-2",
                "name": null,
                "x": 325,
                "y": 80,
                "width": 290,
                "height": 420,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#f59e0b",
                "strokeWidth": 2,
                "cornerRadius": 15,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-5",
                "name": null,
                "x": 340,
                "y": 100,
                "width": 260,
                "height": 80,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "题目②：\n小兔有1个胡萝卜 🥕\n小松鼠有3个坚果 🥜🥜🥜",
                "fontSize": 16,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-6",
                "name": null,
                "x": 400,
                "y": 190,
                "width": 140,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "1 + 3 = 4",
                "fontSize": 28,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-7",
                "name": null,
                "x": 340,
                "y": 250,
                "width": 260,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "😄 小笑话：兔子+松鼠会变成什么？答：变成“蹦蹦跳跳组合”！",
                "fontSize": 14,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-3",
                "name": null,
                "x": 630,
                "y": 80,
                "width": 290,
                "height": 420,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#f59e0b",
                "strokeWidth": 2,
                "cornerRadius": 15,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-8",
                "name": null,
                "x": 645,
                "y": 100,
                "width": 260,
                "height": 80,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "题目③：\n小熊猫有2根竹子 🎋🎋\n小象有2个香蕉 🍌🍌",
                "fontSize": 16,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-9",
                "name": null,
                "x": 705,
                "y": 190,
                "width": 140,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "zoomIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "2 + 2 = 4",
                "fontSize": 28,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-10",
                "name": null,
                "x": 645,
                "y": 250,
                "width": 260,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "😄 小笑话：熊猫+大象会变成什么？答：变成“黑白配”！",
                "fontSize": 14,
                "fontFamily": "Arial, sans-serif",
                "color": "#4b5563",
                "align": "left",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            }
        ]
    },
    {
        "id": null,
        "name": null,
        "title": "加法大冒险总结",
        "background": {
            "type": "gradient",
            "color": null,
            "angle": 135,
            "stops": [
                {
                    "offset": 0,
                    "color": "#ffedd5"
                },
                {
                    "offset": 1,
                    "color": "#fed7aa"
                }
            ],
            "src": null,
            "fit": null,
            "opacity": null
        },
        "elements": [
            {
                "id": "el-text-1",
                "name": null,
                "x": 80,
                "y": 20,
                "width": 800,
                "height": 40,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "加法大冒险总结",
                "fontSize": 30,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-1",
                "name": null,
                "x": 100,
                "y": 80,
                "width": 760,
                "height": 90,
                "rotation": 0,
                "opacity": 0.8,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#f59e0b",
                "strokeWidth": 2,
                "cornerRadius": 10,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-2",
                "name": null,
                "x": 120,
                "y": 90,
                "width": 720,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "加法歌谣：左一个，右一个，加在一起数一数！等于桥，跨过去，结果就在桥那头！",
                "fontSize": 18,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-shape-2",
                "name": null,
                "x": 100,
                "y": 190,
                "width": 760,
                "height": 90,
                "rotation": 0,
                "opacity": 0.8,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.5,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "shape",
                "text": null,
                "fontSize": 24,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "left",
                "shapeType": "rect",
                "fill": "#ffffff",
                "stroke": "#f59e0b",
                "strokeWidth": 2,
                "cornerRadius": 10,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-3",
                "name": null,
                "x": 120,
                "y": 200,
                "width": 720,
                "height": 70,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "withPrev",
                        "duration": 0.4,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "在生活中找加法：1只鞋 + 1只鞋 = 2只鞋；1个手指 + 4个手指 = 5个手指",
                "fontSize": 18,
                "fontFamily": "Arial, sans-serif",
                "color": "#1f2937",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-4",
                "name": null,
                "x": 370,
                "y": 310,
                "width": 220,
                "height": 120,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "bounceIn",
                        "startType": "click",
                        "duration": 0.7,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "🦸",
                "fontSize": 100,
                "fontFamily": "Arial, sans-serif",
                "color": "#dc2626",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            },
            {
                "id": "el-text-5",
                "name": null,
                "x": 100,
                "y": 460,
                "width": 760,
                "height": 50,
                "rotation": 0,
                "opacity": 1,
                "visible": true,
                "parentId": null,
                "childrenIds": [],
                "source": null,
                "animations": [
                    {
                        "name": null,
                        "type": "enter",
                        "effect": "fadeIn",
                        "startType": "click",
                        "duration": 0.6,
                        "delay": 0,
                        "easing": "ease-out",
                        "repeatCount": 0,
                        "params": null
                    }
                ],
                "type": "text",
                "text": "“小朋友们，加法不可怕，多练是魔法！下次再见～”",
                "fontSize": 20,
                "fontFamily": "Arial, sans-serif",
                "color": "#7c2d12",
                "align": "center",
                "shapeType": null,
                "fill": "#e5e7eb",
                "stroke": "transparent",
                "strokeWidth": 0,
                "cornerRadius": null,
                "src": null,
                "objectFit": "cover"
            }
        ]
    }
]
    handleGenerate('default',data)
  }, [topic, engine, service]);

  const handleGenerate = useCallback(async (type:string, data:any) => {
    if (!topic.trim()) return;
    setLoading(true);
    setMessage('Generating courseware...');
    try {
      let slides = [];
      if (type === 'default' && data) {
        slides = data;
      } else {
        slides = await service.generateCourseware(topic.trim(), {
          onNodeProgress: (label) => setMessage(label.trim() || '生成中…'),
        });
      }

      
      console.log('Generated slides:', slides);

      const commands: CompositeCommand['commands'] = [];

      for (const slide of slides) {
        const pageId = `page-${Math.random().toString(36).slice(2, 9)}`;
        const page: Page = {
          id: pageId,
          name: slide.title,
          background: slide.background,
          elements: {},
          animations: {},
        };
        commands.push(new AddPageCommand(engine.scene, page, false));
        for (const element of slide.elements) {
          const el = toElement(element);
          commands.push(new AddElementCommand(engine.scene, pageId, el));
          if (element.animations) {
            for (const backendAnim of element.animations) {
              commands.push(
                new AddAnimationCommand(engine.scene, pageId, toAnimationConfig(backendAnim, el.id))
              );
            }
          }
        }
      }

      if (commands.length > 0) {
        engine.execute(new CompositeCommand(commands));
      }
      setMessage(`Generated ${slides.length} slides!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [topic, engine, service]);

  const handleEditPage = useCallback(async () => {
    if (!currentPage || !instruction.trim()) return;
    setLoading(true);
    setMessage('Editing page...');
    try {
      const result = await service.editPage(currentPage, instruction.trim());
      const commands: CompositeCommand['commands'] = [];

      for (const element of result.elementsToAdd) {
        commands.push(new AddElementCommand(engine.scene, currentPage.id, toElement(element)));
      }

      for (const update of result.elementsToUpdate) {
        commands.push(new MoveElementCommand(engine.scene, update.id, update.updates));
      }

      for (const elementId of result.elementsToRemove) {
        commands.push(new DeleteElementCommand(engine.scene, elementId, currentPage.id));
      }

      if (commands.length > 0) {
        engine.execute(new CompositeCommand(commands));
      }
      setMessage('Page edited!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Edit failed.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, instruction, engine, service]);

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: '#f9fafb',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes aicw-stream-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>AI Assistant</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode('generate')}
          disabled={mode === 'generate'}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: mode === 'generate' ? '#3b82f6' : '#ffffff',
            color: mode === 'generate' ? '#ffffff' : '#374151',
            cursor: mode === 'generate' ? 'default' : 'pointer',
          }}
        >
          Generate
        </button>
        <button
          onClick={() => {
            // setMode('edit')
          }}
          disabled={mode === 'edit'}
          style={{
            flex: 1,
            cursor: 'not-allowed',
            padding: '8px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: mode === 'edit' ? '#3b82f6' : '#ffffff',
            color: mode === 'edit' ? '#ffffff' : '#374151',
            // cursor: mode === 'edit' ? 'default' : 'pointer',
          }}
        >
          Edit Page
        </button>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6b7280', lineHeight: 1.45 }}>
        后端 API 基址由 Vite 构建模式决定：开发默认 http://localhost:8000，生产默认
        https://web-production-c427b.up.railway.app；可在 vite.config.ts 顶部常量修改。
      </p>

      {mode === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#4b5563' }}>
            Topic
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis"
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <button
            onClick={() => void handleGenerate('remote', undefined)}
            disabled={loading || !topic.trim()}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: loading || !topic.trim() ? '#9ca3af' : '#10b981',
              color: '#ffffff',
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating...' : 'Generate Courseware'}
          </button>
           <button
            onClick={handleGenerateDefault}
            disabled={loading || !topic.trim()}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: loading || !topic.trim() ? '#9ca3af' : '#10b981',
              color: '#ffffff',
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {'之前大模型生成的数据'}
          </button>
          {loading && (
            <div
              style={{
                marginTop: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '28%',
                  borderRadius: 2,
                  backgroundColor: '#10b981',
                  animation: 'aicw-stream-bar 1.1s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Current page: <strong>{currentPage?.name ?? 'None'}</strong>
          </div>
          <label style={{ fontSize: 12, color: '#4b5563' }}>
            Instruction
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Add a summary note at the bottom"
              rows={4}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </label>
          <button
            onClick={handleEditPage}
            disabled={loading || !instruction.trim() || !currentPage}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: loading || !instruction.trim() || !currentPage ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              cursor: loading || !instruction.trim() || !currentPage ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: '8px 12px',
            fontSize: 12,
            borderRadius: 4,
            backgroundColor: '#dbeafe',
            color: '#1e40af',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
