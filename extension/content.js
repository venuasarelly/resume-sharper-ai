/**
 * Content script: runs detection on demand and reports results to the popup.
 */
(function () {
  "use strict";

  function scan() {
    const { detectFields } = window.WorkdayFieldDetector;
    const { fields, unmatched } = detectFields(document);
    return {
      url: location.href,
      scannedAt: new Date().toISOString(),
      detected: fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        confidence: f.confidence,
        evidence: f.evidence,
        ref: f.ref,
      })),
      unmatchedCount: unmatched.length,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "DETECT_FIELDS") {
      try {
        sendResponse({ ok: true, result: scan() });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    }
    return true;
  });
})();
