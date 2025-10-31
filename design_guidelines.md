# BundLink Design Guidelines

## Design Approach

**System Selection**: Material Design 3 with government customization
- **Rationale**: Government services require clarity, accessibility, and trust. Material Design provides robust accessibility patterns, clear visual hierarchy, and established interaction models that work across diverse user groups.
- **Adaptation**: Incorporate trust indicators (verification badges, official seals), enhanced security visual language, and conservative color application suited for public sector credibility.

## Typography

**Font Families**:
- Primary: Inter (via Google Fonts) - exceptional legibility, professional, extensive language support including German characters
- Monospace: JetBrains Mono - for short codes, API keys, technical data

**Type Scale**:
- H1 (Hero/Page Titles): 48px / font-bold / leading-tight
- H2 (Section Headers): 36px / font-semibold / leading-tight
- H3 (Card/Component Titles): 24px / font-semibold / leading-snug
- H4 (Subsections): 20px / font-medium / leading-snug
- Body Large: 18px / font-normal / leading-relaxed (for critical instructions)
- Body: 16px / font-normal / leading-relaxed (default text)
- Body Small: 14px / font-normal / leading-relaxed (metadata, captions)
- Code/Short URLs: 16px / font-mono / tracking-wide

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Micro spacing (buttons, form fields): p-2, p-4
- Component spacing: p-6, p-8, gap-6
- Section spacing: py-12, py-16, py-20
- Container max-widths: max-w-7xl for dashboards, max-w-4xl for forms, max-w-prose for text content

**Grid System**:
- Admin Dashboard: 12-column grid with sidebar navigation (250px fixed width)
- Forms/Create Link: Single column centered layouts with max-w-2xl
- Analytics: 3-4 column responsive grids for metric cards
- Link Preview Pages: Centered single column max-w-3xl

## Component Library

### Navigation & Structure

**Admin Sidebar Navigation**:
- Fixed left sidebar with hierarchical menu structure
- Top section: Logo + user profile with role badge (Federal/State/Local)
- Menu items with icons (dashboard, create link, analytics, settings)
- Clear active state with subtle left border accent
- Collapsible for mobile with hamburger menu

**Citizen-Facing Header**:
- Centered horizontal layout with official government logo
- Clear "Vertrauenswürdiger Bundeslink" (Trusted Federal Link) badge
- Minimal navigation - focus on trust and destination clarity

### Core Components

**Link Creation Form**:
- Large, clear input fields with helper text
- Real-time URL validation with inline feedback
- Custom alias field with availability checker
- Expiration date picker with calendar interface
- Advanced options accordion (geographic routing, language detection)
- Prominent "Link erstellen" (Create Link) primary button

**Link Cards (Dashboard)**:
- Card-based layout with clear visual hierarchy
- Top: Short URL in monospace with one-click copy button
- Middle: Destination URL (truncated) with expand icon
- Bottom row: Creation date, click count, status badge (active/expired)
- Action menu (edit, QR code, analytics, delete) on right
- Verification badge showing agency that created it

**Link Preview Page** (Citizen-facing):
- Large verification badge at top (official seal graphic)
- Clear headline: "Sie werden weitergeleitet zu:" (You will be redirected to:)
- Destination URL displayed prominently in bordered container
- Agency information card with logo and name
- Trust indicators: SSL badge, creation date, last verified date
- Two action buttons: "Fortfahren" (Continue - primary) and "Abbrechen" (Cancel - secondary)
- Link to report suspicious activity at bottom

**QR Code Display**:
- Large, high-contrast QR code centered
- Download options below (PNG, SVG, PDF formats as buttons)
- Size selector (small, medium, large) with live preview
- Embedded accessibility info indicator
- Print-optimized layout option

**Analytics Dashboard Cards**:
- Metric cards in 4-column grid: Total Clicks, Active Links, Click Rate, Geographic Distribution
- Large numbers (32px bold) with trend indicators (↑ 12%)
- Time period selector (24h, 7d, 30d, all time) as pill buttons
- Charts: Line graph for clicks over time, bar chart for geographic distribution, pie chart for device types
- Privacy notice: "Anonymisierte Daten gemäß GDPR" (Anonymized data per GDPR)

**Bulk Link Generator**:
- CSV upload zone with drag-and-drop
- Template download link
- Progress bar during generation
- Results table with success/error status per row
- Export generated links as CSV

### Forms & Inputs

**Text Inputs**:
- Large click targets (min-height: 44px for accessibility)
- Clear labels positioned above inputs
- Placeholder text in lighter shade for examples
- Border emphasis on focus with smooth transition
- Error states with red border and error message below
- Success states with green checkmark icon

**Buttons**:
- Primary: Solid fill, medium font-weight, px-6 py-3, rounded-lg
- Secondary: Outlined with border, same padding
- Text/Ghost: No border, subtle hover background
- Icon buttons: Square 44px minimum, centered icon
- Loading states with spinner icon
- Disabled state with reduced opacity

**Date/Time Pickers**:
- Calendar popup with clear month/year navigation
- Today button for quick selection
- Selected date highlighted
- Time selector for expiration with hour:minute format

### Data Display

**Tables** (Link Management):
- Striped rows for readability
- Sticky header on scroll
- Sortable columns with arrow indicators
- Inline actions (edit, delete) with icon buttons
- Pagination at bottom with page number display
- Empty state with illustration and "Create your first link" CTA

**Status Badges**:
- Pill-shaped with subtle background
- Active (green), Expired (gray), Scheduled (blue), Reported (red)
- Icon prefix for colorblind accessibility

**Copy-to-Clipboard Elements**:
- Monospace display of URL
- Copy icon button on right
- Success feedback (checkmark + "Kopiert!" tooltip) on click

### Accessibility Components

**Keyboard Navigation Indicators**:
- Visible focus rings with 2px offset
- Skip to main content link at top
- Tab order follows logical flow
- Focus trap in modals

**Screen Reader Elements**:
- ARIA labels for icon-only buttons
- Live regions for dynamic content updates
- Descriptive alt text for verification badges
- Form field associations with proper labeling

**High Contrast Mode Support**:
- Border outlines maintained in high contrast
- Text remains readable
- Focus indicators enhanced
- Icons supplemented with text labels

### Trust & Security Elements

**Verification Badges**:
- Official government seal icon (stylized)
- "Verifiziert" (Verified) text with checkmark
- Hover tooltip showing issuing agency
- Positioned prominently on link preview pages

**Security Indicators**:
- SSL lock icon with "Sichere Verbindung" (Secure Connection)
- BSI certification badge in footer
- Last security audit date display
- Privacy policy link always accessible

## Images

**Logo/Brand Assets**:
- German government logo (stylized coat of arms) in header - use as SVG for crisp rendering at all sizes
- Position: Top left of admin sidebar, centered on citizen-facing pages
- Size: 40px height in admin, 60px on landing pages

**Verification Badge Graphics**:
- Official seal/emblem design for trust indicators
- Use as inline SVG with customizable colors
- Positioned next to agency names and on preview pages

**Empty State Illustrations**:
- Minimal line-art illustrations for "No links created yet" states
- Dashboard empty state: Illustration of link chain or QR code
- Size: 200px x 200px, centered above empty state text

**Error/Success Graphics**:
- Success checkmark: Circular green icon for confirmations
- Error alert: Triangle with exclamation for warnings
- 48px icons centered in modal dialogs

**No Hero Image**: This is a utility-focused government service. Hero images would distract from core functionality. Landing pages use large typography, verification badges, and clear value propositions instead of imagery.

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: None - instant loads for clarity
- Button interactions: Subtle scale on press (0.98x)
- Loading states: Simple spinner rotation
- Form validation: Smooth border color transition (200ms)
- Dropdown menus: Fade-in with slight downward motion (150ms)
- Tooltips: Fade-in only (100ms)
- Success/Error messages: Slide-in from top (300ms ease-out)

**Explicitly Avoid**: Parallax scrolling, decorative animations, carousel auto-play, elaborate page transitions