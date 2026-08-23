# GPA Study Hub — Login Audit and Fix Summary

## Scope

This pass was restarted around the actual login user journey. Changes were limited to authentication components and strict Playwright coverage. The rest of the application and accepted visual direction were not redesigned during this pass.

## Reproduced defect and fix

| Defect reproduced by Playwright                                                           | Root cause                                                                                                                                          | Fix                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student PIN entry did not advance focus to the next digit during real keyboard typing.    | `PinInputs` was declared inside `AuthPage`, so each PIN state update created a new component identity and React remounted the inputs, losing focus. | Extracted `PinInputs` to a stable top-level component and passed the required state and handlers as props.                                                            |
| Empty enrollment could be blocked by native browser validation before the intended toast. | The enrollment input used native `required` validation while the React handler also owned validation.                                               | Removed native `required` from this login input and retained `aria-required="true"` so the React message is reachable and the field remains communicated as required. |
| Forgot-PIN back control was not accessible by name.                                       | It was an icon-only button without an accessible label.                                                                                             | Added `aria-label="Back to sign in"`.                                                                                                                                 |
| Forgot-PIN labels were not associated with their inputs.                                  | Labels and inputs were siblings without matching `for`/`id` relationships.                                                                          | Added explicit IDs and `htmlFor` associations for enrollment, new PIN, and confirmation PIN.                                                                          |
| Faculty password field was ambiguous to accessibility locators.                           | The password input was inside a complex label wrapper containing a visibility button.                                                               | Added an explicit `aria-label="Password"`.                                                                                                                            |

## Strict browser coverage added

`e2e/login-bugs.spec.ts` now verifies student registration, student login with four individual PIN digits, empty enrollment validation, incomplete PIN validation, PIN focus advancement, registration PIN matching and visibility, forgot-PIN navigation, role switching, faculty registration/login, faculty password visibility, admin login and code visibility, selected tab semantics, and mobile horizontal-overflow behavior.

The tests use real browser actions, including keyboard typing for PIN focus, and avoid optional `if visible` assertions for the login journey.

## Verification results

| Check                                              |                                                       Result |
| -------------------------------------------------- | -----------------------------------------------------------: |
| Expanded login audit, desktop and Pixel 5 projects |                                **29 passed** including setup |
| Original authentication spec                       | **22 passed; 1 unrelated mobile Library navigation timeout** |
| Full suite after adding audit                      |  **49 passed; 2 unrelated existing mobile Library timeouts** |
| TypeScript check (`npm run check`)                 |                                                   **Passed** |
| Production build (`npm run build`)                 |                                                   **Passed** |

The login-specific tests pass on both desktop and mobile projects. The remaining full-suite failures are existing non-authenticated mobile Library navigation timeouts; no unrelated feature changes were made to mask them.
