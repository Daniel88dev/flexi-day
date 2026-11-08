---
id: attachments
title: Attach files to a request
summary: Add a doctor's note or another image or PDF to a request, who can see it, and how long it is kept.
module: leave
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/requests, /dashboard]
keywords:
  [
    attachment,
    attach,
    upload,
    file,
    pdf,
    photo,
    doctor's note,
    sick note,
    medical certificate,
    document,
  ]
related: [request-time-off, who-sees-your-time-off, plans-and-limits]
goldenQuestions:
  - question: How do I upload my doctor's note for my sick leave?
    expectedArticles: [attachments]
    mustMention: [Add files in the request details, images or PDF up to 10 MB]
  - question: Who can see the files I attach?
    expectedArticles: [attachments, who-sees-your-time-off]
    mustMention: [approvers and group admins, teammates don't]
---

You can attach files to a request, such as a doctor's note. Attachments need a paid plan.

## Add files

- **When you create the request:** after you press "{{ui:newRequest.submit}}", the form stays open
  with "{{ui:attachments.addFiles}}". Click it or drop files on it.
- **Later:** open the request from the calendar or the {{ui:nav.requests}} page. The request details
  have the same "{{ui:attachments.title}}" section.

Each request holds up to five files. Each file can be PNG, JPEG, WebP, HEIC or PDF, up to 10 MB.

Every file is checked after upload. Images are converted to JPEG, shrunk to at most 2048 pixels on
the long side, and stripped of hidden metadata such as location. A file is rejected when its contents
don't match its type, an image can't be read, or a PDF contains scripts or a password. The reason
shows next to the file; replace it with another one.

## Who sees attachments

You, the approvers of the request's group and its admins, including organization administrators.
Teammates never see them.

You can open, preview and download a file from the request details.

## Remove a file

Whoever uploaded a file can delete it, and so can the group's admins. The file is removed for
everyone, and the request history keeps a note that it was there and who removed it.

## How long files are kept

Files are deleted automatically:

- 12 months after the request's last day;
- as soon as every day of the request is cancelled or rejected.

You can't attach new files after either point.

## On the Free plan or after a lapse

Without a paid plan, the "{{ui:attachments.title}}" section says attachments need one. Files already
attached stay available.
