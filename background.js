// let isLocked = false;
// let lockoutEnd = 0;

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Received message:", message); // Debugging

//   if (message.type === "toggleExtension") {
//     const isEnabled = message.isEnabled;
//     console.log("Extension enabled:", isEnabled); // Debugging
//   }

//   if (message.type === "videoEnded" && !isLocked) {
//     console.log("Video ended, starting lockout."); // Debugging
//     isLocked = true;
//     lockoutEnd = Date.now() + 1 * 60 * 1000; // 5 minutes
//     chrome.tabs.remove(sender.tab.id); // Close YouTube tab
//   }

//   if (message.type === "checkLockout") {
//     const remainingTime = lockoutEnd - Date.now();
//     console.log("Checking lockout:", { isLocked, remainingTime }); // Debugging
//     sendResponse({ isLocked, remainingTime });
//   }
// });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background.js:", message); // Debugging

  if (message.type === "videoEnded") {
    console.log("Video ended message received from sender:", sender); // Debugging

    // Check if sender's tab information is available
    if (sender.tab && sender.tab.id) {
      console.log("Closing YouTube tab with ID:", sender.tab.id); // Debugging
      chrome.tabs.remove(sender.tab.id, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to close tab:", chrome.runtime.lastError.message); // Debugging
        } else {
          console.log("Tab closed successfully!"); // Debugging
        }
      });
    } else {
      console.warn("Sender tab information is missing."); // Debugging
    }
  }
});


// Store the time when YouTube was last closed
chrome.storage.local.get("lastClosedTime", (data) => {
  const lastClosedTime = data.lastClosedTime;
  console.log("Last closed time from storage:", lastClosedTime);
});

/// Listen for tab closure (YouTube tab)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Check if the closed tab was a YouTube tab
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url && tab.url.includes("youtube.com")) {
      const currentTimestamp = Date.now();
      console.log("YouTube tab closed at:", currentTimestamp);
      // Save the current timestamp in chrome.storage.local
      chrome.storage.local.set({ lastClosedTime: currentTimestamp }, () => {
        console.log("Stored last closed time:", currentTimestamp);
      });
    }
  });
});

// Listen for new tab creation (Check if the new tab is YouTube)
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    const currentTime = Date.now();

    // Get the last closed time from chrome.storage.local
    chrome.storage.local.get("lastClosedTime", (data) => {
      const lastClosed = data.lastClosedTime;
      console.log("Last closed time from storage:", lastClosed);
      
      // If the timestamp is missing, allow the YouTube tab to open
      if (!lastClosed) {
        console.log("No last closed time found. Allowing YouTube.");
        return;
      }

      // Check if YouTube was recently closed (within 5 minutes)
      if (currentTime - lastClosed < 1 * 60 * 1000) {
        console.log("YouTube is locked for the next 5 minutes.");
        // Close the YouTube tab immediately after opening
        chrome.tabs.remove(tab.id, () => {
          console.log("YouTube tab closed automatically.");
        });
      } else {
        console.log("5 minutes have passed, YouTube can be opened.");
      }
    });
  }
});
