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

