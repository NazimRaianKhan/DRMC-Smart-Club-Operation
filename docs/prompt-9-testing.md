# Prompt 9: registration testing guide

## What this prompt implements

- Individual and team registration, with shared client/server validation.
- Account email enforced for the first member; that member is always the leader. No email-verification requirement.
- One registration consumes one seat, even for a team. Confirmed and checked-in registrations hold seats.
- Event-row locking, transaction timeouts, atomic seat allocation and member insertion, and rollback on conflicts.
- FIFO waitlisting and current waitlist positions.
- Idempotent submission, existing-registration protection, and cancelled-registration reuse.
- Eight-character ticket codes with collision retries.
- Same-origin and authentication checks, HTTP error codes, and rate limiting (20 attempts per account per minute).
- English/Bangla forms, animated member cards, and private confirmation pages for the owner, organizers, and admins.

## Role policy

| Action | Participant | Organizer | Admin |
| --- | --- | --- | --- |
| Browse public fests/events | Yes | Yes | Yes |
| Register individually or lead a team | Yes | No | No |
| Join a team using an existing account email | Yes | No | No |
| View own confirmation | Yes | Yes, if one already exists | Yes, if one already exists |
| View other participants' confirmations | No | Yes | Yes |
| Access My Registrations | Yes | No | No |
| Access Admin area | No | No | Yes |
| Access own profile | Yes | Yes | Yes |

Guests must sign in before registering. Teammates do not need accounts, but an email belonging to an organizer/admin account cannot join a team. Public signup always creates a participant account. Existing registrations are preserved if their owner's role changes.

Roles are read from the database at request time; the JWT identifies the account but its stored role is not the authority. Test a role change by changing a disposable account's database role, keeping its old session, and reloading the page: the form, API, admin area, and ticket access must use the new role. Already rendered pages may need a reload to update their controls.

Organizer/admin event-management screens remain outside Prompt 9. Organizers no longer see the admin-only navigation link. Organizer review access currently follows the original project rule (all registration confirmations); event-specific staff assignments would require an additional schema/workflow.

The browser suite checks staff form restrictions, direct API rejection, admin-only page access, and removal of staff access after a role downgrade. The integration suite checks organizer/admin leaders and teammates are rejected without allocating a seat or writing any registration/member rows.

Cancellation buttons, waitlist promotion workflows, check-in/scanning screens, payments, and email notifications are not implemented by Prompt 9. The service understands the existing registration statuses. Cancellation/re-registration is tested by setting up a cancelled registration in test fixtures.

## The repeated validation-error bug

For an individual event, client validation removed the irrelevant `teamName` by setting it to `undefined`. JSON serialization then omitted the property entirely. The server schema incorrectly required that property to exist, so otherwise valid solo submissions failed.

The solo schema now accepts an absent team name. A regression test exercises client parsing, JSON serialization, and server validation in sequence. Server validation responses also include the invalid field path so the form can identify the affected field instead of always marking the email.

## Manual checks on the running app

Start at http://localhost:3000/en/fests. Use a fresh test account to avoid conflicts with earlier registrations. Successful manual registrations persist and consume real seats in this local database.

The counts below were checked on October 9, 2026. They change as you register; do not reset the database just to restore these numbers.

| Check | Action | Expected result |
| --- | --- | --- |
| Login required | Open an event in a signed-out/incognito browser. | Login/signup links appear instead of the form. |
| Solo confirmation | Open [Gaming Tournament](http://localhost:3000/en/fests/tech-carnival-2026/events/gaming), fill required fields and submit. | Confirmation with a ticket code and one member. There were 2 seats available when checked; once filled, new registrations waitlist. |
| Team confirmation | Open [AI Web Development Contest](http://localhost:3000/en/fests/tech-carnival-2026/events/ai-web-dev), enter a team name and three members including yourself. | “You're in!”, team name, ticket code, and three members. Capacity decreases by one seat. This event allows 2–3 members. |
| Team size controls | Add the third member, then remove one. | Add disappears at three; Remove disappears at two. The leader cannot be removed. |
| Read-only identity | Inspect the leader email field. | It matches the logged-in account and cannot be edited in the form. The server also enforces it. |
| Required/invalid input | Omit leader phone; use `123` as phone; use a one-character name or institution; omit team name. | Submission is blocked and fields are marked. A valid phone example is `01711223344`. |
| Optional input | Leave a teammate's phone and student ID empty; leave notes empty. | These fields do not prevent registration. The leader's phone remains required. |
| Duplicate team emails | Give two members the same email, including a case-only difference. | Validation fails. Changing letter case does not bypass uniqueness. |
| Member already registered | With a second account, submit a team containing an email already active in that event. | `MEMBER_ALREADY_REGISTERED`; no new team or seat is allocated. The same email may join a different event. |
| Waitlist | Open [Programming Contest](http://localhost:3000/en/fests/tech-carnival-2026/events/prog-contest) and register. | Waitlist confirmation. There were 14 waiting registrations when checked, so the next successful new registration is position 15. Later registrations have later positions. Seat count stays at 60. |
| Duplicate registration | After success, return to the event, reload the form, and submit again. | `ALREADY_REGISTERED`; no extra registration or seat. |
| Deadline | Open [Robotics Challenge](http://localhost:3000/en/fests/tech-carnival-2026/events/robotics). | Registration is closed. Its deadline was October 7, 2026 in Dhaka time. The API independently enforces the deadline. |
| Not open yet | Open [AI Workshop](http://localhost:3000/en/fests/freshers-tech-fest-2027/events/ai-workshop-ft) before its displayed opening time. | Opening notice instead of a form. After that time, use the automated fixture test for this case. |
| Language | Repeat with `/bn/` instead of `/en/`, including the confirmation URL. | Bangla labels/messages and the same registration details and waitlist position. |
| Confirmation privacy | Copy your confirmation URL. Open it signed out, then as another participant. | Signed-out users go to login. Another participant cannot view the ticket or members. Organizer/admin sessions can view it. |
| Reload confirmation | Reload your confirmation URL. | Same ticket and members; current registration status and waitlist position. |

Name and institution: 2–80 characters. Team name: 2–40. Class: 3–12 or Other. Notes: at most 500 characters. Teammate emails must be valid and unique within the event's active memberships.

## Idempotency versus duplicate registration

The form creates one UUID when mounted and reuses it for retries. While registration is still open, replaying the exact successful POST body, including its `idempotencyKey`, returns HTTP 200 with the same registration ID/ticket and `replayed: true`.

Reloading the form creates a new key. Submitting that new key for an already active registration returns HTTP 409 `ALREADY_REGISTERED`. You can inspect the POST under browser DevTools → Network → `register`, or rely on the automated replay test below.

## Automated checks

Run from the project directory with the normal `.env.local` database configuration:

```powershell
pnpm test:registration
pnpm typecheck
```

`test:registration` runs only registration validation, HTTP, and database tests. The database suite creates unique temporary fixtures and deletes only those fixtures afterward.

It covers solo/team success, validation, account-email enforcement, opening time/deadline/publication checks, idempotent replay, duplicate registration, member-conflict rollback, ticket collision retries, full events without waitlisting, and cancelled-registration reuse at the back of the queue. Its concurrency case submits 200 requests together and asserts exactly 50 confirmed, 150 waitlisted, a confirmed counter of 50, and unique positions 1–150.

HTTP tests check 400 validation, 401 authentication, 403 origin, 404 event, 409 registration conflicts, 429 rate limiting with Retry-After, and replay responses. Rate-limit response handling is mocked in this suite. To exercise the configured limiter manually, send more than 20 authenticated requests within one minute from a disposable test account; later requests should return 429. Upstash is used when configured; otherwise the limit is per server process in memory.

Run browser checks against your existing development server:

```powershell
$env:REGISTRATION_TEST_BASE_URL = 'http://localhost:3000'
pnpm test:registration:browser
Remove-Item Env:REGISTRATION_TEST_BASE_URL
```

The browser suite creates temporary accounts/events, verifies a three-person team, solo waitlist position 15, Bangla confirmation, and owner/organizer/admin permissions, then removes its fixtures. You do not need to provide your login credentials.

Alternatively, with `REGISTRATION_TEST_BASE_URL` unset, run `pnpm build` followed by `pnpm test:registration:browser` to test a production build on port 3100.

Do not use the broad `pnpm test:integration` command against data you want to keep: the older database and seed suites include table truncation/reseeding. The dedicated `test:registration` command avoids those suites.

## Checks requiring controlled fixtures

Use the automated suite for high concurrency, ticket collisions, full-with-waitlist-disabled events, and cancelled re-registration. These cases require specific data states; avoid modifying real fest capacity or registrations just to simulate them.

For a read-only check of database invariants, run:

```powershell
pnpm db:verify
```

It checks seat counters, the full-capacity waitlist invariant, exactly one leader, valid member counts, and membership activity versus registration status.
