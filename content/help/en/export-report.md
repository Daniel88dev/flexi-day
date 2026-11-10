---
id: export-report
title: Export the report to Excel
summary: How to download the leave report as an Excel workbook, what its two sheets hold, and what to do when the file is too large.
module: reports
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/report]
keywords:
  [export, excel, xlsx, spreadsheet, download, workbook, payroll, csv, leave export, too large]
related: [leave-report, allowances]
goldenQuestions:
  - question: Can I download all the vacation data into Excel for payroll?
    expectedArticles: [export-report]
    mustMention: [Export to Excel on the Report page, Summary and Detail sheets]
  - question: The export says there is too much data for one file. What now?
    expectedArticles: [export-report]
    mustMention: [narrow the filters, "at most 50,000 bookings"]
---

The {{ui:nav.report}} page can download its data as an Excel workbook (`.xlsx`). Anyone who can open
the report can export it, and the file holds exactly what the report shows you.

## Download the workbook

1. Open {{ui:nav.report}} and set the filters you want.
2. Press "{{ui:report.export.button}}". The dialog starts from the report's current filters.
3. Pick the year, groups, members and leave types, or leave them on "all".
4. Press "{{ui:report.export.confirm}}".

The export always covers one calendar year, even when the report shows the last 12 months.

## What the workbook holds

**Summary sheet**, one line per member, group and leave type with an allowance: carried over from
the previous year, the quota for the whole year, used to date, planned until the end of the year,
pending approval and remaining. The figures match the {{ui:report.table.title}} table on the
page.

**Detail sheet**, one line per booking: name, group, type, days, from and to, the day range,
year, month, status and note.

Both sheets have a frozen header row and Excel's filter switched on for every column, so you can
sort and filter straight away. Column headers and leave type names are in English whatever language
you use the app in.

## What stays out

- Public holidays never appear: a company-wide day off isn't leave anyone took.
- Someone else's Sick leave and rejected requests appear only if you approve or administer that
  person's group, or administer the organization. The same goes for the Note on their bookings,
  which is blank for everyone else.
- Your own rows are always complete.

Each export is recorded with who ran it, the year and the filters.

## "{{ui:report.export.tooLarge}}"

One workbook holds at most 50,000 bookings. Narrow the filters (fewer groups, members or leave
types) and export in parts.
