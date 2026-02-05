const urlDiv = document.getElementById('url');
const statusDiv = document.getElementById('status');
const rawPre = document.getElementById('raw');
const checkBtn = document.getElementById('check');
const openDetailsBtn = document.getElementById('open_details');

let latestData = null;
rawPre.style.display = 'none';

// Get current active tab URL and show it
async function getCurrentTabUrl() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '';
}

// Update UI with phishing check results
function updateStatus(data) {
  latestData = data;
  urlDiv.textContent = data.url;
  if (data.prediction === 1) {
    statusDiv.textContent = `Safe - Probability: ${(data.probability_safe * 100).toFixed(2)}%`;
    statusDiv.className = "status safe";
  } else {
    statusDiv.textContent = `Phishing Risk - Probability: ${(data.probability_phishing * 100).toFixed(2)}%`;
    statusDiv.className = "status phish";
  }
  rawPre.textContent = JSON.stringify(data, null, 2);
}

// Handle check button click
checkBtn.addEventListener('click', async () => {
  statusDiv.textContent = 'Checking...';
  statusDiv.className = "status";

  try {
    const url = await getCurrentTabUrl();
    urlDiv.textContent = url;

    const response = await fetch('http://localhost:5000/api/check_url', {  // replace with your backend URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (response.ok) {
      updateStatus(data);
    } else {
      statusDiv.textContent = `Error: ${data.error || 'Unknown error'}`;
      statusDiv.className = "status phish";
    }
  } catch (err) {
    statusDiv.textContent = `Fetch error: ${err.message}`;
    statusDiv.className = "status phish";
  }
});

// Toggle raw JSON display on open details button click
openDetailsBtn.addEventListener('click', () => {
  if (rawPre.style.display === 'none') {
    rawPre.style.display = 'block';
  } else {
    rawPre.style.display = 'none';
  }
});

// Initialize popup showing current tab URL
(async () => {
  const url = await getCurrentTabUrl();
  urlDiv.textContent = url;
  statusDiv.textContent = 'Click "Check" to test this page';
})();
