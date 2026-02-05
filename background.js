// background.js
const API_URL = "http://localhost:5000/api/check_url";
const API_KEY = "REPLACE_WITH_SAME_KEY_AS_SERVER"; // WARNING: visible in extension; prefer user-provided

// Keep small cache in extension to reduce network calls
const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour ms

function cacheGet(url) {
  const item = cache[url];
  if (!item) return null;
  if (Date.now() - item.t > CACHE_TTL) {
    delete cache[url];
    return null;
  }
  return item.v;
}

function cacheSet(url, value) {
  cache[url] = { v: value, t: Date.now() };
}

// monitor completed navigations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab.url || "";
  if (!url.startsWith("http")) return;
  const cached = cacheGet(url);
  if (cached) {
    updateBadge(tabId, cached);
    return;
  }
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ url })
  })
  .then(r => r.json())
  .then(data => {
    if (data && !data.error) {
      cacheSet(url, data);
      updateBadge(tabId, data);
      if (data.label === "phishing") {
        // optionally show notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "Potential Phishing detected",
          message: `This site might be unsafe: ${tab.title || url}`
        });
        // optionally inject warning banner (see popup or scripting.executeScript)
        injectWarning(tabId, data);
      }
    }
  })
  .catch(err => console.error("PhishCheck error:", err));
});

function updateBadge(tabId, data) {
  const label = data.label || (data.prediction === 1 ? "safe" : "phish");
  const text = (label === "safe") ? "" : "⚠";
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: label === "safe" ? "#0f0" : "#f00" });
}

function injectWarning(tabId, data) {
  const code = `
    (function(){
      if (document.getElementById('phishcheck-warning')) return;
      const div = document.createElement('div');
      div.id = 'phishcheck-warning';
      div.style = 'position:fixed;left:0;top:0;width:100%;background:#ffdddd;color:#900;padding:12px;text-align:center;font-size:16px;z-index:999999;';
      div.innerText = 'Warning: This page is flagged as potentially phishing. Proceed with caution.';
      const btn = document.createElement('button');
      btn.textContent = 'Dismiss';
      btn.style = 'margin-left:16px;padding:6px;';
      btn.onclick = function(){ div.remove(); };
      div.appendChild(btn);
      document.body.prepend(div);
    })();`;
    chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
          if (document.getElementById('phishcheck-warning')) return;
          const div = document.createElement('div');
          div.id = 'phishcheck-warning';
          div.style = 'position:fixed;left:0;top:0;width:100%;background:#ffdddd;color:#900;padding:12px;text-align:center;font-size:16px;z-index:999999;';
          div.innerText = 'Warning: This page is flagged as potentially phishing. Proceed with caution.';
          const btn = document.createElement('button');
          btn.textContent = 'Dismiss';
          btn.style = 'margin-left:16px;padding:6px;';
          btn.onclick = () => div.remove();
          div.appendChild(btn);
          document.body.prepend(div);
      }
  });  
}
