// popup.js
const statusEl = document.getElementById("status");
const stateEl = statusEl.querySelector(".state");
const messageEl = statusEl.querySelector(".message");
const retryBtn = document.getElementById("retry");

function render(status) {
  const state = status?.state || "idle";
  const message = status?.message || "";
  statusEl.className = `status ${state}`;
  stateEl.textContent = state.replace(/_/g, " ");
  messageEl.textContent = message;

  retryBtn.disabled = !(state === "verification_required" || state === "password_required");
}

function refresh() {
  chrome.runtime
    .sendMessage({ type: "TP_GET_STATUS" })
    .then(render)
    .catch(() => render({ state: "idle", message: "Background worker unavailable." }));
}

retryBtn.addEventListener("click", () => {
  retryBtn.disabled = true;
  chrome.runtime
    .sendMessage({ type: "TP_RETRY" })
    .then((res) => {
      if (res && res.ok === false) {
        render({ state: "error", message: res.error || "Retry failed." });
      }
    })
    .catch(() => {
      render({ state: "error", message: "Could not reach the background worker." });
    });
});

refresh();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.status) render(changes.status.newValue);
});
