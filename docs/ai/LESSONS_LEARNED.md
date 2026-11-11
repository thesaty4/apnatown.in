# Lessons Learned

Seeded with recurring footguns this setup is designed to prevent.
Format: see `.github/skills/lessons-learned/SKILL.md`. Newest at the
top; `bug-fixer` and any agent that catches a reusable mistake adds an
entry here.

## Server-side OTP verification only

What: client-side OTP/code comparison (or trusting a client "verified"
flag) lets an attacker skip verification entirely.
Rule: login OTP, delivery OTP, and pickup codes are generated and
verified **server-side only**, with attempt limits; the client only
submits the code and receives a pass/fail result.
Enforced in: `security.instructions.md`,
`.github/skills/otp-and-codes/SKILL.md`.

## Embed URLs rebuilt from allow-listed hosts

What: embedding a client-supplied video URL directly (e.g. in an
iframe) is an SSRF/XSS vector and lets arbitrary hosts be embedded as
if trusted.
Rule: validate the link's host against an allow-list (YouTube,
Instagram) and rebuild the embed URL server-side; fall back to "Open
in YouTube/Instagram" otherwise.
Enforced in: `security.instructions.md`,
`.github/skills/media-embeds-and-reels/SKILL.md`.

## Parameterized SQL and allow-listed sort/filter

What: passing a client-supplied field name straight into an `ORDER BY`
or building a query with string interpolation is a SQL-injection and
data-exposure risk, even when the "value" is parameterized.
Rule: queries are parameterized; sort/filter fields are validated
against an explicit allow-list/enum before being used to build a query.
Enforced in: `security.instructions.md`, `database.instructions.md`,
`backend.instructions.md`.

## Freeze ranking so deep links resolve by id

What: a live-ranked feed (e.g. Reels "For You") that keeps re-sorting
while open causes a deep link (`/videos/:id`) to land on the wrong item
or shift content under the user mid-scroll.
Rule: compute the feed ranking once per session and freeze it; a deep
link resolves by id against that frozen list (or seeds a new frozen
list containing it).
Enforced in: `domain-media-engagement.instructions.md`.

## Do not re-render inputs while typing

What: wiring a text input directly to global/query state on every
keystroke causes focus loss, cursor jumps, and dropped characters,
especially on a slow mid-range Android keyboard.
Rule: keep form input state local (`react-hook-form`) and commit to
shared/URL state on blur/submit, not on every change event.
Enforced in: `frontend.instructions.md`.

## Ignore pointer capture on interactive elements

What: a custom carousel/drag handler that captures the pointer on the
whole container can swallow clicks on buttons/links nested inside it.
Rule: interactive elements (buttons, links, chips) inside
draggable/swipeable containers must not be blocked by the container's
pointer-capture logic.
Enforced in: `frontend.instructions.md`.

## Esc handled by the top-most layer only

What: multiple open layers (a sheet behind a dialog, for example) each
listening for Esc globally causes Esc to close more than one layer at
once, or the wrong one.
Rule: only the top-most open layer (dialog > sheet > page) handles Esc;
lower layers must not have an active global Esc listener while covered.
Enforced in: `frontend.instructions.md`.

## Never alias event handlers by assignment

What: `const onClick = this.handleClick` (or destructuring a method off
an object/hook result) silently loses `this`/closure context, causing
intermittent "works sometimes" bugs that are hard to reproduce.
Rule: bind explicitly or use arrow functions; never alias a method
reference without preserving its binding.
Enforced in: `frontend.instructions.md`.

## Separate filter state per screen

What: sharing one filter store between Explore and Search caused
filters set on one screen to silently leak into the other, confusing
users and breaking shareable links.
Rule: Explore and Search keep **independent** filter state/hooks, even
though they reuse the same filter components.
Enforced in: `docs/project/04-business-rules.md` BR-15,
`domain-catalog-search.instructions.md`,
`.github/skills/explore-filter-url-state/SKILL.md`.

## URL query state and Back button/scroll restoration

What: storing Explore/Search filters only in component state breaks
shareable links, and resetting scroll position on every filter change
or Back navigation frustrates users scrolling through long lists.
Rule: filter state lives in the URL; browser Back restores both the
previous filter state and the previous scroll position.
Enforced in: `frontend.instructions.md`,
`.github/skills/explore-filter-url-state/SKILL.md`.
