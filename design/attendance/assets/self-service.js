// Form pieces shared by the self-service sheets, 06 to 09: fields, the break
// rows, the "Add a session" dialog and the history list. Load after icons.js
// and shell.js.
(function () {
  function field(label, control, o) {
    o = o || {};
    return (
      '<div class="field' +
      (o.cls ? " " + o.cls : "") +
      '"><label class="label">' +
      label +
      "</label>" +
      control +
      (o.error ? '<span class="error-text">' + o.error + "</span>" : "") +
      (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") +
      "</div>"
    );
  }

  function input(value, o) {
    o = o || {};
    var cls =
      "input" +
      (o.invalid ? " invalid" : "") +
      (o.focus ? " focus" : "") +
      (o.readonly ? " readonly" : "");
    return (
      '<span class="' +
      cls +
      '"' +
      (o.width ? ' style="width:' + o.width + "px; min-width:0; flex:none" + '"' : "") +
      ">" +
      '<span class="tnum">' +
      value +
      "</span>" +
      (o.unit ? '<span class="unit">' + o.unit + "</span>" : "") +
      (o.icon ? icon(o.icon) : "") +
      "</span>"
    );
  }

  function breakRow(b) {
    return (
      '<div class="field" style="gap:4px"><div class="row" style="gap:8px">' +
      input(b.s, { width: 104, invalid: b.invalid, focus: b.focus }) +
      '<span class="muted">to</span>' +
      input(b.e, { width: 104, invalid: b.invalid, focus: b.focus }) +
      '<button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Remove break">' +
      icon("x") +
      "</button>" +
      (b.isNew ? '<span class="new-tag">New</span>' : "") +
      "</div>" +
      (b.error ? '<span class="error-text">' + b.error + "</span>" : "") +
      "</div>"
    );
  }

  function breaks(list, o) {
    o = o || {};
    return (
      '<div class="field"><label class="label">' +
      "Breaks" +
      (o.optional ? ' <span class="faint" style="font-weight:400">(optional)</span>' : "") +
      "</label>" +
      (list.length
        ? list.map(breakRow).join("")
        : '<span class="muted" style="font-size:13px">No breaks recorded.</span>') +
      '<div><button class="btn btn-ghost btn-sm" type="button" style="padding-left:6px">' +
      icon("plus") +
      "Add break</button></div>" +
      "</div>"
    );
  }

  function summary(presence, brk, worked) {
    return (
      '<div class="sum"><span>Presence <b>' +
      presence +
      "</b></span><span>Breaks <b>" +
      brk +
      "</b></span><span>Worked <b>" +
      worked +
      "</b></span></div>"
    );
  }

  function alert(text) {
    return (
      '<div class="notice notice-danger" role="alert" style="padding:10px 14px">' +
      icon("circle-alert") +
      '<div><p style="color:var(--text)">' +
      text +
      "</p></div></div>"
    );
  }

  // The "Add a session" dialog. `o.person` switches it to the admin's version.
  function entryDialog(o) {
    var e = o.errors || {};
    var h = '<div class="dialog">';
    h +=
      "<div><h2>" +
      (o.title || "Add a session") +
      '</h2><p class="card-desc" style="margin:6px 0 0">' +
      (o.desc || "For a day you did not clock. It is saved as entered.") +
      "</p></div>";
    if (o.person)
      h += field(
        "Person",
        '<span class="input readonly"><span class="row" style="gap:8px"><span class="avatar">' +
          fmt.initials(o.person) +
          "</span>" +
          o.person +
          "</span></span>"
      );
    h +=
      '<div style="display:grid; grid-template-columns: 1.4fr 1fr 1fr; gap:12px; align-items:start">' +
      field("Date", input(o.date, { icon: "calendar", invalid: !!e.date }), {
        hint: o.dateHint,
      }) +
      field("Start", input(o.start, { invalid: !!e.start, focus: o.focus === "start" })) +
      field("End", input(o.end, { invalid: !!e.end, focus: o.focus === "end" })) +
      "</div>";
    // The three fields are too narrow for a sentence, so their errors run the
    // full width under the row, in field order.
    [e.date, e.start, e.end].forEach(function (msg) {
      if (msg) h += '<span class="error-text" style="margin-top:-8px">' + msg + "</span>";
    });
    h +=
      '<div class="row" style="gap:10px; margin-top:-4px"><span class="switch sm' +
      (o.nextDay ? " on" : "") +
      '"></span><span class="label" style="font-size:13.5px">Ends the next day</span>' +
      (o.nextDay
        ? '<span class="hint" style="margin-left:4px">' +
          icon("moon", "tiny") +
          " " +
          o.nextDay +
          "</span>"
        : "") +
      "</div>";
    if (o.breaks) h += breaks(o.breaks, { optional: true });
    if (o.summary) h += summary(o.summary[0], o.summary[1], o.summary[2]);
    h +=
      '<div class="row between" style="align-items:center"><span class="hint" style="max-width:280px">' +
      (o.note || "Marked as entered for good. Your admin sees it that way.") +
      '</span><span class="row"><button class="btn btn-outline" type="button">Cancel</button><button class="btn btn-primary' +
      (o.invalid ? " disabled" : "") +
      '" type="button">' +
      icon("calendar-plus") +
      "Add session</button></span></div>";
    return h + "</div>";
  }

  function events(list) {
    return (
      '<div><div class="label" style="margin-bottom:8px">History</div><div class="events">' +
      list
        .map(function (ev) {
          return (
            '<div class="ev"><span class="t">' +
            ev[0] +
            "</span><span>" +
            ev[1] +
            '. <span class="muted" style="font-weight:500">' +
            ev[2] +
            "</span></span></div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function seg(when, kind, dur, open) {
    var isBreak = kind === "Break";
    return (
      '<div class="seg' +
      (isBreak ? " break" : "") +
      (open ? " open" : "") +
      '"><span class="when">' +
      when +
      '</span><span class="what">' +
      icon(isBreak ? "coffee" : "play") +
      kind +
      '</span><span class="dur">' +
      dur +
      "</span></div>"
    );
  }

  window.ss = {
    field: field,
    input: input,
    breaks: breaks,
    summary: summary,
    alert: alert,
    entryDialog: entryDialog,
    events: events,
    seg: seg,
  };
})();
