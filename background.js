chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background.js:", message); // Debugging

  if (message.type === "videoEnded") {
    console.log("Video ended message received from sender:", sender); // Debugging

    // Check if sender's tab information is available
    if (sender.tab && sender.tab.id) {
      console.log("Closing YouTube tab with ID:", sender.tab.id); 
      chrome.tabs.remove(sender.tab.id, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to close tab:", chrome.runtime.lastError.message); 
        } else {
          console.log("Tab closed successfully!");
        // Save the timestamp of closure
        chrome.storage.local.set({ lastClosedTime: Date.now() }, () => {
          console.log("Stored last closed time after closing tab.");
        });
        }
      });
    } else {
      console.warn("Sender tab information is missing."); 
    }
  }
});




// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  console.log("New tab created:", tab);

  // Check if the tab already has a URL
  if (tab.url && tab.url.includes("youtube.com")) {
    handleYouTubeTab(tab);
  } else {
    console.log("New tab has no URL yet, listening for updates...");
  }
});

// Listen for tab updates (e.g., when the URL becomes available)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes("youtube.com")) {
    console.log("YouTube tab detected on update:", tab);
    handleYouTubeTab(tab);
  }
});

// Function to handle YouTube tab logic
function handleYouTubeTab(tab) {
  const currentTime = Date.now();

  // check time from shutting down YT tab
  chrome.storage.local.get("lastClosedTime", (data) => {
    const lastClosedTime = data.lastClosedTime || 0;
    console.log("Last closed time retrieved from storage:", lastClosedTime);

    // do not allow YT tab to open before 2 minutes of shutting down
    if (currentTime - lastClosedTime < 2 * 60 * 1000) {
      console.log("YouTube was recently closed. Blocking this tab...");
      chrome.tabs.remove(tab.id, () => {
        console.log("YouTube tab closed automatically.");
      });
    } else {
      console.log("Allowed YouTube: More than 2 minutes have passed.");
    }
  });
}
