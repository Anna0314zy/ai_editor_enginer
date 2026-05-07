import type { Page } from '../../types';
import type { AICoursewareService } from './types';
import type { BackendSlide, EditPageResponse, GenerateCoursewareRequest, EditPageRequest } from './schema';

const DEFAULT_BASE_URL = __AI_COURSEWARE_DEFAULT_BASE_URL__;

export class ApiAICoursewareService implements AICoursewareService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
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
  //   const data = [
  //     {
  //         "id": "slide-1",
  //         "name": null,
  //         "title": "欢迎来到加法魔法世界",
  //         "background": {
  //             "type": "gradient",
  //             "color": null,
  //             "angle": 135,
  //             "stops": [
  //                 {
  //                     "offset": 0,
  //                     "color": "#fff7e6"
  //                 },
  //                 {
  //                     "offset": 1,
  //                     "color": "#ffe0b2"
  //                 }
  //             ],
  //             "src": null,
  //             "fit": null,
  //             "opacity": null
  //         },
  //         "elements": [
  //             {
  //                 "id": "el-text-1-1",
  //                 "name": null,
  //                 "x": 60,
  //                 "y": 20,
  //                 "width": 840,
  //                 "height": 50,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "click",
  //                         "duration": 0.8,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "🎉 欢迎来到加法魔法世界！",
  //                 "fontSize": 32,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#d84315",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-1-2",
  //                 "name": null,
  //                 "x": 50,
  //                 "y": 90,
  //                 "width": 400,
  //                 "height": 300,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "afterPrev",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "小猫咪 + 小狗 = ？\n喵喵 + 汪汪 → 一共几只小动物？😸🐶\n\n1颗糖果 + 1颗糖果 = 2颗糖果 🍬🍬\n\n你有2个苹果，妈妈再给你1个，一共有几个？\n来，伸出小手指数一数：1、2、3！\n\n加法就是“合在一起变多” 🧮✨",
  //                 "fontSize": 18,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#4e342e",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-1-1",
  //                 "name": null,
  //                 "x": 510,
  //                 "y": 90,
  //                 "width": 380,
  //                 "height": 280,
  //                 "rotation": 0,
  //                 "opacity": 0.9,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "click",
  //                         "duration": 0.5,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#ffcc80",
  //                 "strokeWidth": 3,
  //                 "cornerRadius": 20,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-image-1-1",
  //                 "name": null,
  //                 "x": 530,
  //                 "y": 110,
  //                 "width": 340,
  //                 "height": 240,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.7,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "image",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  //                 "objectFit": "contain"
  //             },
  //             {
  //                 "id": "el-text-1-3",
  //                 "name": null,
  //                 "x": 50,
  //                 "y": 400,
  //                 "width": 860,
  //                 "height": 60,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "afterPrev",
  //                         "duration": 0.5,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "小提示：把你的小手当成小算盘，数一数，超有趣！",
  //                 "fontSize": 16,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#6d4c41",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             }
  //         ]
  //     },
  //     {
  //         "id": "slide-2",
  //         "name": null,
  //         "title": "加法小知识：加号和等号",
  //         "background": {
  //             "type": "gradient",
  //             "color": null,
  //             "angle": 135,
  //             "stops": [
  //                 {
  //                     "offset": 0,
  //                     "color": "#e1f5fe"
  //                 },
  //                 {
  //                     "offset": 1,
  //                     "color": "#b3e5fc"
  //                 }
  //             ],
  //             "src": null,
  //             "fit": null,
  //             "opacity": null
  //         },
  //         "elements": [
  //             {
  //                 "id": "el-text-2-1",
  //                 "name": null,
  //                 "x": 60,
  //                 "y": 20,
  //                 "width": 840,
  //                 "height": 50,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "click",
  //                         "duration": 0.8,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "➕ 加号和等号的故事",
  //                 "fontSize": 32,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#01579b",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-2-1",
  //                 "name": null,
  //                 "x": 30,
  //                 "y": 90,
  //                 "width": 280,
  //                 "height": 340,
  //                 "rotation": 0,
  //                 "opacity": 0.95,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "click",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#4fc3f7",
  //                 "strokeWidth": 2,
  //                 "cornerRadius": 15,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-2-2",
  //                 "name": null,
  //                 "x": 50,
  //                 "y": 110,
  //                 "width": 240,
  //                 "height": 300,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "加号（+） 像一个小十字路口，把数字牵在一起 🚥\n\n等号（=） 像一条小马路，告诉我们“结果是” ⚖️",
  //                 "fontSize": 18,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#01579b",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-2-2",
  //                 "name": null,
  //                 "x": 340,
  //                 "y": 90,
  //                 "width": 280,
  //                 "height": 340,
  //                 "rotation": 0,
  //                 "opacity": 0.95,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "click",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#4fc3f7",
  //                 "strokeWidth": 2,
  //                 "cornerRadius": 15,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-2-3",
  //                 "name": null,
  //                 "x": 360,
  //                 "y": 110,
  //                 "width": 240,
  //                 "height": 300,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "演示：2只气球 + 1只气球 = 3只气球 🎈🎈+🎈 = 🎈🎈🎈\n\n幽默场景：一只脚 + 一只脚 = 一双脚 🦶+🦶=👟",
  //                 "fontSize": 18,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#01579b",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-2-3",
  //                 "name": null,
  //                 "x": 650,
  //                 "y": 90,
  //                 "width": 280,
  //                 "height": 340,
  //                 "rotation": 0,
  //                 "opacity": 0.95,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "click",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#4fc3f7",
  //                 "strokeWidth": 2,
  //                 "cornerRadius": 15,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-2-4",
  //                 "name": null,
  //                 "x": 670,
  //                 "y": 110,
  //                 "width": 240,
  //                 "height": 300,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "练习：3 + 2 = ？\n用气球图画数一数，答案是 5！\n\n记住：加号说“合起来”，等号说“等于”。",
  //                 "fontSize": 18,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#01579b",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-2-5",
  //                 "name": null,
  //                 "x": 50,
  //                 "y": 460,
  //                 "width": 860,
  //                 "height": 50,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "afterPrev",
  //                         "duration": 0.5,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "> 记住：加号说“合起来”，等号说“等于”。",
  //                 "fontSize": 16,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#4a148c",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             }
  //         ]
  //     },
  //     {
  //         "id": "slide-3",
  //         "name": null,
  //         "title": "加法大闯关",
  //         "background": {
  //             "type": "gradient",
  //             "color": null,
  //             "angle": 135,
  //             "stops": [
  //                 {
  //                     "offset": 0,
  //                     "color": "#e8f5e9"
  //                 },
  //                 {
  //                     "offset": 1,
  //                     "color": "#c8e6c9"
  //                 }
  //             ],
  //             "src": null,
  //             "fit": null,
  //             "opacity": null
  //         },
  //         "elements": [
  //             {
  //                 "id": "el-text-3-1",
  //                 "name": null,
  //                 "x": 60,
  //                 "y": 20,
  //                 "width": 840,
  //                 "height": 50,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "click",
  //                         "duration": 0.8,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "🏆 加法大闯关！",
  //                 "fontSize": 32,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#2e7d32",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-3-1",
  //                 "name": null,
  //                 "x": 30,
  //                 "y": 90,
  //                 "width": 900,
  //                 "height": 380,
  //                 "rotation": 0,
  //                 "opacity": 0.8,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "click",
  //                         "duration": 0.5,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#66bb6a",
  //                 "strokeWidth": 3,
  //                 "cornerRadius": 20,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-3-2",
  //                 "name": null,
  //                 "x": 60,
  //                 "y": 110,
  //                 "width": 840,
  //                 "height": 340,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.7,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "第一关：1 + 1 = ？ 🤔 嗯？两只小手指一对，是 2！\n\n第二关：2 + 2 = ？ 想想，2只小猴 + 2只小熊 → 一共 4 只小动物！🐵+🐻=🐵🐵🐻🐻\n\n互动游戏：小朋友手拉手 两个小朋友先站一起，再来两个，全部拉手——组成“2+2=4”！\n\n答对奖励：加法小勇士勋章 🏅\n\n不会算？别急！用图画或你的小手指帮忙，轻松过关！",
  //                 "fontSize": 18,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1b5e20",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-image-3-1",
  //                 "name": null,
  //                 "x": 600,
  //                 "y": 280,
  //                 "width": 250,
  //                 "height": 160,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "bounceIn",
  //                         "startType": "afterPrev",
  //                         "duration": 0.8,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "image",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  //                 "objectFit": "contain"
  //             }
  //         ]
  //     },
  //     {
  //         "id": "slide-4",
  //         "name": null,
  //         "title": "加法小总结 欢乐大合唱",
  //         "background": {
  //             "type": "gradient",
  //             "color": null,
  //             "angle": 90,
  //             "stops": [
  //                 {
  //                     "offset": 0,
  //                     "color": "#fce4ec"
  //                 },
  //                 {
  //                     "offset": 0.5,
  //                     "color": "#f3e5f5"
  //                 },
  //                 {
  //                     "offset": 1,
  //                     "color": "#e8eaf6"
  //                 }
  //             ],
  //             "src": null,
  //             "fit": null,
  //             "opacity": null
  //         },
  //         "elements": [
  //             {
  //                 "id": "el-text-4-1",
  //                 "name": null,
  //                 "x": 60,
  //                 "y": 20,
  //                 "width": 840,
  //                 "height": 50,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "click",
  //                         "duration": 0.8,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "🎶 加法小总结 欢乐大合唱",
  //                 "fontSize": 32,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#6a1b9a",
  //                 "align": "center",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-4-1",
  //                 "name": null,
  //                 "x": 30,
  //                 "y": 90,
  //                 "width": 430,
  //                 "height": 380,
  //                 "rotation": 0,
  //                 "opacity": 0.9,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "click",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#ce93d8",
  //                 "strokeWidth": 2,
  //                 "cornerRadius": 15,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-text-4-2",
  //                 "name": null,
  //                 "x": 50,
  //                 "y": 110,
  //                 "width": 390,
  //                 "height": 340,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "fadeIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.7,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "text",
  //                 "text": "加法含义：加号像小手拉一起，等号像小马路，结果是“合并变多”\n\n口诀：“加法就是变多多，左右合在一起数” 🎤\n\n幽默彩蛋：加号先生😎和等号小姐👰的婚礼——他们合并成一个大大的“➕=❤️”！\n\n回家任务：和爸妈玩“水果加法游戏”，比如：3颗草莓+2颗蓝莓=5颗水果 🍓🍓🍓🫐🫐\n\n结束语：数学真有趣，下次再见！👋\n\n你们都是最棒的加法小勇士！🎉",
  //                 "fontSize": 17,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#4a148c",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-shape-4-2",
  //                 "name": null,
  //                 "x": 500,
  //                 "y": 90,
  //                 "width": 430,
  //                 "height": 380,
  //                 "rotation": 0,
  //                 "opacity": 0.9,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "slideIn",
  //                         "startType": "click",
  //                         "duration": 0.6,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "shape",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": "rectangle",
  //                 "fill": "#ffffff",
  //                 "stroke": "#ce93d8",
  //                 "strokeWidth": 2,
  //                 "cornerRadius": 15,
  //                 "src": null,
  //                 "objectFit": "cover"
  //             },
  //             {
  //                 "id": "el-image-4-1",
  //                 "name": null,
  //                 "x": 520,
  //                 "y": 130,
  //                 "width": 390,
  //                 "height": 320,
  //                 "rotation": 0,
  //                 "opacity": 1,
  //                 "visible": true,
  //                 "parentId": null,
  //                 "childrenIds": [],
  //                 "source": null,
  //                 "animations": [
  //                     {
  //                         "name": null,
  //                         "type": "enter",
  //                         "effect": "zoomIn",
  //                         "startType": "withPrev",
  //                         "duration": 0.7,
  //                         "delay": 0,
  //                         "easing": "ease-out",
  //                         "repeatCount": 0,
  //                         "params": null
  //                     }
  //                 ],
  //                 "type": "image",
  //                 "text": null,
  //                 "fontSize": 24,
  //                 "fontFamily": "Arial, sans-serif",
  //                 "color": "#1f2937",
  //                 "align": "left",
  //                 "shapeType": null,
  //                 "fill": "#e5e7eb",
  //                 "stroke": "transparent",
  //                 "strokeWidth": 0,
  //                 "cornerRadius": null,
  //                 "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  //                 "objectFit": "contain"
  //             }
  //         ]
  //     }
  // ]
  // return data as any
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
