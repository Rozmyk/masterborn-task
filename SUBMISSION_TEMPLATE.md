# Submission: Michal Rozmyslowski

## Time Spent

Total time: **approximately 3 hours**.

## Ticket Triage

### Tickets I Addressed

1. **CFG-142**: Fixed price updates, ignored outdated responses, and avoided recalculation for draft-name changes.
2. **CFG-148**: Removed unavailable dependent add-ons without mutating state and made the summary safe for missing entries.
3. **CFG-147**: Added versioned Unicode share links, original-format compatibility, payload validation, and configuration-name restoration.
4. **CFG-152**: Added keyboard navigation, accessible control names, visible focus, and modal focus management.
5. **CFG-143**: Removed the resize listener on cleanup; verified that repeated mounts no longer accumulate listeners.

### Tickets I Deprioritized

| Ticket  | Reason                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-146 | ISO storage and local-time formatting are already present. I did not establish a timezone conversion defect; a concrete failing timestamp and timezone are needed.        |
| CFG-149 | The existing `price-loading` class already dims the price during calculation. Additional loading polish was lower priority than correctness.                              |
| CFG-150 | The screenshot is missing. The current layout uses flexbox and does not consume `--color-columns`, so changing the suggested calculation alone would not establish a fix. |
| CFG-151 | Partially improved: validation failures and their reasons are visible. A full rewrite of technical error messages and recovery actions remains outside scope.             |
| CFG-153 | Comparing configurations is a substantial new feature and does not fit this exercise's time budget.                                                                       |
| CFG-155 | Dark mode is useful but was explicitly described as non-critical for the demo.                                                                                            |
| CFG-156 | The listed option renders already have keys; colors and add-ons now use stable IDs as part of CFG-152. I did not claim a separate missing-key fix.                        |
| CFG-157 | Reliable dirty-state tracking needs to precede navigation warnings. The exact host navigation and Save & Close behavior also need agreement.                              |
| CFG-158 | `currentConfig` is already memoized and the demo imports a stable product object. Further optimization needs profiling rather than another blanket `useMemo`.             |

### Tickets That Need Clarification

| Ticket            | Question                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| CFG-144 / CFG-145 | Should Quick Add be removed, or retained with the shortcut requested for the TechStyle demo?                                   |
| CFG-154           | What are the approved inclusive quantity thresholds and discount percentages? The ticket, code, and business context disagree. |

### Tickets With a Misleading Priority Label

| Ticket  | Label on board | Your read                                     | Why                                                                                                                     |
| ------- | -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CFG-152 | Low            | High                                          | Keyboard users could not fully configure the product, and the ticket identifies accessibility commitments to TechStyle. |
| CFG-145 | High           | Potential demo blocker, pending clarification | The ticket calls the shortcut mandatory for the demo, but CFG-144 requests removal of the same feature.                 |
| CFG-158 | High           | Needs profiling before implementation         | The proposed memoization is already present in the relevant path; the suggested fix does not match the current code.    |

### Tickets Where You Stopped to Ask Instead of Implementing

These are questions I would escalate in a real team; no PM, customer, or Finance contact was made during this exercise.

| Ticket            | Who would you ask                      | What you'd ask                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-144 / CFG-145 | Product PM and TechStyle account owner | Which requirement takes precedence for the demo: removal or the mandatory keyboard shortcut? I left Quick Add in place without adding a shortcut.                                                                                         |
| CFG-154           | PM and Finance                         | Confirm the thresholds and rates for each tier. Code applies discounts above 10 and 50, while the UI suggests inclusive thresholds; the ticket also mentions 15% where code and context specify 10%. I left the pricing policy unchanged. |

---

## Technical Write-Up

### Critical Issues Found

### Issue 1: Price calculation not updating

**Ticket(s):** CFG-142

**What was the bug?**

The price calculation hook compared `Date.now()` with a request counter returned by the API. Since these values represent different things, valid price responses were ignored, leaving the displayed price at $0.00.

**How did you find it?**

I reviewed the `usePriceCalculation` hook and the mocked API implementation. I noticed that `response.timestamp` was actually an incrementing request ID rather than a timestamp.

**How did you fix it?**

I replaced the incorrect timestamp comparison with a cleanup mechanism inside `useEffect`. When pricing inputs change, previous requests are marked as outdated and their responses are ignored. The effect tracks selections, add-ons, quantity, and product rather than the entire configuration, so editing the draft name does not trigger another calculation. A ref updated in a preceding effect keeps request metadata current for the next calculation or explicit refetch.

**Why this approach?**

This prevents outdated responses from overwriting newer prices without changing the API. It also handles component unmounting safely and avoids unnecessary calculations for metadata-only edits.

**How did you verify it?**

A Chromium fixture with controlled API responses verified that metadata edits do not refetch, while changes to pricing inputs and explicit refetch do. It also checked current request metadata, out-of-order responses, outdated failures, resetting a null configuration, and unmounting.

---

### Issue 2: Crash when deselecting packaging

**Ticket(s):** CFG-148

**What was the bug?**

Dependent add-ons were only removed when a select option changed. Since packaging is a toggle, disabling it left Gift Wrap selected even though it was no longer available. The summary then tried to read `.price` from an undefined add-on, crashing the application.

**How did you find it?**

I traced the option change handler and the add-on summary in `ProductConfigurator`. The handler skipped toggle options, while the summary assumed that every selected add-on existed in `availableAddOns`.

**How did you fix it?**

I updated the handler to remove dependent add-ons whenever their requirement is no longer met, regardless of the option type. I also replaced the array mutation with a functional state update using `filter`. The summary now uses one filtered list of existing, available add-ons for its count, prices, and visibility.

**Why this approach?**

This keeps selected add-ons consistent with the changed option without mutating React state. It preserves unrelated add-ons and prevents the summary from crashing on missing or unavailable entries in a loaded configuration.

---

### Issue 3: Broken share links for configurations with special characters

**Ticket(s):** CFG-147

**What was the bug?**

The encoder passed JSON directly to `btoa`, which cannot encode characters such as Polish diacritics and emoji. Base64 was also inserted directly into the URL, allowing `+` characters to become spaces when read through `URLSearchParams`. Additionally, the component did not restore the configuration name from the decoded link.

**How did you find it?**

I traced the share link encoder, decoder, and component effects. Encoding the example name `Żółć test 🎨` threw an `InvalidCharacterError`, and a separate check confirmed that raw `+` characters were changed by URL parsing. These failures came from the data handling rather than a development-only build issue.

**How did you fix it?**

I encoded the JSON as UTF-8 bytes before converting it to Base64 and decoded those bytes using `TextDecoder`. New links have a `v1:` prefix identifying UTF-8; unversioned links use the original Latin-1 encoding, without guessing from the bytes. The decoder restores spaces to `+` and checks the decoded object and field types before passing data to the component. Invalid structures, non-string add-on IDs, and non-positive or non-integer quantities are rejected. Share URLs now use `URL.searchParams.set`, preserving other query parameters and the URL fragment. Loading a shared configuration also restores its name.

**Why this approach?**

This supports Unicode without adding dependencies or changing the data fields stored in the link. It preserves original Latin-1 links, including byte sequences that are also valid UTF-8, and rejects malformed Base64, JSON, or payload shapes before rendering. Product-specific option validity remains the responsibility of configuration validation.

**How did you verify it?**

I checked encoding and decoding of the ticket's example values, Base64 URL characters, older ASCII and Latin-1 links, and malformed input. In Chromium against the production build, I verified sharing, reopening, and resharing a configuration named `Żółć test 🎨`, including restoration of its name and quantity. The build and formatting checks passed; ESLint reported only the existing component diagnostics.

---

### Issue 4: Incomplete keyboard navigation

**Ticket(s):** CFG-152

**What was the bug?**

Color swatches were non-focusable elements with click handlers. Modals did not move focus inside on opening or keep keyboard navigation within them. Some controls lacked explicit focus styles or accessible names, and the packaging toggle's keyboard handler could change the configuration in read-only mode.

**How did you find it?**

I reviewed the controls and modal handlers, then checked keyboard interaction in Chromium. The dropdowns mentioned in the ticket are native select elements in this version and already support arrow keys. During testing, I also found that native dialogs alone allowed focus to leave the dialog for the browser interface at the Tab boundary.

**How did you fix it?**

I made color swatches named radio buttons with a single Tab stop and arrow-key navigation that skips unavailable colors. The packaging toggle now uses a native button, and add-ons use labeled checkboxes with an onChange handler. I added visible focus styles and replaced the modal overlays with native dialogs. Dialogs focus the close button on opening, wrap Tab navigation, and return focus to their trigger after closing, saving, or loading. Deleting the focused draft moves focus to the close button.

**Why this approach?**

Native buttons, checkboxes, selects, and dialogs provide useful keyboard behavior without new dependencies. The additional focus handling covers the modal boundary cases while preserving the existing layout and mouse interactions. I treated this as high priority because it blocks keyboard users and the ticket explicitly connects accessibility to the client's demo requirements.

**How did you verify it?**

I tested color selection with arrows, Enter, and Space; quantity buttons; native select navigation; packaging and add-on controls; visible focus; and single-toggle mouse clicks in Chromium. I also checked unavailable colors and read-only controls with a browser-only fixture. For both dialogs, I checked initial focus, Tab wrapping, Escape, close buttons, backdrop clicks, and focus restoration, including saving, loading, and deleting drafts. These are targeted interaction checks, not a full WCAG audit.

---

### Issue 5: Resize event listener leak

**Ticket(s):** CFG-143

**What was the bug?**

The resize effect registered a window event listener without removing it on cleanup. Listeners remained after the configurator unmounted and accumulated when it mounted again. React StrictMode also exposed the missing cleanup during development.

**How did you find it?**

I reviewed the resize effect and tracked active resize listeners in Chromium. Before the fix, the development build had two listeners after mounting, still had two after unmounting, and had four after mounting again.

**How did you fix it?**

I added an effect cleanup that calls `removeEventListener` with the same `handleResize` function used during registration.

**Why this approach?**

This fixes a confirmed resource leak without changing layout calculations or preview generation. I have not established that this leak explains all of the slowdown reported after 15–20 minutes of continuous use; that would require a longer profiling session.

**How did you verify it?**

In Chromium, I ran five mount/unmount cycles under StrictMode. Each mounted configurator had exactly one active listener, and the count returned to its baseline after every unmount. Resizing still updated the color column CSS variable with the expected value.

---

### Other Changes Made

- Removed the additional npm lockfile; `pnpm-lock.yaml` remains the dependency lockfile.
- Added structural validation and an explicit encoding version to shared configuration payloads during follow-up review.
- Associated validation results with the configuration they checked. Pending or failed validation blocks both cart actions; invalid configurations display their validation messages rather than a success badge.
- Cleared the displayed price on calculation failure and blocked both cart actions without a valid price.
- Verified price failure/recovery, pending and failed validation, and correction of an invalid add-on configuration in Chromium using controlled API responses.
- Kept the initial fixes in separate ticket commits, followed by review corrections; no broad component refactor or new runtime dependencies.

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

| Issue                                                                                                           | Why I Left It                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business validation does not fully check required options, allowed values, or product-specific quantity limits. | Needs a focused business-validation change. Payload shape checks do not replace product-specific validation.                                                                      |
| Dirty state is set on initial render, and loading a draft does not fully restore its name and save metadata.    | Separate draft-state behavior; relevant groundwork for CFG-157.                                                                                                                   |
| Discount calculations and next-tier hints disagree at boundaries.                                               | Changing prices without an approved specification risks implementing the wrong business rule.                                                                                     |
| Existing ESLint findings remain.                                                                                | Current full lint reports 6 errors and 1 warning, down from 8 errors and 2 warnings in the initial code. I did not disable rules or broaden the task into unrelated lint cleanup. |
| The debounced pricing hook is unused by the configurator and still has separate state-handling issues.          | The active pricing path was the focus of CFG-142.                                                                                                                                 |
| Regression checks are not committed as a test suite.                                                            | Verification used temporary scripts and browser fixtures; making them reproducible in the repository is a follow-up.                                                              |

### Potential Improvements for the Future

1. Add maintained regression tests for async pricing, link parsing, dependent add-ons, and keyboard interaction.
2. Complete product-specific validation and replace remaining technical errors with actionable messages.
3. Profile a sustained session and extract focused components only where measurements or maintainability justify it.

---

## Questions for the Team

1. Who owns the final Quick Add decision for the TechStyle demo?
2. Which approved pricing specification defines quantity thresholds and discount rates?
3. Can QA provide the mobile alignment screenshot, viewport, and a concrete failing timezone example?
4. What browsers and embedding environments must the widget support, particularly for modal behavior and host navigation?

---

## Assumptions Made

1. Changing an option removes selected add-ons whose requirement is no longer met; re-enabling that option does not automatically reselect them.
2. New share links use `v1:` plus UTF-8 Base64. Unversioned links retain the original Latin-1 interpretation. Links created by the intermediate, unversioned UTF-8 implementation must be regenerated; those bytes cannot be reliably distinguished from legacy Latin-1.
3. Missing optional payload fields retain the existing defaults. Invalid field types and invalid quantities are rejected; product-specific limits and allowed choices belong in business validation.
4. Changes use immutable React state. Price calculation responds to pricing inputs, not the configuration name or timestamps.
5. Keyboard checks target the reported workflows in Chromium; they do not constitute a complete WCAG compliance audit.

---

## Self-Assessment

### What went well?

The fixes addressed observable failures and stayed tied to individual tickets. Checking the code against the ticket descriptions helped avoid unnecessary memoization, rewriting native selects, or changing ambiguous discount rules.

### What was challenging?

Several descriptions conflicted with the implementation or with other tickets. Follow-up review also exposed unnecessary recalculation during name edits and ambiguous legacy link decoding, which required tightening the initial fixes.

### What would you do differently with more time?

I would preserve the regression checks in the repository, complete a longer performance profile, and resolve the product questions before expanding the feature work.

---

## AI Assistance Notes

I used Codex to inspect code and tickets, prepare scoped fixes, review commits, and run build, lint, and Chromium checks. I requested work ticket by ticket and limited unrelated changes. The assistant generated and executed the temporary browser fixtures; these were not a separate manual QA audit. Its review found gaps in the earlier pricing and link fixes, which were then addressed. Business conflicts around Quick Add and discounts remain documented rather than guessed.

---

## Additional Notes

Verification includes TypeScript and the production build, formatting checks, and targeted Chromium scenarios. The known lint findings remain; commit hooks were bypassed for those existing failures without changing the lint configuration. The resize cleanup fixes a demonstrated leak, but a full explanation of the reported 15–20 minute slowdown would require additional profiling.
