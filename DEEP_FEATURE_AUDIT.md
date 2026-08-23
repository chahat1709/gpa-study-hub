# GPA Study Hub — Deep Feature and Link Architecture Audit

## Scope

This audit exercised the authenticated application through strict Playwright browser journeys on desktop Chromium and the Pixel 5 mobile project. It covered the application shell, every desktop sidebar workspace, the mobile dock, mobile full-screen back navigation, command palette, notifications, nested workspace tabs, Planner CRUD, profile entry, and logout. Assertions were required; the audit did not use optional `if visible` checks for feature success.

## Reproduced and fixed defect

The mobile dock was rendered with `display: none` and was positioned below the viewport at a 390px viewport. The compiled preview bundle did not emit the expected responsive positional utilities for `md:hidden`, `bottom-0`, `left-0`, and `right-0`. Playwright diagnostics showed the dock at `y: 844` with `height: 67`, rather than at the viewport bottom.

The fix is scoped to `.ui-app-shell .ui-mobile-dock`: below 768px it explicitly restores `display: flex`, `position: fixed`, `left: 0`, `right: 0`, `bottom: 0`, `width: 100%`, and `z-index: 50`; at 768px and above it is hidden. The fix was then rebuilt and the mobile dock journeys passed.

The mobile full-screen Tutor and Social architecture intentionally hides the dock while those workspaces are active. The audit now verifies the explicit mobile `Go back to Campus Home` path for Tutor instead of incorrectly expecting the dock to remain visible.

## Feature matrix

| Area                | Browser journey                                                            | Result |
| ------------------- | -------------------------------------------------------------------------- | -----: |
| Authenticated shell | Desktop sidebar, notification bell, command trigger, every workspace link  | Passed |
| Command palette     | Open, search “exam”, select “Prepare for an exam”, reach Exam Hub          | Passed |
| Notifications       | Open popover and verify populated/empty state                              | Passed |
| Campus              | Overview, Faculty directory, Campus info tabs                              | Passed |
| Attendance          | Stats and Schedule tabs                                                    | Passed |
| Planner             | Create, complete, and delete a task through the real form and row controls | Passed |
| Library             | Desktop navigation and rendered resource/empty-state contract              | Passed |
| Exam Hub            | Timed AI Quizzes, GTU Past Papers, AI Answer Grader tabs                   | Passed |
| AI Tutor            | Desktop protected/available state and mobile full-screen entry/back path   | Passed |
| Scanner             | Desktop workspace navigation and content contract                          | Passed |
| Network             | Campus Link workspace and offline empty state                              | Passed |
| Identity/Profile    | Desktop workspace, upload-control contract, mobile header entry            | Passed |
| Mobile dock         | Campus Home, Exam Hub, Profile, active-tab semantics                       | Passed |
| Logout              | Desktop sign-out returns to sign-in                                        | Passed |

## Verification results

| Check                                                  |                                             Result |
| ------------------------------------------------------ | -------------------------------------------------: |
| Deep desktop audit, `chromium`, 13 tests               |                                      **13 passed** |
| Deep mobile audit, `mobile-chrome`, 3 applicable tests | **3 passed; 10 correctly skipped as desktop-only** |
| Login audit, desktop and mobile                        |                                      **29 passed** |
| TypeScript check                                       |                                         **Passed** |
| Production build                                       |                                         **Passed** |

The earlier full-suite run had two unrelated mobile Library navigation timeouts. Those were not part of the login or link-architecture defects reproduced in this audit, and no Library behavior was changed to conceal them.

## Changed files

The feature-audit changes are limited to `public/index.css` for the responsive mobile dock contract, `e2e/deep-features.spec.ts` for strict feature/link coverage, and this report. The earlier login-only changes remain in `components/AuthPage.tsx`, `components/ForgotPin.tsx`, and `e2e/login-bugs.spec.ts`.
