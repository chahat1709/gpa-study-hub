# Current UI/UX Design Research — GPA Study Hub

## Source 1 — SaaSUI.Design, “7 SaaS UI Design Trends in 2026”

URL: https://www.saasui.design/blog/7-saas-ui-design-trends-2026

Key findings relevant to GPA Study Hub:

- Calm design is a current production pattern: reduce cognitive overload, show only what is needed for the active workflow, hide advanced settings behind progressive disclosure, use whitespace as a functional tool, and let typography carry hierarchy.
- AI is increasingly treated as infrastructure rather than a loudly branded feature. Useful patterns include contextual inline assistance, automatic classification/tagging, natural-language commands, and AI drafts presented as starting points rather than opaque outputs.
- Command palettes and unified search are becoming a standard way to scale feature-rich products. A strong implementation supports Ctrl/Cmd+K, combines navigation and actions, shows recent items by default, tolerates fuzzy search, and supports keyboard navigation.
- Role-based and adaptive interfaces, progressive disclosure, emotional design used sparingly, and strategic minimalism are presented as durable patterns for reducing friction.

## Source 2 — Figma, “Top Web Design Trends for 2026”

URL: https://www.figma.com/resource-library/web-design-trends/

Key findings relevant to GPA Study Hub:

- 2026 web design mixes immersive depth, experimental navigation, vibrant color, bold typography, dark mode, motion, gamification, and accessibility/sustainability considerations.
- These are trend families, not instructions to use all of them. For a student productivity workspace, durable choices should be prioritized over decorative novelty.
- Bold typography can create clear hierarchy; dark mode is an established baseline; motion should support feedback and orientation; gamification may be useful for study progress but should not distract from academic tasks.
- The source explicitly places accessibility and inclusion alongside visual trends, so contrast, readability, keyboard support, and reduced motion should remain foundational.

## Design decision for the next GPA Study Hub pass

The next redesign should not imitate a generic neon-glass dashboard or a decorative 3D landing page. It should use a high-contrast editorial/productivity system with one clear daily objective, quiet chrome, strong typography, visible progress, contextual AI assistance, a command/search surface, role-aware navigation, and progressive disclosure for secondary tools. Any vibrant color or motion should be reserved for status, focus, and feedback.

## Source 3 — W3C, Web Content Accessibility Guidelines 2.2

URL: https://www.w3.org/TR/WCAG22/

Key findings:

- WCAG 2.2 AA requires normal text and images of text to achieve at least a 4.5:1 contrast ratio; large text requires at least 3:1.
- The guidance explicitly covers contrast, text resize, reflow, non-text contrast, content on hover/focus, keyboard access, and target-size-related interaction requirements.
- The redesign should not rely on color alone for status, should keep focus indicators visible, and should keep interactive targets comfortable on touch devices.

## Source 4 — Material Design 3, Layout overview

URL: https://m3.material.io/foundations/layout/layout-overview

Key findings:

- Adaptive layout is a foundation-level concern, not a late responsive patch. Layout should adapt to window size classes and device context.
- Navigation and content structure should change intentionally across mobile, tablet, and desktop rather than only shrinking dimensions.
- The next GPA Study Hub pass should use a canonical adaptive layout: compact mobile navigation, a stable tablet composition, and a richer desktop workspace with bounded content width.

## Updated design direction

The next pass should combine calm, editorial productivity UI with a distinctive academic identity: a warm paper-like content surface, a dark ink shell, a single high-chroma study accent, disciplined typography, a command/search entry point, contextual AI suggestions, and adaptive layouts based on task importance rather than device size alone. Decorative gradients, large empty hero art, generic glass cards, and constant animation should be avoided.

## Browser review of Ink & Highlight build

The refreshed production build now shows a light editorial workspace: deep ink-blue desktop rail, warm paper canvas, cobalt primary action, lime progress/status accent, bounded dashboard content, and a visible Search or jump to… entry point in the top bar. The dashboard reads as a focused daily workspace rather than a decorative hero page. The main Exam Hub action is visually dominant, attendance is a compact eligibility card, and secondary tools are grouped into four next-action tiles.

The browser preview also confirmed the sidebar, topbar, command trigger, responsive dashboard tabs, and the new action hierarchy render together without the previous oversized-logo defect.

The command palette was tested in-browser. It opens from the desktop topbar, focuses its search field, filters live by query, and reduces “exam” to the relevant Prepare for an exam action. This follows the current pattern of combining navigation and actions in one searchable surface rather than adding more persistent sidebar items.
