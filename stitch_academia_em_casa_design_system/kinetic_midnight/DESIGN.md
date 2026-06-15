---
name: Kinetic Midnight
colors:
  surface: '#0f1320'
  surface-dim: '#0f1320'
  surface-bright: '#353947'
  surface-container-lowest: '#0a0e1a'
  surface-container-low: '#171b28'
  surface-container: '#1b1f2d'
  surface-container-high: '#262937'
  surface-container-highest: '#303443'
  on-surface: '#dfe1f4'
  on-surface-variant: '#ddc1b3'
  inverse-surface: '#dfe1f4'
  inverse-on-surface: '#2c303e'
  outline: '#a48c7f'
  outline-variant: '#564338'
  surface-tint: '#ffb68d'
  primary: '#ffb68d'
  on-primary: '#532200'
  primary-container: '#ff8c42'
  on-primary-container: '#6a2d00'
  inverse-primary: '#9b4500'
  secondary: '#44dafa'
  on-secondary: '#003640'
  secondary-container: '#00bedd'
  on-secondary-container: '#004855'
  tertiary: '#75dc85'
  on-tertiary: '#003913'
  tertiary-container: '#59bf6c'
  on-tertiary-container: '#004a1b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68d'
  on-primary-fixed: '#331200'
  on-primary-fixed-variant: '#763300'
  secondary-fixed: '#aaedff'
  secondary-fixed-dim: '#40d8f7'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#91f99e'
  tertiary-fixed-dim: '#75dc85'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531f'
  background: '#0f1320'
  on-background: '#dfe1f4'
  surface-variant: '#303443'
typography:
  timer-display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.0'
    letterSpacing: -1px
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 35px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.5px
  headline-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '800'
    lineHeight: '1.5'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13.5px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11.5px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: 1px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 560px
  container-tv: 900px
  gutter: 16px
  stack-gap: 14px
  element-gap: 8px
---

## Brand & Style

The brand personality is **high-energy, immersive, and gamified**. It is designed to transform a domestic living room into a focused "workout zone" by stripping away environmental distractions. The aesthetic leans heavily into a **Modern Corporate-Gamer fusion**, utilizing an "Atmospheric Dark Mode" that feels like a premium sports console or an elite athletic cockpit.

The emotional response should be one of **active focus and physical urgency**. By pairing deep, nocturnal foundations with neon-vibrant interactive accents, the UI signals that it is time to move. The design system prioritizes **extreme physical accessibility**, ensuring that even from 10 feet away during high-intensity movement, the interface remains legible and the primary actions are unmistakable. 

Key visual pillars include:
- **Immersive Depth:** Layered midnight blues that create a focused, distraction-free environment.
- **Kinetic Accents:** High-luminance oranges and greens that pierce the dark canvas to signal action.
- **Athletic Presence:** Massive typographic weights and oversized touch targets that feel sturdy and reliable.

## Colors

The palette is functional and high-contrast, designed for legibility in varied lighting conditions. 

- **Primary (Vivid Energy Orange):** Used for core brand identity, primary actions, and active countdown states. 
- **Secondary (Electric Oxygen Blue):** Reserved for rest periods, information cycles, and recovery phases.
- **Tertiary (Neon Vitality Green):** Signifies success, completion, and positive progress.
- **Neutral (Midnight Foundation):** A deep space-blue background hierarchy (`#0f1320` to `#1d2440`) replaces stark black to maintain a premium, athletic feel.
- **Danger (Critical Pulse Red):** Specifically reserved for the final 3 seconds of high-intensity intervals to trigger a physiological "final push" response.

Gradients should be used on primary CTAs, transitioning at 135 degrees from `primary` to `accent-lava`.

## Typography

The system uses **Hanken Grotesk** for its sharp, contemporary, and athletic feel. The hierarchy is dominated by heavy weights (700–900) to ensure readability during movement.

**Key Rules:**
- **Numerical Data:** All timers and counters must use `font-variant-numeric: tabular-nums` to prevent horizontal jitter during active countdowns.
- **The "TV Scale":** For the "Modo TV" experience, headlines scale up by ~40% to accommodate users standing 6–10 feet away.
- **Readability:** Maintain a generous line-height (1.5) for lists of exercises to assist rapid eye-tracking.
- **Hierarchy:** Use `label-caps` for categorical headers to provide a geometric, organized structure to data-heavy screens.

## Layout & Spacing

This design system uses a **Fluid Mobile-First Envelope**. The interface is constrained to a centered vertical column with a maximum width of 560px. This "app-like" constraint ensures that critical workout data is never lost in the periphery of a wide desktop screen.

**Responsive Principles:**
- **Mobile:** 16px side margins with a single-column vertical stack.
- **Modo TV (Breakpoints > 700px):** The container expands to 900px. Component internal padding and font sizes increase by 40% to maintain visual impact from a distance.
- **Vertical Rhythm:** Components are separated by a standard 14px gap (`stack-gap`) to maintain a tight, energetic density without feeling cluttered.
- **Entry Motion:** New screens should utilize a subtle 8px vertical slide-up with a 0.25s fade-in to reinforce the feeling of a modern, responsive application.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Layer 0 (Root):** `#0f1320` — The deepest background.
- **Layer 1 (Containers/Inputs):** `#181e31` — Used for secondary elements and recessed interactive areas.
- **Layer 2 (Cards):** `#1d2440` — The primary surface for content modules.
- **Boundaries:** All elevated elements are defined by a 1px solid border of `#2c3558`. This "hairline steel" border provides structure without adding visual bulk.
- **Active Glow:** Only primary buttons or active timers may use an ambient shadow (e.g., `rgba(255, 107, 53, 0.35)`) to simulate a neon glow, indicating they are the current focus of the "workout cockpit."

## Shapes

The design system utilizes **Rounded** (0.5rem base) corner logic to strike a balance between friendly approachability and high-performance precision.

- **Small (6px):** Used for micro-elements like tags or indicator dots.
- **Medium (12px):** Standard for input fields and smaller selection chips.
- **Large (16px):** Primary cards and CTA buttons. 
- **Extra Large (20px):** Reserved for modals and the "Avatar Box" viewport to create a distinct frame for movement demonstrations.
- **Full (9999px):** Used for progress bars and circular timer rings.

## Components

### Buttons
- **Primary:** High-impact gradient (`primary` to `accent-lava`), 18px vertical padding, weight 800. Must scale down to 0.97 on tap for tactile feedback.
- **Secondary:** Surface color (`#181e31`) with a steel border. Used for navigation and optional actions.
- **Tertiary:** Frameless text-only buttons in `text-muted` for "Back" or "Cancel" actions.

### Inputs & Selection
- **Form Fields:** Use `#181e31` background. Focus states must trigger a 2px `primary` outline, with the 1px border becoming transparent to maintain visual cleanliness.
- **Level Selection:** Interactive chips that use a 14% opacity `primary` tint background when selected to indicate an "Active/Energized" state.

### Cards
- **Standard:** `#1d2440` background with a 1px `#2c3558` border. 16px internal padding.
- **Active Program:** Can utilize a subtle diagonal gradient backdrop (10% opacity `secondary` to 8% opacity `tertiary`) to differentiate progressive milestones from standard content.

### Status & Progress
- **Countdown Timer:** Layered SVG circles. The background ring uses `background-elevated`, while the foreground ring uses the `primary` color (switching to `secondary` for breaks and `status-danger` for final seconds).
- **Progress Bars:** 6px height. The fill should be a linear gradient from `primary` to `tertiary`, visually representing the transition from "Starting Energy" to "Goal Completion."

### Feedback
- **Modals:** Use an 80% opacity veil (`#080a12`). The modal container should be centered with 20px padding and a maximum width of 420px.