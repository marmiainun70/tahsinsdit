---
name: "Program Colors Palette"
description: "Standardized color palette for Tahsin Dasar, Tahsin Lanjutan, and Tahfizh programs across the application."
---

# UI Design System: Program Colors

Whenever generating or modifying UI components, charts, badges, or text related to the educational programs, you **MUST** strictly adhere to the following color standardization to maintain a consistent user experience:

## 1. Tahsin Dasar (TD)
- **Base Color**: Emerald (Hijau)
- **Hex Code**: `#10b981`
- **Tailwind Classes**: `bg-emerald-500`, `text-emerald-500`, `text-emerald-700`, `border-emerald-200`, `bg-emerald-50` (use appropriate shades depending on the context).

## 2. Tahsin Lanjutan (TL)
- **Base Color**: Amber (Kuning/Oranye)
- **Hex Code**: `#f59e0b`
- **Tailwind Classes**: `bg-amber-500`, `text-amber-500`, `text-amber-700`, `border-amber-200`, `bg-amber-50` (use appropriate shades depending on the context).

## 3. Tahfizh (TFZ)
- **Base Color**: Violet (Ungu)
- **Hex Code**: `#8b5cf6`
- **Tailwind Classes**: `bg-violet-500`, `text-violet-500`, `text-violet-700`, `border-violet-200`, `bg-violet-50` (use appropriate shades depending on the context).

## Rules
- **DO NOT** use default primitive colors like red (`rose-500`) or blue (`blue-500`) for program identities.
- If rendering charts (e.g., Recharts), use the exact Hex Code.
- If rendering UI elements (Badges, Progress Bars, Cards), use the Tailwind semantic classes.
