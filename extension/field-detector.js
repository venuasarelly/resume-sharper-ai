/**
 * Workday field detection.
 *
 * Detection is purely semantic: we score each form control using its label,
 * aria-label / aria-labelledby, placeholder, name, id, title, autocomplete and
 * nearby visible text. No fixed CSS selectors, no element indexes — Workday
 * markup changes constantly, so nothing here depends on DOM structure.
 */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------- schema */

  // Each canonical field lists positive signal patterns and disqualifiers.
  const FIELD_SCHEMA = [
    {
      key: "personal.firstName",
      must: [/\bfirst\s*name\b/, /\bgiven\s*name\b/, /\bforename\b/, /\bfirstname\b/, /\bfname\b/],
      hints: [/\blegal\s*name\b/],
      autocomplete: ["given-name"],
      not: [/\blast\b/, /\bfamily\b/, /\bsurname\b/, /\bmiddle\b/, /\bcompany\b/, /\bschool\b/],
    },
    {
      key: "personal.lastName",
      must: [/\blast\s*name\b/, /\bfamily\s*name\b/, /\bsurname\b/, /\blastname\b/, /\blname\b/],
      autocomplete: ["family-name"],
      not: [/\bfirst\b/, /\bgiven\b/, /\bmiddle\b/],
    },
    {
      key: "personal.email",
      must: [/\be-?mail\b/, /\bemail\s*address\b/],
      autocomplete: ["email"],
      types: ["email"],
      not: [/\bconfirm\b/, /\bverify\b/, /\bre-?enter\b/],
    },
    {
      key: "personal.phone",
      must: [/\bphone\b/, /\bmobile\b/, /\btelephone\b/, /\bcell\b/, /\btel\b/],
      autocomplete: ["tel", "tel-national"],
      types: ["tel"],
      not: [/\bcountry\s*code\b/, /\bextension\b/, /\bdevice\s*type\b/, /\bphone\s*type\b/],
    },
    {
      key: "links.linkedin",
      must: [/\blinked\s*-?\s*in\b/, /linkedin/],
      not: [],
    },
    {
      key: "links.github",
      must: [/\bgit\s*-?\s*hub\b/, /github/],
      not: [],
    },
  ];

  /* --------------------------------------------------------------- helpers */

  const clean = (s) =>
    String(s || "")
      .replace(/[\u00a0\s]+/g, " ")
      .replace(/[*:•]+/g, " ")
      .trim();

  const norm = (s) =>
    clean(s)
      .toLowerCase()
      // split camelCase / snake_case / kebab-case identifiers into words
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_\-.\[\]/]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  function isVisible(el) {
    if (!el || !el.getClientRects) return false;
    if (el.disabled || el.type === "hidden") return false;
    if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = global.getComputedStyle ? global.getComputedStyle(el) : null;
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    return true;
  }

  function collectFields(root) {
    const doc = root || global.document;
    const out = [];
    const nodes = doc.querySelectorAll("input, textarea, select");
    for (const el of nodes) {
      const type = (el.getAttribute("type") || el.type || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "file"].includes(type)) continue;
      if (!isVisible(el)) continue;
      out.push(el);
    }
    return out;
  }

  /** Text of the <label> associated with the control, by any legitimate means. */
  function labelText(el) {
    const doc = el.ownerDocument;
    const parts = [];

    if (el.labels && el.labels.length) {
      for (const l of el.labels) parts.push(l.textContent);
    }
    if (el.id) {
      const forLabel = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (forLabel) parts.push(forLabel.textContent);
    }
    const wrapping = el.closest && el.closest("label");
    if (wrapping) parts.push(wrapping.textContent);

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const n = doc.getElementById(id);
        if (n) parts.push(n.textContent);
      }
    }
    return clean(parts.join(" "));
  }

  const controlCount = (node) =>
    node.querySelectorAll ? node.querySelectorAll("input, textarea, select").length : 0;

  /**
   * Visible text physically near the control. We only walk outward while the
   * container still holds this single control, so text belonging to a
   * neighbouring field can never be attributed here.
   */
  function nearbyText(el) {
    const chunks = [];
    let node = el.parentElement;
    let depth = 0;
    while (node && depth < 4 && controlCount(node) <= 1) {
      // Text of preceding siblings tends to be the visual label in Workday.
      let sib = node.previousElementSibling;
      let seen = 0;
      while (sib && seen < 2) {
        if (controlCount(sib) === 0) {
          const t = clean(sib.textContent);
          if (t && t.length <= 80) chunks.push(t);
        }
        sib = sib.previousElementSibling;
        seen++;
      }
      const own = clean(node.textContent);
      if (own && own.length <= 120) chunks.push(own);
      node = node.parentElement;
      depth++;
    }
    return dedupe(clean(chunks.join(" | "))).slice(0, 400);
  }

  /** Collapse repeated phrases produced by nested label/container text. */
  function dedupe(text) {
    const seen = new Set();
    return text
      .split(" | ")
      .filter((part) => {
        const k = part.toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .join(" | ");
  }

  /** Human-friendly label without duplicated fragments. */
  function displayLabel(text) {
    const words = clean(text).split(" ");
    const half = Math.floor(words.length / 2);
    if (half > 0 && words.slice(0, half).join(" ") === words.slice(half, half * 2).join(" ")) {
      return words.slice(0, half).concat(words.slice(half * 2)).join(" ");
    }
    return clean(text);
  }


  /** All signal strings for a control, each weighted by how trustworthy it is. */
  function signalsFor(el) {
    return [
      { source: "label", weight: 1.0, text: labelText(el) },
      { source: "aria-label", weight: 0.95, text: el.getAttribute("aria-label") },
      { source: "placeholder", weight: 0.8, text: el.getAttribute("placeholder") },
      { source: "name", weight: 0.75, text: el.getAttribute("name") },
      { source: "id", weight: 0.6, text: el.getAttribute("id") },
      { source: "data-automation-id", weight: 0.7, text: el.getAttribute("data-automation-id") },
      { source: "title", weight: 0.6, text: el.getAttribute("title") },
      { source: "nearby-text", weight: 0.5, text: nearbyText(el) },
    ]
      .map((s) => ({ ...s, text: clean(s.text), normalized: norm(s.text) }))
      .filter((s) => s.normalized.length > 0);
  }

  function scoreField(el, signals, spec) {
    const autocomplete = norm(el.getAttribute("autocomplete"));
    const type = (el.getAttribute("type") || el.type || "text").toLowerCase();

    let best = 0;
    const matched = [];

    for (const sig of signals) {
      if (spec.not && spec.not.some((rx) => rx.test(sig.normalized))) {
        // A disqualifier in a high-trust signal kills the candidate outright.
        if (sig.weight >= 0.75) return null;
        continue;
      }
      const hit = (spec.must || []).some((rx) => rx.test(sig.normalized));
      const soft = (spec.hints || []).some((rx) => rx.test(sig.normalized));
      if (hit || soft) {
        const score = sig.weight * (hit ? 1 : 0.55);
        matched.push({ source: sig.source, text: sig.text.slice(0, 120) });
        if (score > best) best = score;
      }
    }

    if (best === 0) return null;

    // Corroborating attributes nudge confidence up.
    let bonus = 0;
    if (spec.autocomplete && spec.autocomplete.includes(autocomplete)) bonus += 0.12;
    if (spec.types && spec.types.includes(type)) bonus += 0.08;
    if (matched.length > 1) bonus += Math.min(0.1, 0.04 * (matched.length - 1));

    const confidence = Math.max(0, Math.min(1, best + bonus));
    return { confidence, matched };
  }

  /* ------------------------------------------------------------------ main */

  /**
   * Detect Workday application fields in a document.
   * @returns {{fields: Array, unmatched: Array}}
   */
  function detectFields(root) {
    const elements = collectFields(root);
    const candidates = [];
    const unmatched = [];

    elements.forEach((el, index) => {
      const signals = signalsFor(el);
      let bestSpec = null;

      for (const spec of FIELD_SCHEMA) {
        const result = scoreField(el, signals, spec);
        if (result && (!bestSpec || result.confidence > bestSpec.confidence)) {
          bestSpec = { key: spec.key, ...result };
        }
      }

      const label = displayLabel(
        labelText(el) ||
          clean(el.getAttribute("aria-label")) ||
          nearbyText(el).split(" | ")[0] ||
          clean(el.getAttribute("placeholder")) ||
          clean(el.getAttribute("name")) ||
          "Untitled field",
      );


      if (!bestSpec) {
        unmatched.push({ label, index, element: el });
        return;
      }

      candidates.push({
        key: bestSpec.key,
        label,
        value: el.value || "",
        confidence: Math.round(bestSpec.confidence * 100),
        evidence: bestSpec.matched,
        element: el,
        // Stable-ish reference for later fill; never used for detection.
        ref: el.id || el.getAttribute("name") || `field-${index}`,
      });
    });

    // One control per canonical key: keep the most confident match.
    const byKey = new Map();
    for (const c of candidates) {
      const existing = byKey.get(c.key);
      if (!existing || c.confidence > existing.confidence) byKey.set(c.key, c);
    }

    const fields = Array.from(byKey.values()).sort((a, b) => b.confidence - a.confidence);
    return { fields, unmatched };
  }

  const api = { detectFields, FIELD_SCHEMA, normalizeText: norm };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.WorkdayFieldDetector = api;
})(typeof window !== "undefined" ? window : globalThis);
