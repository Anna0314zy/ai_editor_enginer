# AI Courseware Backend Data Specification

## Canvas

| Property | Value |
|----------|-------|
| Width    | 960   |
| Height   | 540   |
| Origin   | Top-left (0, 0) |

---

## Common Fields (All Components)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `source` | `"user" \| "ai"` | No | `"ai"` | Element source. Use `"ai"` for AI-generated elements. |

---

## Supported Components

### 1. Text (`type: "text"`)

```json
{
  "type": "text",
  "x": 80,
  "y": 160,
  "width": 800,
  "height": 80,
  "text": "Slide Title",
  "fontSize": 56,
  "fontFamily": "Arial, sans-serif",
  "color": "#ffffff",
  "align": "left"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `"text"` | Yes | - |
| `x` | number | Yes | - |
| `y` | number | Yes | - |
| `width` | number | Yes | - |
| `height` | number | Yes | - |
| `text` | string | Yes | - |
| `fontSize` | number | No | 24 |
| `fontFamily` | string | No | `"Arial, sans-serif"` |
| `color` | string (hex) | No | `"#1f2937"` |
| `align` | `"left" \| "center" \| "right"` | No | `"left"` |
| `source` | `"user" \| "ai"` | No | `"ai"` | Element source |

---

### 2. Shape (`type: "shape"`)

```json
{
  "type": "shape",
  "x": 0,
  "y": 0,
  "width": 960,
  "height": 540,
  "shapeType": "rectangle",
  "fill": "#3b82f6",
  "stroke": "transparent",
  "strokeWidth": 0,
  "cornerRadius": 8
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `"shape"` | Yes | - |
| `x` | number | Yes | - |
| `y` | number | Yes | - |
| `width` | number | Yes | - |
| `height` | number | Yes | - |
| `shapeType` | string | Yes | `"rectangle"` |
| `fill` | string (hex) | No | `"#e5e7eb"` |
| `stroke` | string (hex) | No | `"transparent"` |
| `strokeWidth` | number | No | 0 |
| `cornerRadius` | number | No | - |
| `source` | `"user" \| "ai"` | No | `"ai"` | Element source |

**Supported `shapeType` values:**
`rectangle`, `circle`, `triangle`, `rounded-rectangle`, `line`, `arrow`, `polygon`, `star`, `pentagon`, `hexagon`, `octagon`, `star-5`, `star-6`

---

### 3. Image (`type: "image"`)

```json
{
  "type": "image",
  "x": 100,
  "y": 100,
  "width": 300,
  "height": 200,
  "src": "https://example.com/image.png",
  "objectFit": "cover"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `"image"` | Yes | - |
| `x` | number | Yes | - |
| `y` | number | Yes | - |
| `width` | number | Yes | - |
| `height` | number | Yes | - |
| `src` | string (URL) | Yes | - |
| `objectFit` | `"cover" \| "contain" \| "fill"` | No | `"cover"` |
| `source` | `"user" \| "ai"` | No | `"ai"` | Element source |

---

## Animation Configuration

Any component can have an optional `animations` array. Each animation describes how the element enters, emphasizes, or exits the slide.

```json
{
  "type": "text",
  "x": 80,
  "y": 160,
  "text": "Hello",
  "animations": [
    {
      "name": "fadeIn",
      "type": "enter",
      "effect": "fadeIn",
      "startType": "click",
      "duration": 0.8,
      "delay": 0,
      "easing": "ease-out",
      "repeatCount": 0,
      "params": { "fromOpacity": 0, "toOpacity": 1 }
    }
  ]
}
```

### Animation Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | No | `effect` value | Display name |
| `type` | `"enter" \| "emphasis" \| "exit"` | Yes | - | Animation category |
| `effect` | string | Yes | - | Specific animation effect |
| `startType` | `"click" \| "withPrev" \| "afterPrev"` | No | `"click"` | Trigger timing |
| `duration` | number (seconds) | No | 0.8 | Animation duration |
| `delay` | number (seconds) | No | 0 | Delay before start |
| `easing` | string | No | `"ease-out"` | Easing curve |
| `repeatCount` | number | No | 0 | Repeat times (0 = once) |
| `params` | object | No | - | Effect-specific parameters |

### `startType` Explanation

- `click`: User must click to trigger this animation
- `afterPrev`: Plays automatically after the previous animation finishes
- `withPrev`: Plays simultaneously with the previous animation

### Supported Effects & Params

| Category | Effect | Params |
|----------|--------|--------|
| **Enter** | `fadeIn` | `{ fromOpacity, toOpacity }` |
| | `zoomIn` | `{ fromScale, toScale }` |
| | `slideIn` | `{ direction: "left" \| "right" \| "up" \| "down", distance }` |
| | `flyIn` | Same as `slideIn` |
| | `rotateIn` | `{ fromAngle, toAngle }` |
| **Emphasis** | `pulse` | None |
| | `shake` | None |
| | `blink` | None |
| | `scale` | `{ fromScale, toScale }` |
| | `highlight` | `{ brightness }` |
| **Exit** | `fadeOut` | `{ fromOpacity, toOpacity }` |
| | `zoomOut` | `{ fromScale, toScale }` |
| | `slideOut` | `{ direction, distance }` |
| | `flyOut` | Same as `slideOut` |
| | `rotateOut` | `{ fromAngle, toAngle }` |

### Recommended Animation Combinations

**Cover slide:**
- Background: `fadeIn` (duration: 1.0, startType: `click`)
- Title: `zoomIn` (duration: 0.8, startType: `afterPrev`)
- Subtitle: `fadeIn` (duration: 0.6, startType: `afterPrev`)

**Content slide:**
- Section title: `slideIn` direction: left (duration: 0.6, startType: `click`)
- Divider line: `fadeIn` (duration: 0.4, startType: `afterPrev`)
- Body text: `fadeIn` (duration: 0.6, startType: `afterPrev`)

**Bullet points:**
- Title: `slideIn` direction: left (startType: `click`)
- Each bullet: `fadeIn` (startType: `afterPrev`, staggered)

---

## API 1: Generate Courseware

### Request

```json
POST /api/generate
{
  "topic": "Photosynthesis"
}
```

### Response

```json
{
  "slides": [
    {
      "title": "Photosynthesis",
      "elements": [
        {
          "type": "shape",
          "x": 0,
          "y": 0,
          "width": 960,
          "height": 540,
          "shapeType": "rectangle",
          "fill": "#3b82f6",
          "animations": [
            { "type": "enter", "effect": "fadeIn", "duration": 1.0, "params": { "fromOpacity": 0, "toOpacity": 1 } }
          ]
        },
        {
          "type": "text",
          "x": 80,
          "y": 160,
          "width": 800,
          "height": 80,
          "text": "Photosynthesis",
          "fontSize": 56,
          "color": "#ffffff",
          "animations": [
            { "type": "enter", "effect": "zoomIn", "startType": "afterPrev", "duration": 0.8, "params": { "fromScale": 0.5, "toScale": 1 } }
          ]
        }
      ]
    }
  ]
}
```

**Notes:**
- Do NOT generate `id` for elements or animations — the frontend will auto-assign them.
- Do NOT generate `name`, `rotation`, `opacity`, `visible`, `parentId`, `childrenId` — frontend fills defaults.
- `slides` array order determines the slide order in the presentation.

---

## API 2: Edit Single Page

### Request

```json
POST /api/edit
{
  "page": {
    "id": "page-xxx",
    "name": "Introduction",
    "elements": {
      "el-abc123": { "id": "el-abc123", "type": "text", "text": "Old title" }
    }
  },
  "instruction": "Change the title to 'Overview' and add a note at the bottom"
}
```

### Response

```json
{
  "elementsToAdd": [
    {
      "type": "text",
      "x": 60,
      "y": 460,
      "width": 840,
      "height": 40,
      "text": "Note: This section covers the basics.",
      "fontSize": 18,
      "color": "#6b7280"
    }
  ],
  "elementsToUpdate": [
    {
      "id": "el-abc123",
      "updates": { "text": "Overview" }
    }
  ],
  "elementsToRemove": []
}
```

**Notes:**
- `elementsToAdd`: New elements to append (same format as generate, no `id` needed).
- `elementsToUpdate`: Modify existing elements by `id`. `updates` contains partial fields.
- `elementsToRemove`: Array of existing element `id`s to delete.
