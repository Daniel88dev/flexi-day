# Attendance design mockups

Static HTML for the attendance screens, reviewed before any of them is built. Open any file in a
browser; nothing needs a build step. The switch in the top right of every sheet flips light, dark
or system, and `?theme=dark` in the URL does the same. Desktop frames are 1280 x 800, or 960 tall
where a month or a nine-row table needs it; the Pro settings frame shows the whole page as it
scrolls. Phone frames are 390 x 844.

## Screens

| File                                                           | Screen                | States shown                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [01-shell.html](01-shell.html)                                 | Navigation shell      | Desktop org admin, expanded and collapsed; desktop member (admin sections absent); mobile bottom bar clocked in; mobile More sheet for an admin and for a member                                                                                                                                       |
| [02-clock-widget.html](02-clock-widget.html)                   | Clock widget          | Out; in, with elapsed time; on break; auto-closed session needing correction; attendance inactive because the plan lapsed; the one-time location notice. Each as the phone's bottom sheet, three of them as the desktop card                                                                           |
| [03-my-attendance.html](03-my-attendance.html)                 | My attendance         | Today with sessions and breaks; week with a half day, an auto-closed day, an open day and the weekend; month in `DAILY` and in `MONTHLY` mode with totals on top, presence, worked, required and balance per day, excluded days hatched with the reason, flags; phone today and month                  |
| [04-team-attendance.html](04-team-attendance.html)             | Team attendance       | Org admin with group filter, who is in now (including a session still open from Thursday), all three flags, hovered row with the correction affordance; group admin with only their members and without their own row; the correction dialog with breaks and the event history; phone list for one day |
| [05-organization-settings.html](05-organization-settings.html) | Organization settings | Pro plan with attendance on and every field at its default; Free plan with the switch unavailable; the attendance card on a phone                                                                                                                                                                      |

## Data in the mockups

Studio Modrá, a Prague organization on Europe/Prague with Czech holidays, Monday to Friday, 8:00
required, 30 minutes of break above six hours, ceilings of 16 and 2 hours. The people are the ones
`lib/demo/` already uses. The month is September 2026; the tables and grids are rendered from small
data arrays at the bottom of each file and worked time follows the rule in
`flexi-day-be/docs/attendance.md`, so presence, worked, required and balance add up.

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

## Keeping the assets honest

- `assets/tokens.css` is the token block copied from `app/globals.css`. Copy it again when the
  palette changes.
- `assets/icons.js` is generated from the `lucide-react` package the app depends on:
  `node design/attendance/assets/build-icons.mjs`. Add a name to the list there to use a new
  glyph.
- `assets/mock.css` mirrors the shadcn primitives in `components/ui` (pill buttons and inputs,
  `rounded-2xl` cards with a hairline ring, the sidebar tokens). `assets/shell.js` renders the
  shell chrome and the phone frame for sheets 02 to 05 and holds the shared flag and clock-state
  maps; `01-shell.html` writes the desktop and phone chrome out by hand so the shell itself can be
  read as HTML.
