const out = document.getElementById("out");

document.getElementById("scan").addEventListener("click", async () => {
  out.textContent = "Scanning…";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    out.textContent = "No active tab.";
    return;
  }
  chrome.tabs.sendMessage(tab.id, { type: "DETECT_FIELDS" }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      out.textContent = "Open a Workday application page and try again.";
      return;
    }
    const { detected, unmatchedCount } = response.result;
    out.innerHTML = "";
    if (!detected.length) {
      out.textContent = "No known fields detected on this page.";
      return;
    }
    for (const f of detected) {
      const div = document.createElement("div");
      div.className = "row";
      div.innerHTML = `<span class="conf">${f.confidence}%</span>
        <div class="label"></div>
        <div class="key"></div>
        <div class="meta"></div>`;
      div.querySelector(".label").textContent = f.label;
      div.querySelector(".key").textContent = f.key;
      div.querySelector(".meta").textContent = f.evidence
        .map((e) => `${e.source}: ${e.text}`)
        .join(" · ");
      out.appendChild(div);
    }
    const note = document.createElement("div");
    note.className = "meta";
    note.style.marginTop = "8px";
    note.textContent = `${unmatchedCount} other field(s) not recognised.`;
    out.appendChild(note);
  });
});
