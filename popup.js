// Popup button elements
const toggleButton = document.getElementById("toggle");
const statusText = document.getElementById("status");

// Update the button and status text based on current state
function updateUI(isEnabled) {
  toggleButton.innerText = isEnabled ? "Disable" : "Enable";
  statusText.innerText = `Status: ${isEnabled ? "Enabled" : "Disabled"}`;
}

// Initialize UI
chrome.storage.local.get("isEnabled", (data) => {
  const isEnabled = data.isEnabled || false; // Default to false
  console.log("Initial state:", isEnabled); 
  updateUI(isEnabled);
});

// Handle toggle button click
toggleButton.addEventListener("click", () => {
  chrome.storage.local.get("isEnabled", (data) => {
    const isEnabled = !(data.isEnabled || false); // Toggle state
    chrome.storage.local.set({ isEnabled }, () => {
      console.log("State updated:", isEnabled); 
      updateUI(isEnabled);
      chrome.runtime.sendMessage({ type: "toggleExtension", isEnabled });
    });
  });
});

// Set default value for maxVideos if not set
chrome.storage.local.get("maxVideos", (data) => {
  const maxVideos = data.maxVideos || 1; // Default to 1
  document.getElementById("videoCount").value = maxVideos;
});

// Save settings when user clicks "Save"
document.getElementById("saveSettings").addEventListener("click", () => {
  const videoCount = parseInt(document.getElementById("videoCount").value, 10);

  if (videoCount > 0) {
    chrome.storage.local.set({ maxVideos: videoCount }, () => {
      console.log(`Max videos set to: ${videoCount}`);
      alert(`Max videos limit: ${videoCount}`);
    });
  } else {
    // If the input is invalid, reset to default
    chrome.storage.local.set({ maxVideos: 1 }, () => {
      alert("Invalid input. Defaulting to 1 max video.");
    });
  }
});
