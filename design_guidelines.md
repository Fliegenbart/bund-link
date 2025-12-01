# BundLink Design Guidelines

## Design Approach

**System Selection**: Apple-Inspired Minimalist Design for Government Services
- **Rationale**: Apple's design language is renowned for its clarity, elegance, and user-focus. For government services, this translates to trustworthy, professional interfaces that feel modern yet accessible.
- **Adaptation**: Clean typography, generous whitespace, subtle shadows, refined color palette, and smooth interactions that convey professionalism and reliability.

## Core Design Principles

1. **Clarity**: Every element serves a purpose. Remove visual clutter.
2. **Deference**: The interface recedes to let content shine.
3. **Depth**: Subtle shadows and layers create visual hierarchy.
4. **Consistency**: Unified component styles across all pages.
5. **Accessibility**: BITV 2.0 compliant with clear focus states.

## Typography

**Font Families**:
- Primary: -apple-system, BlinkMacSystemFont, SF Pro Display (system fonts for native feel)
- Fallback: Inter - exceptional legibility, professional, German character support
- Monospace: SF Mono, JetBrains Mono - for short codes, API keys, technical data

**Type Scale with Apple-style tracking**:
- H1 (Page Titles): 36px / font-semibold / tracking-tight (-0.025em)
- H2 (Section Headers): 30px / font-semibold / tracking-tight (-0.02em)
- H3 (Card Titles): 24px / font-semibold / tracking-tight
- H4 (Subsections): 20px / font-medium
- Body Large: 18px / font-normal / leading-relaxed
- Body: 16px / font-normal / leading-relaxed
- Body Small: 14px / font-normal / leading-relaxed
- Caption: 12px / font-normal / text-muted-foreground

## Color System

**Light Mode**:
- Background: Pure white (#FFFFFF) - 0 0% 100%
- Foreground: Near black (#1C1C1C) - 0 0% 11%
- Card: White (#FFFFFF) with subtle shadow
- Muted backgrounds: Very light gray (#F5F5F5) - 0 0% 96%
- Primary: Apple Blue (#007AFF) - 211 100% 50%
- Success: Green (#34C759) - 142 70% 45%
- Destructive: Red (#FF3B30) - 0 80% 60%

**Dark Mode**:
- Background: True black (#000000) - 0 0% 0%
- Foreground: Off-white (#FAFAFA) - 0 0% 98%
- Card: Dark gray (#121212) - 0 0% 7%
- Muted backgrounds: Charcoal (#1C1C1E) - 0 0% 12%
- Primary: Lighter Blue (#0A84FF) - 211 100% 55%

## Layout System

**Spacing Scale**:
- 4px (p-1) - Micro spacing
- 8px (p-2) - Tight spacing
- 16px (p-4) - Standard spacing
- 24px (p-6) - Component padding
- 32px (p-8) - Section spacing
- 48px (p-12) - Large section gaps

**Container Widths**:
- max-w-7xl: Main dashboard layouts
- max-w-4xl: Forms and create pages
- max-w-3xl: Content-focused pages
- max-w-2xl: Modal dialogs

**Grid System**:
- Sidebar: 20rem (320px) fixed width
- Main content: Flexible with max-width constraints
- Card grids: 4-column on desktop, 2 on tablet, 1 on mobile

## Component Library

### Cards

**Apple-Style Cards**:
- Background: `bg-card` (white in light, dark gray in dark)
- Border: None (`border-0`)
- Shadow: Subtle (`shadow-sm`)
- Border radius: Extra large (`rounded-2xl`)
- Padding: Generous (`p-6`)
- Hover: Slight lift with shadow increase

```jsx
<Card className="border-0 shadow-sm rounded-2xl">
```

### Buttons

**Primary Button**:
- Background: Primary blue with gradient feel
- Border radius: Large (`rounded-xl`)
- Height: 44px minimum (`h-11`)
- Shadow: Subtle glow (`shadow-sm shadow-primary/25`)
- Active: Scale down slightly

**Secondary/Outline Button**:
- Border: Subtle (`border-border/50`)
- Background: Transparent, muted on hover
- Same border radius and height as primary

```jsx
<Button className="rounded-xl h-11 px-5 shadow-sm">
```

### Inputs

**Text Inputs**:
- Background: Muted (`bg-muted/50`)
- Border: None when unfocused
- Border radius: Large (`rounded-xl`)
- Focus: White background with ring (`focus:bg-background focus:ring-2 focus:ring-primary/20`)
- Height: 44px minimum (`h-11`)

### Navigation

**Sidebar**:
- Background: Slightly off-white/dark (`bg-sidebar`)
- Border: None (uses shadow separation)
- Menu items: Rounded with subtle active state
- Active item: Primary color tint background (`bg-primary/10 text-primary`)
- Icons: 20px with color matching text

**Header Bar**:
- Height: 56px (`h-14`)
- Background: Semi-transparent with blur (`bg-background/80 backdrop-blur-xl`)
- Border: Very subtle bottom border (`border-b border-border/50`)
- Sticky positioning

### Status Indicators

**Badges**:
- Pill-shaped (`rounded-full`)
- Subtle background tints (green/10, red/10, blue/10)
- Matching text color (green-600, red-600)
- Small icon prefix for accessibility

**Success State**:
- Background: `bg-green-500/10`
- Text: `text-green-600 dark:text-green-400`
- Icon: CheckCircle

**Error State**:
- Background: `bg-red-500/10`
- Text: `text-red-600 dark:text-red-400`
- Icon: XCircle

### Icons

**Icon Style**:
- Source: Lucide React icons
- Sizes: 16px (small), 20px (default), 24px (large)
- Stroke width: Default (2px)
- Color: Match surrounding text or use muted-foreground

**Icon Containers**:
- Circular or rounded square backgrounds
- Subtle color tints (`bg-primary/10`, `bg-green-500/10`)
- Size: 32-48px depending on context

## Shadows

**Shadow Scale** (Apple-style soft shadows):
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.04);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
```

## Animations & Transitions

**Timing**:
- Fast: 150ms (hover states, small interactions)
- Medium: 200ms (button presses, reveals)
- Standard: 300ms (modal opens, page transitions)

**Easing**: `ease` or `ease-out` for natural feel

**Hover Effects**:
- Cards: Subtle shadow increase, slight Y translation (`hover:shadow-md translateY(-1px)`)
- Buttons: Built-in elevation system
- Links: Opacity change or underline reveal

**Active/Press Effects**:
- Buttons: Scale down (`transform: scale(0.98)`)
- Cards: Very subtle scale if clickable

## Special Effects

**Glass Morphism** (use sparingly):
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
}
```

**Gradients**:
- Primary button glow: `bg-gradient-to-br from-primary to-primary/80`
- CTA sections: `bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5`
- Logo container: Subtle gradient with shadow

## Accessibility

**Focus States**:
- Ring style: `focus:ring-2 focus:ring-primary/20`
- Visible on all interactive elements
- High contrast in both light and dark modes

**Color Contrast**:
- All text meets WCAG AA standards
- Icons paired with text labels where needed
- Status colors include icon indicators for colorblind users

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Generous padding on buttons and links

## Page-Specific Guidelines

### Dashboard
- Stats cards in 4-column grid with colored icon containers
- Links table with clean rows, minimal borders
- Search input with icon prefix, rounded style
- Prominent "Create Link" button in header

### Create Link
- Single column form layout
- Cards for grouped form sections
- Large, clear labels
- Accordion for advanced options
- Sticky action buttons at bottom

### Landing Page
- Full-width sections with generous vertical padding
- Large, impactful headline with gradient text
- Feature cards in 3-column grid
- CTA section with subtle gradient background
- Minimal, clean footer

### Bulk Upload
- Step-by-step card layout with numbered indicators
- Drag-and-drop zone with dashed border
- Progress indicators during processing
- Results display with success/error states
