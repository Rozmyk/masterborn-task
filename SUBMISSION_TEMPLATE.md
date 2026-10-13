# Submission: [Your Name]

## Time Spent

Total time: **\_\_** (approximate)

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-XXX**: [Brief description of what you did]
2. **CFG-XXX**: [Brief description of what you did]
3. ...

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

| Ticket  | Label on board | Your read    | Why                                         |
| ------- | -------------- | ------------ | ------------------------------------------- |
| CFG-XXX | e.g. ⚪ Low    | e.g. 🟠 High | [What in the description changed your read] |

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
