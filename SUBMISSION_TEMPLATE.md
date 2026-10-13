# Submission: [Your Name]

## Time Spent

Total time: **\_\_** (approximate)

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-142**: Fixed price updates and prevented outdated price responses from overwriting newer results.
2. **CFG-148**: Fixed the crash when disabling packaging by removing dependent add-ons and safely rendering the summary.
3. **CFG-147**: Fixed Unicode support in share links, preserved compatibility with older links, and restored configuration names.
4. **CFG-152**: Added keyboard navigation for colors, accessible controls, visible focus, and modal focus management.

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                 |
| ------- | ---------------------- |
| CFG-XXX | [Why you skipped this] |
| CFG-XXX | [Why you skipped this] |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket  | Question                  |
| ------- | ------------------------- |
| CFG-XXX | [What you needed to know] |

### Tickets With a Misleading Priority Label

Our board labels aren't always right. List tickets where you disagreed with the label (e.g. a Low that's actually High, a High that's actually Low, a Medium that's actually Unclear) and explain why. If you didn't disagree with any, say so.

| Ticket  | Label on board | Your read | Why                                                                                                                                                                              |
| ------- | -------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-152 | ⚪ Low         | 🟠 High   | Keyboard users could not fully configure the product. The ticket also identifies accessibility commitments to TechStyle, making this a demo blocker rather than cosmetic polish. |

### Tickets Where You Stopped to Ask Instead of Implementing

If a ticket was ambiguous enough that the right move was to escalate / ask PM / gather more context rather than ship a fix, list it here. We value this signal — picking one interpretation blindly and shipping it can cost more than stopping to ask.

| Ticket  | Who would you ask | What you'd ask                                    |
| ------- | ----------------- | ------------------------------------------------- |
| CFG-XXX | e.g. PM / Finance | [The specific question + why you can't answer it] |

---

## Technical Write-Up

## Critical Issues Found

### Issue 1: Price calculation not updating

**Ticket(s):** CFG-142

**What was the bug?**

The price calculation hook compared `Date.now()` with a request counter returned by the API. Since these values represent different things, valid price responses were ignored, leaving the displayed price at $0.00.

**How did you find it?**

I reviewed the `usePriceCalculation` hook and the mocked API implementation. I noticed that `response.timestamp` was actually an incrementing request ID rather than a timestamp.

**How did you fix it?**

I replaced the incorrect timestamp comparison with a cleanup mechanism inside `useEffect`. When the configuration changes, previous requests are marked as outdated and their responses are ignored.

**Why this approach?**

This solution is simple, prevents outdated responses from overwriting newer prices, and doesn't require changes to the API. It also handles component unmounting safely.

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

I encoded the JSON as UTF-8 bytes before converting it to Base64 and decoded those bytes using `TextDecoder`. For older links, the decoder falls back to the original Latin-1 representation when UTF-8 decoding fails and restores spaces to `+`. Share URLs now use `URL.searchParams.set`, preserving other query parameters and the URL fragment. Loading a shared configuration also restores its name.

**Why this approach?**

This supports Unicode without adding dependencies or changing the data fields stored in the link. It also preserves support for older links and keeps malformed Base64 or JSON from crashing the application.

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

### Other Changes Made

Brief description of any other modifications:

- [Change 1]
- [Change 2]

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue   | Why I Left It                                         |
| ------- | ----------------------------------------------------- |
| [Issue] | [Reason - out of scope, time, needs discussion, etc.] |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. [Improvement 1]
2. [Improvement 2]

---

## Questions for the Team

Questions you would ask in a real scenario:

1. [Question 1]
2. [Question 2]

---

## Assumptions Made

List any assumptions you made to proceed:

1. [Assumption 1]
2. [Assumption 2]

---

## Self-Assessment

### What went well?

[Your reflection]

### What was challenging?

[Your reflection]

### What would you do differently with more time?

[Your reflection]

---

## AI Assistance Notes (optional)

If you used AI tools (Copilot, Claude, Cursor, ChatGPT, etc.), we'd love a short note on how. **We don't score the fact that you used AI — we score the quality of your reasoning and verification.**

Useful things to share:

- What kinds of prompts you sent (paraphrase is fine, no need to paste logs)
- Where the AI helped and where you overrode it
- Anything the AI suggested that you rejected — and why
- Anything you verified manually that the AI got wrong

---

## Additional Notes

Anything else you want us to know:

[Your notes]
