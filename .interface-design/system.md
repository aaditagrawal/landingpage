# Design System: The Builder

## Who This Is For

Aadit Agrawal: Undergrad who architects HPC clusters. Head Student Researcher.
Founding President. Runs 70+ self-hosted services. Ships at scale (5K+ DAU).

This isn't a "creative developer" portfolio. This is an infrastructure builder
who also makes films and takes photographs. The technical depth is primary.

## The Soul

**The numbers are the design.** 5,000+. 150K+. 70+. 98%. 4 years.
These are earned metrics. Display them with the prominence they deserve.

**Depth over breadth.** Don't list "Python, TypeScript" - show the actual depth:
CUDA, vLLM, NCCL, MPI. This isn't a bootcamp grad. This is HPC infrastructure.

**Quiet confidence.** Let the work speak. No exclamation marks. No "passionate about."
State facts. The facts are impressive enough.

## Typography

Three distinct voices:

| Voice | Font | Use |
|-------|------|-----|
| Display | Geist Sans, 600 | Name, section titles |
| Data | JetBrains Mono | Numbers, metrics, code |
| Body | Inter | Paragraphs, descriptions |

**Type Scale:**
- Name: 56px, weight 600, tracking -0.03em
- Stats: 32px mono, weight 500
- Section: 13px, weight 600, uppercase, tracking 0.1em
- Body: 16px, weight 400, line-height 1.65
- Meta: 14px mono, muted

## Color

```css
:root {
  --bg: #0a0a0a;
  --bg-elevated: #111111;

  --fg: #fafafa;
  --fg-muted: #a1a1aa;
  --fg-faint: #52525b;

  --accent: #e8b4b4;
  --accent-dim: #c49999;

  --border: #1f1f1f;
  --border-hover: #2a2a2a;
}
```

The pink accent provides warmth/humanity in a technical context.
Used sparingly: hover states, the status dot, selection.

## Layout

- Width: 860px max (wider than typical - information density)
- Top padding: 120px (let it breathe at top)
- Section gaps: 80px
- Grid: Metrics in a 4-column row

## Information Architecture

1. **Header**: Name + roles (Researcher at CASIR, President of PRISM)
2. **Metrics**: The impressive numbers, displayed prominently
3. **About**: One paragraph. Specific, not generic.
4. **Currently**: Brief status (what you're building now)
5. **Featured Work**: Projects with real descriptions and real metrics
6. **Expertise**: Organized by domain, showing depth
7. **Creative**: The other side - blog, photos, film, design
8. **Elsewhere**: GitHub, LinkedIn, email

## Craft Details

- Metric numbers: JetBrains Mono, tabular figures
- Metric labels: Small, muted, below the number
- Links: Custom underline animation (scales from right to left)
- Project cards: Subtle border, border lightens on hover
- Section labels: Small caps feel, muted, above content
- Status dot: Accent color, subtle pulse

## What Not To Do

- Don't use generic copy ("passionate about technology")
- Don't list skills as badges
- Don't hide the numbers
- Don't center everything
- Don't use bouncy animations
- Don't add decoration for decoration's sake
