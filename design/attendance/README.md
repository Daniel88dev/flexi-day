# Attendance design mockups

Static HTML for the attendance screens, reviewed before any of them is built. Open any file in a
browser; nothing needs a build step. The switch in the top right of every sheet flips light, dark
or system, and `?theme=dark` in the URL does the same. Desktop frames are 1280 x 800, or 960 tall
where a month or a nine-row table needs it; the Pro settings frame shows the whole page as it
scrolls. Phone frames are 390 x 844.

## Screens

| File                                                                         | Screen                        | States shown                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01-shell.html](01-shell.html)                                               | Navigation shell              | Desktop org admin, expanded and collapsed; desktop member (admin sections absent); mobile bottom bar clocked in; mobile More sheet for an admin and for a member                                                                                                                                                                                                                       |
| [02-clock-widget.html](02-clock-widget.html)                                 | Clock widget                  | Out; in, with elapsed time; on break; auto-closed session needing correction; attendance inactive because the plan lapsed; the one-time location notice. Each as the phone's bottom sheet, three of them as the desktop card                                                                                                                                                           |
| [03-my-attendance.html](03-my-attendance.html)                               | My attendance                 | Today with sessions and breaks; week with a half day, an auto-closed day, an open day and the weekend; month in `DAILY` and in `MONTHLY` mode with totals on top, presence, worked, required and balance per day, excluded days hatched with the reason, flags; phone today and month                                                                                                  |
| [04-team-attendance.html](04-team-attendance.html)                           | Team attendance               | Org admin with group filter, who is in now (including a session still open from Thursday), all three flags, hovered row with the correction affordance; group admin with only their members and without their own row; the correction dialog with breaks and the event history; phone list for one day                                                                                 |
| [05-organization-settings.html](05-organization-settings.html)               | Organization settings         | Pro plan with attendance on and every field at its default; Free plan with the switch unavailable; the attendance card on a phone                                                                                                                                                                                                                                                      |
| [06-self-service-settings.html](06-self-service-settings.html)               | Self-service settings         | The self-service block in the attendance card: off, on with 0 days, on with 7 days, on with no limit, a number out of range with Save disabled; the read-only line a group admin gets on Team attendance; the block on a phone                                                                                                                                                         |
| [07-my-attendance-self-service.html](07-my-attendance-self-service.html)     | My attendance, self-service   | An empty past day inside the window offering Add session; the Add a session dialog; the entered session on its day; the month with both markers and an add button on hover; a day changed after the fact; self-service off, a day outside the window, an ended Employment, and the delete rule in the correction footer; the entry sheet on a phone for a night shift; the phone month |
| [08-correction-dialog.html](08-correction-dialog.html)                       | Correction dialog             | An employee correcting an earlier day with a break added; every form validation message (break outside its session, overlapping breaks, a break that ends before it starts, a new break with no time, end before start, longer than the session limit, ending in the future, over another session, outside the Employment, clock-out before clock-in); every API refusal               |
| [09-team-attendance-self-service.html](09-team-attendance-self-service.html) | Team attendance, self-service | Org admin week with both markers, the self-service line and Add on an empty day; the admin's Add a session dialog; the timeline of a session changed after the day, one the employee entered and one an admin entered; group admin with the read-only line; the phone day list with the markers                                                                                        |

## Data in the mockups

Studio Modrá, a Prague organization on Europe/Prague with Czech holidays, Monday to Friday, 8:00
required, 30 minutes of break above six hours, ceilings of 16 and 2 hours. The people are the ones
`lib/demo/` already uses. The month is September 2026; the tables and grids are rendered from small
data arrays at the bottom of each file and worked time follows the rule in
`flexi-day-be/docs/attendance.md`, so presence, worked, required and balance add up.

Sheets 06 to 09 add the self-service window at seven days back, with today on Friday 11 September,
so the window runs from 4 to 11 September. Sheets 07 and 08 follow Noah Weber, a member of Design
with no admin rights, because admins never meet the window.

## Decisions to confirm in review

- **Settings sits at the foot of the sidebar, not in the Organization section.** The ticket lists
  it under Organization. It is a personal page (two-factor, connected accounts, dashboard
  preference), and a member has no Organization section, so it lives with Support instead and
  does not move when someone becomes an admin.
- **The bottom bar's five slots are Dashboard, Requests, the clock, Attendance, More.** Everything
  else is in More, grouped by the sidebar's sections. Team attendance is a More item even for
  admins, so the bar is the same for every role.
- **Support stays support-admin only**, as it is today.
- **The month view is a grid, not a table.** Thirty rows do not fit a laptop; the grid keeps the
  totals and the whole month on one screen. On a phone it is a list.
- **`MONTHLY` mode hides the per-day balance chip entirely** rather than showing it uncoloured, so
  the one number on top is the only balance on the page.
- **What the `MONTHLY` balance is measured against, mid-month.** Settled as the mockup has it:
  against the required time to date, with the full-month figure beside it, so the days nobody has
  worked yet are not a shortfall. `flexi-day-be/docs/attendance.md` now says so.
- **Time is `h:mm` everywhere** (`8:11`, `+0:11`, `-0:25`), tabular figures, hyphen for minus.
- **The per-person required-time override** (parent issue, story 39) lives on the organization
  screen, in a People card under the attendance settings — one row per Employment, empty meaning
  the organization's own figure.

## Self-service decisions to confirm

Sheets 06 to 09 cover the self-service window and entered sessions from
Daniel88dev/flexi-day-be#204. The rules are in `flexi-day-be/docs/attendance.md`.

- **The two markers.** Entered is a permanent fact, not something to check, so it is a neutral
  outlined pill with a notebook icon. Changed after the day needs a look and clears when an admin
  corrects the session, so it sits with the flags as coloured text with an icon, but in blue with
  a person-and-pen icon, not the flags' orange. Blue is a new token, `--review`, which the app would
  add to `globals.css` beside `--warm`. Day cells say "Entered" and "Changed later"; the legend, the
  day card and the dialog use the long wording. A changed day counts in Flagged; an entered one
  does not.
- **Today becomes Day.** My attendance has no way to open a past day now. The Today tab becomes
  Day, with the same stepper as Week and Month and a Today button to jump back. Month cells inside
  the window show an add button on hover.
- **A group admin reads the setting on Team attendance**, in one line above the table, because
  they cannot open the Organization page. The org admin gets the same line with a Change link.
- **Actions outside the window are hidden, not disabled.** A read-only day says why and who to ask.
  The API refusals use the same words, so a stale tab reads the same text.
- **"Ends the next day" is a switch** on the entry form, not inferred from an end earlier than the
  start, so a mistyped end reads as an error rather than as a night shift.
- **The employee is told before saving a past-day change** that their admin will see it flagged,
  and the day card says so afterwards.
- **Copy changes to existing messages.** A break outside its session now names the session's times
  ("Has to stay inside the session, 08:05 to 17:10."). `SELF_SERVICE_WINDOW`, `SESSION_OVERLAPS`
  and `END_BEFORE_START` keep their wording. Every other message in 08 is new.
- **History stamps carry the date** ("Thu 10 Sep 08:52"), because an entry or a self-edit can come
  days after its session. "Session entered" and "Break added" show the times from the event's
  after payload.
- **Open: clearing the changed flag when nothing is wrong.** The spec clears the flag on any admin
  correction. If the employee's edit was right, the admin has nothing to change, and Save does
  nothing. Either Save sends the unchanged times as a correction while the flag is set, or the
  dialog gets a "Mark as checked" action. The mockups show neither; the backend ticket needs the
  answer.

## Keeping the assets honest

- `assets/tokens.css` is the token block copied from `app/globals.css`. Copy it again when the
  palette changes.
- `assets/icons.js` is generated from the `lucide-react` package the app depends on:
  `node design/attendance/assets/build-icons.mjs`. Add a name to the list there to use a new
  glyph. Renamed icons are re-exports in lucide, and the script follows them to the real file.
- `assets/mock.css` mirrors the shadcn primitives in `components/ui` (pill buttons and inputs,
  `rounded-2xl` cards with a hairline ring, the sidebar tokens). `assets/shell.js` renders the
  shell chrome and the phone frame for sheets 02 to 05 and holds the shared flag and clock-state
  maps; `01-shell.html` writes the desktop and phone chrome out by hand so the shell itself can be
  read as HTML.
- `assets/self-service.js` holds the form pieces sheets 06 to 09 share: fields, break rows, the Add a
  session dialog and the history list. The markers' styles and the `--review` token are at the end
  of `mock.css`; their icons and labels are in the flag map in `shell.js`.
