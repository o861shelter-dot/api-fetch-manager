---
name: API Fetch Manager
colors:
  surface: '#0e1510'
  surface-dim: '#0e1510'
  surface-bright: '#343b36'
  surface-container-lowest: '#09100b'
  surface-container-low: '#161d19'
  surface-container: '#1a211c'
  surface-container-high: '#242c27'
  surface-container-highest: '#2f3631'
  on-surface: '#dde4dd'
  on-surface-variant: '#bbcabe'
  inverse-surface: '#dde4dd'
  inverse-on-surface: '#2b322d'
  outline: '#869489'
  outline-variant: '#3d4a41'
  surface-tint: '#51df9c'
  primary: '#60eca8'
  on-primary: '#003822'
  primary-container: '#3ecf8e'
  on-primary-container: '#005434'
  inverse-primary: '#006c45'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b4b4'
  tertiary: '#ffc7ae'
  on-tertiary: '#561f00'
  tertiary-container: '#ffa072'
  on-tertiary-container: '#78350f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#71fcb6'
  primary-fixed-dim: '#51df9c'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#76330d'
  background: '#0e1510'
  on-background: '#dde4dd'
  surface-variant: '#2f3631'
  bg-light: '#ffffff'
  bg-dark: '#1c1c1c'
  bg-subtle-dark: '#202020'
  bg-elevated-dark: '#242424'
  border-light: '#dfdfdf'
  border-dark: '#2a2f37'
  text-muted-light: '#707070'
  text-muted-dark: '#9aa0a6'
  danger: '#dc2626'
  success: '#16a34a'
  warning: '#d97706'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  headline-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
  body-base:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '300'
    lineHeight: 14px
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  gutter: 16px
  sidebar-width: 220px
  topbar-height: 48px
  row-height-sm: 32px
---

## Brand & Style

The design system for the API Fetch Manager is built on a **High-Density Corporate** aesthetic tailored specifically for developers and power users. The personality is utilitarian, precise, and professional, prioritizing information density over decorative whitespace.

### Design Principles
- **Developer-Centric:** Uses monospaced fonts for data, syntax highlighting for placeholders, and keyboard-friendly interactions.
- **High Information Density:** Small base font sizes (13px) and tight spacing (4px scale) allow for complex data management without excessive scrolling.
- **Professional Precision:** Sharp-ish corners and thin font weights (300-400) create a sophisticated, lightweight feel that reduces visual fatigue during long sessions.
- **Visual Feedback:** Every action is reinforced with tooltips, state changes, and explicit confirmations for destructive operations.

### Visual Style
- **Minimalism with Purpose:** Content-focused layout using subtle borders rather than heavy shadows to define structure.
- **Systematic:** A strict grid and token-driven approach ensure consistency across complex multi-pane layouts and dynamic tabs.

## Colors

The palette is centered around **Emerald (#3ecf8e)** as the sole chromatic brand color, used for primary actions, highlights, and active states. 

### Color Logic
- **Primary Contrast:** A signature brand rule is that text on primary-colored elements (buttons, badges) must be **Near-Black (#171717)**, never white, to maintain a distinct, high-end technical look.
- **Functional Grays:** The system uses a tiered background approach (`bg`, `bg-subtle`, `bg-elevated`) to create depth without relying on heavy shadows.
- **Semantic Feedback:** Standard red (Danger), green (Success), and amber (Warning) are used sparingly for status indicators and destructive confirmation steps.
- **Placeholder Highlight:** References to variables or credentials in text fields use the Primary color at 8% alpha to guide the eye without breaking legibility.

## Typography

Typography is designed for maximum legibility in data-heavy environments. The primary typeface is **Inter**, utilized mostly in its thinner weights (300 and 400) to maintain a clean, "un-bulky" appearance.

### Hierarchy Rules
- **Base Size:** The standard interface size is 13px. 
- **Data Tables:** Use 12px for table rows to increase the number of visible records.
- **Monospaced Content:** For code blocks, URL templates, and JSON payloads, use **JetBrains Mono** or a similar monospaced font at 12px.
- **Weights:** Use 300 (Thin) for secondary labels and 400 (Normal) for standard text. 500 (Medium) is reserved strictly for headlines and emphasized active states.

## Layout & Spacing

This design system uses a strict **4px scaling system**. All margins, paddings, and component heights must be multiples of 4.

### Layout Model
- **Core Structure:** A fixed-width Sidebar (220px) paired with a Topbar (48px). The main content area has a `max-width` of 1200px but expands to fill available width on larger screens.
- **Responsive Behavior:** 
  - **Desktop:** Multi-pane layouts (side-by-side editor and docs). 
  - **Mobile (<768px):** The Sidebar converts to a drawer, and tables reflow into card-based lists.
- **Component Density:** Tables use a compact 32px row height. Use `--sp-2` (8px) or `--sp-3` (12px) for internal container padding to maintain the high-density professional feel.

## Elevation & Depth

Visual hierarchy is primarily established through **Tonal Layering** and **Low-Contrast Outlines** rather than physical elevation metaphors.

- **Layering:** Backgrounds move from darker/flatter (`bg`) to lighter/more prominent (`bg-elevated`) as they surface toward the user.
- **Shadows:** Used only for floating overlays (Modals and Tooltips). Modals use a wide, diffused shadow (`0 8px 32px rgba(0,0,0,.24)` in dark mode) to separate them from the complex background UI.
- **Borders:** All containers and UI elements are defined by 1px borders using `--border` colors. This reinforces the "grid-like" technical feel of the application.
- **Overlays:** A semi-transparent backdrop (`--overlay`) is used behind modals to dim the underlying dashboard and maintain focus.

## Shapes

The shape language is **Square-ish**. It avoids high-radius "pill" shapes or overly organic curves to maintain a structured, engineering-focused look.

- **Base Radius:** 6px for inputs and small buttons.
- **Medium Radius:** 8px for cards and containers.
- **Large Radius:** 12px for Modals and major panel containers.
- **Checkboxes:** Use a slight 2px radius to avoid a perfectly sharp look while remaining professional.

## Components

### Buttons
- **Primary:** Emerald background with #171717 text. Height 30px.
- **Secondary/Ghost:** Bordered or transparent with primary-colored text/icon.
- **Requirements:** Every button MUST include an icon (Lucide set, 1.5 stroke) and a mandatory tooltip via `data-tooltip` explaining the action.

### DataList (Table/Card)
- The universal component for all lists. 
- **Features:** Must include multi-column sort, fuzzy filtering, and export controls (JSON, CSV, PDF) in the top-right toolbar.
- **Masking:** Sensitive values (tokens, credentials) are masked by default. Include an "Eye" icon button that triggers a confirmation modal before revealing the data.

### Modals
- Width: `min(560px, 100%)`. Max-height: `90vh`.
- Structure: Header (Title + Close X), Body (auto-scroll), Footer (Right-aligned actions).
- Interaction: ESC to close; click-outside does NOT close to prevent data loss in complex forms.

### Tooltips
- Global, fixed-position tooltips that automatically flip or clamp within the viewport to avoid being cut off at screen edges.

### Fetch Builder (Multi-pane)
- **Steps:** Draggable list items with method badges (GET, POST, etc.).
- **Editor:** URL fields with autocomplete for `{{variable}}` syntax. Placeholders must be visually highlighted using the brand emerald at low opacity.

### Status Bar
- Located at the bottom of the viewport. Displays Git commit hash (link), build time, current environment, and active Owner context.