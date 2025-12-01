# BundLink Design Guidelines

## Design Philosophy: Apple + Vestas CI Hybrid

This design system blends Apple's renowned minimalist aesthetic with Vestas's corporate identity, creating a modern, trustworthy interface for German government services.

### Core Principles

1. **Refined Minimalism**: Clean layouts with purposeful whitespace
2. **Danish Simplicity**: Understated elegance inspired by Scandinavian design
3. **Corporate Trust**: Deep navy blue conveys authority and reliability
4. **Precision Typography**: Tighter letter-spacing for premium feel
5. **Subtle Depth**: Soft shadows with blue-tinted undertones

---

## Color Palette

### Primary Colors

**Vestas Blue** (Primary Brand Color)
- Light Mode: `hsl(211, 76%, 26%)` - #104277
- Dark Mode: `hsl(211, 76%, 45%)` - Brightened for visibility
- Usage: Primary buttons, active states, links, brand elements

### Neutral Colors

**Backgrounds**
- Light: Pure white `hsl(0, 0%, 100%)` - #FFFFFF
- Dark: Near black with blue tint `hsl(211, 20%, 4%)`

**Text**
- Light Mode: `hsl(211, 20%, 12%)` - Deep charcoal with slight blue
- Dark Mode: `hsl(211, 10%, 95%)` - Off-white

**Surfaces (Cards, Panels)**
- Light: White with soft blue-tinted shadows
- Dark: `hsl(211, 20%, 8%)` - Elevated dark surface

### Status Colors

| Status | Light Mode | Dark Mode |
|--------|------------|-----------|
| Success | `hsl(152, 69%, 31%)` emerald | `hsl(152, 65%, 40%)` |
| Error | `hsl(0, 72%, 51%)` red | `hsl(0, 72%, 55%)` |
| Warning | `hsl(32, 95%, 44%)` amber | `hsl(32, 90%, 55%)` |
| Info | Primary Blue | Primary Blue (brightened) |

---

## Typography

### Font Stack

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", "JetBrains Mono", Menlo, Monaco, monospace;
```

### Type Scale with Apple-style Tracking

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| H1 | 44-64px | 600 | -0.028em |
| H2 | 32-40px | 600 | -0.024em |
| H3 | 18-24px | 600 | -0.020em |
| Body | 15-17px | 400 | -0.011em |
| Caption | 11-13px | 400-500 | normal |
| Labels | 10-12px | 600 | 0.06-0.08em (uppercase) |

### Text Hierarchy

- **Primary text**: Full foreground color for headlines and key content
- **Secondary text**: Muted foreground for supporting text
- **Tertiary text**: 60% opacity muted foreground for captions

---

## Spacing System

### Base Unit: 4px

| Name | Value | Usage |
|------|-------|-------|
| 2xs | 2px | Micro gaps |
| xs | 4px | Icon margins |
| sm | 8px | Tight spacing |
| md | 12px | Component internal |
| base | 16px | Standard padding |
| lg | 20px | Section padding |
| xl | 28px | Large gaps |
| 2xl | 40px | Section margins |

### Container Widths

- **max-w-7xl**: Dashboard layouts, full-width content
- **max-w-5xl**: Hero sections, centered content
- **max-w-4xl**: Forms, create pages
- **max-w-3xl**: CTA sections, dialogs
- **max-w-xs**: Search inputs, small forms

---

## Component Specifications

### Cards

```
Border Radius: 18-20px (rounded-[18px])
Shadow: 0 2px 8px rgba(16, 66, 119, 0.05)
Border: None (border-0)
Background: bg-card
Hover: Shadow increase + slight Y translate
```

### Buttons

**Primary Button**
```
Height: 40-44px (h-10, h-11)
Border Radius: Full pill (rounded-full) or rounded-xl
Padding: px-5 to px-8
Font: 13-15px, medium weight
Shadow: shadow-sm shadow-primary/15
Active: scale(0.97)
```

**Secondary/Outline Button**
```
Border: 1.5px solid border color
Background: Transparent
Hover: bg-muted/50 or primary/6
```

**Icon Button**
```
Size: 32-36px square
Border Radius: rounded-[10px]
Background: Transparent or muted
```

### Inputs

```
Height: 40-44px (h-10, h-11)
Border Radius: Full pill (rounded-full) for search, rounded-xl for forms
Background: bg-muted/50
Border: None (border-0)
Focus: bg-background, ring-2 ring-primary/15
```

### Badges

```
Height: 18-22px
Border Radius: rounded-full
Font: 10-11px, semibold
Padding: px-2.5 py-0.5
Border: None (use background colors)
```

### Dropdowns/Popovers

```
Border Radius: 14px (rounded-[14px])
Shadow: Large with blur
Background: bg-popover/95 backdrop-blur-xl
Border: None
Item Radius: 10px (rounded-[10px])
Item Padding: py-2
```

---

## Navigation

### Sidebar

```
Width: 20rem (320px)
Background: bg-sidebar/50 (semi-transparent)
Border: None (border-r-0)
Logo Container: Vestas gradient, rounded-[12px]
Menu Items:
  - Height: 40px (h-10)
  - Border Radius: rounded-[10px]
  - Active: bg-primary/10 text-primary
  - Hover: bg-muted/50
  - Icon Size: 18px
  - Font: 13px
```

### Header Bar

```
Height: 56px (h-14)
Background: Glass effect (bg-background/70 backdrop-blur-xl)
Border: Very subtle bottom (border-b border-border/30)
Position: Sticky top
```

---

## Shadows

### Blue-Tinted Shadow System

Light mode shadows have subtle Vestas blue undertones:

```css
--shadow-sm: 0 2px 8px rgba(16, 66, 119, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow: 0 4px 12px rgba(16, 66, 119, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
--shadow-md: 0 8px 24px rgba(16, 66, 119, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03);
--shadow-lg: 0 16px 48px rgba(16, 66, 119, 0.10), 0 4px 12px rgba(0, 0, 0, 0.04);
```

Dark mode uses standard black shadows.

---

## Special Effects

### Glass Morphism

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
}

.dark .glass {
  background: rgba(16, 28, 44, 0.72);
}
```

### Vestas Gradient

```css
.vestas-gradient {
  background: linear-gradient(135deg, hsl(211 76% 26%), hsl(211 76% 35%));
}

.vestas-text-gradient {
  background: linear-gradient(135deg, hsl(211 76% 26%), hsl(211 65% 40%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Animation Guidelines

### Timing

- **Fast**: 150ms - Hover states, micro-interactions
- **Medium**: 200ms - Button presses, reveals
- **Standard**: 250-300ms - Modal opens, transitions

### Easing

Use `cubic-bezier(0.25, 0.1, 0.25, 1)` for smooth, Apple-like motion.

### Hover Effects

- Cards: Shadow increase + `translateY(-2px)`
- Buttons: Built-in elevation via existing system
- Links: Opacity transition

### Press Effects

- Buttons: `scale(0.97)` with quick transition
- Touch targets: Subtle press feedback

---

## Icon Guidelines

- **Source**: Lucide React
- **Default Size**: 18px for navigation, 16px for inline
- **Large Icons**: 20-24px for feature cards
- **Stroke Width**: Default (2px)
- **Color**: Match surrounding text or use `text-muted-foreground`
- **Icon Containers**: Rounded backgrounds with subtle color tints

---

## Accessibility

### Focus States

```css
focus:ring-2 focus:ring-primary/15
```

Visible, consistent focus rings on all interactive elements.

### Touch Targets

Minimum 40x40px for all interactive elements.

### Color Contrast

All text meets WCAG AA standards (4.5:1 for body text, 3:1 for large text).

### Motion

Respect `prefers-reduced-motion` for users sensitive to animations.

---

## Page Layouts

### Landing Page

- Full-width hero with gradient text
- 3-column feature grid
- Glass morphism header
- Minimal footer

### Dashboard

- 4-column stat cards grid
- Full-width table with rounded container
- Pill-shaped search input
- Floating action button

### Forms

- Single column, centered layout
- Grouped sections in cards
- Inline validation
- Sticky action buttons

### Detail Pages

- Two-column layout (content + sidebar)
- Tab navigation for sections
- Metric cards grid
