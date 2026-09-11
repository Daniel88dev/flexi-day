// Renders the shell chrome around a screen so 03 to 05 share one sidebar,
// top bar and phone frame. 01-shell.html spells the same markup out by hand
// so the shell itself can be reviewed as plain HTML.
(function () {
  function item(id, ic, label, active, extra) {
    return (
      '<a class="nav-item' +
      (active === id ? " active" : "") +
      '" href="#">' +
      icon(ic) +
      "<span>" +
      label +
      "</span>" +
      (extra || "") +
      "</a>"
    );
  }

  var DANA = { name: "Dana Holt", org: "Studio Modrá" };

  // The three dashboard flags: icon and the label the legend uses.
  window.FLAGS = {
    autoclosed: { icon: "clock-alert", label: "Auto-closed" },
    exclockin: { icon: "calendar-off", label: "Clocked in on an excluded day" },
    open: { icon: "hourglass", label: "Still open" },
  };

  // How the bottom bar's centre disc reflects the clock state.
  window.clockDisc = function (state, elapsed) {
    if (state === "in") return { cls: "in", icon: "log-out", label: elapsed || "3:37" };
    if (state === "break") return { cls: "break", icon: "coffee", label: "On break" };
    if (state === "off") return { cls: "off", icon: "clock", label: "Clock" };
    return { cls: "out", icon: "clock", label: "Clock" };
  };

  window.shellFrame = function (o) {
    var u = o.user || DANA;
    var initials = fmt.initials(u.name);
    var roles = o.roles || { org: true, group: true };
    var a = o.active;
    var h =
      '<div class="app shell' + (o.collapsed ? " collapsed" : "") + '"><aside class="sidebar">';
    h +=
      '<div class="sidebar-head"><a class="logo" href="#"><span class="logo-mark"></span><span>flexi<b>day</b></span></a>' +
      '<button class="btn btn-ghost btn-icon btn-sm" type="button">' +
      icon(o.collapsed ? "panel-left" : "panel-left-close") +
      "</button></div>";
    h +=
      '<div class="nav-label">Time off</div>' +
      item("dashboard", "layout-grid", "Dashboard", a) +
      item("requests", "calendar", "Requests", a, '<span class="count">2</span>') +
      item("report", "chart-column", "Report", a) +
      item("groups", "users", "Groups", a) +
      item("sync", "refresh-cw", "Calendar sync", a);
    h +=
      '<div class="nav-label">Attendance</div>' +
      item("my", "timer", "My attendance", a, o.live ? '<span class="live"></span>' : "");
    if (roles.org || roles.group) h += item("team", "calendar-range", "Team attendance", a);
    if (roles.org) {
      h +=
        '<div class="nav-label">Organization</div>' +
        item("org", "building-2", "Organization", a) +
        item("billing", "credit-card", "Billing", a);
    }
    h +=
      '<div class="sidebar-foot">' +
      item("settings", "settings", "Settings", a) +
      (o.support ? item("support", "life-buoy", "Support", a) : "") +
      '<div class="user-block"><span class="avatar lg">' +
      initials +
      "</span><div>" +
      '<div class="name">' +
      u.name +
      '</div><div class="org">' +
      u.org +
      "</div></div></div></div></aside>";
    h +=
      '<div class="main"><header class="topbar"><span class="crumb">' +
      o.crumb[0] +
      ' <span class="faint">/</span> <b>' +
      o.crumb[1] +
      '</b></span><span class="grow"></span>' +
      '<button class="btn btn-primary btn-sm" type="button">' +
      icon("plus") +
      "New request</button>" +
      '<button class="btn btn-outline btn-icon btn-sm" type="button">' +
      icon("bell") +
      "</button>" +
      '<button class="btn btn-outline btn-icon btn-sm" type="button">' +
      icon("sun") +
      "</button>" +
      '<button class="btn btn-outline btn-icon btn-sm" type="button">' +
      icon("globe") +
      "</button>" +
      '<button class="btn btn-ghost btn-sm" type="button" style="padding:0 8px 0 4px"><span class="avatar">' +
      initials +
      "</span>" +
      icon("chevron-down") +
      "</button></header>" +
      '<div class="content">' +
      o.content +
      "</div></div></div>";
    return h;
  };

  window.phoneFrame = function (o) {
    var u = o.user || DANA;
    var disc = clockDisc(o.clock || "out", o.elapsed);
    function tab(id, ic2, lbl) {
      return (
        '<a class="tab-item' +
        (o.active === id ? " active" : "") +
        '" href="#">' +
        icon(ic2) +
        "<span>" +
        lbl +
        "</span></a>"
      );
    }
    return (
      '<div class="app" style="position:relative; height:100%">' +
      '<div class="status-bar"><span>12:19</span><span style="font-size:12px">5G</span></div>' +
      '<header class="m-top"><a class="logo" href="#"><span class="logo-mark"></span><span>flexi<b>day</b></span></a>' +
      '<span class="grow"></span><button class="btn btn-outline btn-icon btn-sm" type="button">' +
      icon("bell") +
      '</button><span class="avatar">' +
      fmt.initials(u.name) +
      "</span></header>" +
      '<div class="m-content">' +
      o.content +
      "</div>" +
      '<nav class="bottombar">' +
      tab("dashboard", "layout-grid", "Dashboard") +
      tab("requests", "calendar", "Requests") +
      '<a class="clock-action ' +
      disc.cls +
      '" href="#"><span class="disc">' +
      icon(disc.icon) +
      "</span><span>" +
      disc.label +
      "</span></a>" +
      tab("attendance", "timer", "Attendance") +
      tab("more", "menu", "More") +
      "</nav>" +
      (o.sheet || "") +
      '<div class="home-indicator"></div></div>'
    );
  };

  window.balanceChip = function (min, cls) {
    var k = min > 0 ? "flag-ok" : min < 0 ? "flag-danger" : "flag-muted";
    return '<span class="flag ' + k + (cls ? " " + cls : "") + '">' + fmt.hm(min, true) + "</span>";
  };
})();
