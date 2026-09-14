/* Bethany's tribute wall. Vanilla JS, no libraries.
   Posts go to the family's Google Form (responses land in a Google Sheet in David's Drive).
   The wall shows only the Sheet's published "Wall" tab, which lists tributes marked "yes". */
(function () {
  "use strict";

  var CONFIG = {
    formAction: "https://docs.google.com/forms/d/e/1FAIpQLSfuet-bouf7K-rbukSq5K2d5xgAZi-QHQD6KB5FHWkDi4cz7w/formResponse",
    fields: {
      name: "entry.639450310",
      relation: "entry.490674266",
      message: "entry.1883384383"
    },
    /* published CSV of the Sheet's "Wall" tab only (Google refreshes it about every 5 minutes) */
    wallCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoTrAlPiH0in0WEZn8ISSX_1tUkf24ULX88Zu_BX6X-gedXiuVhDngf_pfxaDhx3x082DfOk8SvDJk/pub?gid=491111563&single=true&output=csv"
  };

  var form = document.getElementById("tribute-form");
  var statusEl = document.getElementById("tribute-status");
  var wall = document.getElementById("tribute-wall");

  /* ---------- CSV (handles quotes, commas, and line breaks inside a tribute) ---------- */
  function parseCsv(text) {
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text; /* textContent only: visitor text is never treated as HTML */
    return node;
  }

  function renderWall(rows) {
    wall.textContent = "";
    /* Wall tab columns: Date, Name, Relation, Message (row 1 is the header) */
    var tributes = rows.slice(1).filter(function (r) {
      return r.length >= 4 && r[1].trim() && r[3].trim() && r[0].indexOf("#") !== 0;
    });
    if (!tributes.length) {
      wall.appendChild(el("p", "tribute-empty", "No tributes yet. You are welcome to share the first."));
      return;
    }
    tributes.forEach(function (r) {
      var card = el("article", "tribute-card");
      r[3].trim().split(/\n\s*\n/).forEach(function (para) {
        card.appendChild(el("p", "tribute-message", para.trim()));
      });
      var meta = el("p", "tribute-meta");
      meta.appendChild(el("span", "tribute-name", r[1].trim()));
      if (r[2].trim()) meta.appendChild(el("span", "tribute-relation", r[2].trim()));
      if (r[0].trim()) meta.appendChild(el("span", "tribute-date", r[0].trim()));
      card.appendChild(meta);
      wall.appendChild(card);
    });
  }

  function loadWall() {
    /* the changing "t" tag asks Google for its newest copy; without it some servers answer with a copy up to 5 minutes old */
    fetch(CONFIG.wallCsv + "&t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) { renderWall(parseCsv(text)); })
      .catch(function () {
        wall.textContent = "";
        wall.appendChild(el("p", "tribute-empty", "Tributes could not load right now. Please try again later."));
      });
  }

  /* ---------- sharing a tribute ---------- */
  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", !!isError);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var relation = form.elements.relation.value.trim();
      var message = form.elements.message.value.trim();

      /* spam trap filled in: act as if it worked, send nothing */
      if (form.elements.website.value) {
        form.reset();
        setStatus("Thank you. Your tribute will appear after the family reads it.");
        return;
      }
      if (!name || !message) {
        setStatus("Please add your name and your tribute.", true);
        (name ? form.elements.message : form.elements.name).focus();
        return;
      }

      var body = new URLSearchParams();
      body.append(CONFIG.fields.name, name);
      body.append(CONFIG.fields.relation, relation);
      body.append(CONFIG.fields.message, message);

      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      setStatus("Sending…");

      /* Google Forms does not allow reading the reply from another site, so a sent request counts as success. */
      fetch(CONFIG.formAction, { method: "POST", mode: "no-cors", body: body })
        .then(function () {
          form.reset();
          setStatus("Thank you. Your tribute will appear after the family reads it.");
        })
        .catch(function () {
          setStatus("Your tribute did not send. Please check your connection and try again.", true);
        })
        .then(function () { button.disabled = false; });
    });
  }

  if (wall) loadWall();
})();
