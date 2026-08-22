# GPA Study Hub — New UI/UX Direction

## Product idea

GPA Study Hub becomes an **academic command center**: a quiet, focused workspace that helps a student answer three questions immediately: what needs attention today, how am I progressing, and what is the fastest next action?

## Visual language

The new design intentionally moves away from heavy glassmorphism, decorative 3D effects, oversized glow, and dense neon gradients. It uses a deep ink canvas, warm paper-like raised surfaces, mint for progress and healthy states, coral for urgency, and violet only for AI-related actions. Surfaces should feel structured and tactile rather than ornamental.

## Experience principles

1. **Orient first.** Every screen has a compact title, context line, and one primary action.
2. **Prioritize next actions.** The dashboard emphasizes attendance risk, upcoming exams, deadlines, and quick study actions before secondary information.
3. **Reduce navigation load.** The primary navigation uses stable labels and consistent ordering. Secondary tabs stay within their feature area.
4. **Make status legible.** Use text plus color for online, offline, readiness, priority, and completion states.
5. **Design for the thumb.** Mobile controls use generous targets, a persistent bottom dock, short labels, and no hover-dependent meaning.
6. **Respect attention.** Motion is brief and purposeful. Important feedback uses toast or inline status; decorative movement is minimized.

## Layout model

Desktop uses a 248px navigation rail and a centered content column with a contextual top bar. The dashboard uses a two-column structure: a primary “today” column and a secondary progress/notice column. Feature pages reuse the same title row, segmented tabs, surface radius, and action placement.

Mobile uses a compact top bar, a bottom navigation dock with five high-frequency destinations, and full-width stacked cards. Long lists become readable rows with clear separators rather than nested glass panels.

## UX acceptance criteria

A first-time student should be able to reach Exam Hub, Attendance, Library, Planner, AI Tutor, and Profile from the first screen without guessing. On mobile, each primary action must be reachable without horizontal scrolling. Focus indicators must remain visible, reduced-motion users must not receive disruptive animations, and status meaning must not depend on color alone.
