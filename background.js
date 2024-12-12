// Initialize settings
chrome.storage.local.get(["enabled", "watchedVideos", "maxVideos"], (data) => {
  if (data.enabled === undefined) chrome.storage.local.set({ enabled: true });
  if (data.maxVideos === undefined) chrome.storage.local.set({ maxVideos: 1 });
  if (data.watchedVideos === undefined) chrome.storage.local.set({ watchedVideos: 0 });
});

// Listen for video end messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background.js:", message);

  if (message.type === "videoEnded") {
    chrome.storage.local.get(["enabled", "watchedVideos", "maxVideos"], (data) => {
      const watchedVideos = data.watchedVideos || 0;
      const maxVideos = data.maxVideos || 1; // Default to 1 if not set

      console.log(`Watched videos: ${watchedVideos+1}, Max videos: ${maxVideos}`);

      if (data.enabled && watchedVideos + 1 >= maxVideos) {
        // Close the YouTube tab if the limit is reached
        if (sender.tab && sender.tab.id) {
          console.log("Closing YouTube tab after max videos reached:", sender.tab.id);
          chrome.tabs.remove(sender.tab.id, () => {
            console.log("YouTube tab closed after reaching max video limit.");
          });
        }
        // Reset counter after closing the tab
        chrome.storage.local.set(
          { 
            watchedVideos: 0,
            maxVideos: 1,
            lastClosedTime: Date.now(),
            alertShown: false, // Reset variables for the next session
           });
      } 
      else {
        // Increment the counter
        chrome.storage.local.set({ watchedVideos: watchedVideos + 1 }, ()=>{
          console.log('video watched: ', watchedVideos+1)
        });
      }
    });
  }
});


// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  // console.log("New tab created:", tab);

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

function handleYouTubeTab(tab) {
  const currentTime = Date.now();
  console.log('handle function called')
  chrome.storage.local.get(["enabled", "alertShown", "lastClosedTime", "maxVideos"], (data) => {
    const isEnabled = data.enabled !== false; // Default to enabled
    const alertShown = data.alertShown || false;
    const lastClosedTime = data.lastClosedTime || 0;
    const maxVideos = data.maxVideos || 1; // Default to 1

    if (!isEnabled) {
      console.log("Extension is disabled. Allowing YouTube tab.");
      return;
    }

    console.log('inside function')
    // Check if YouTube was recently closed
    if (currentTime - lastClosedTime < 0.5 * 60 * 1000) { 
      console.log("YouTube was recently closed. Blocking this tab...");
      chrome.tabs.remove(tab.id, () => {
        console.log("YouTube tab closed automatically.");

        // Show alert on another tab or open Google if none exist
        // chrome.tabs.query({}, (tabs) => {
        //   chrome.tabs.create({ url: "https://www.google.com" }, (newTab) => {            
        //     // Inject the script after the tab is fully loaded
        //     chrome.tabs.onUpdated.addListener(function listener(updatedTabId, updateInfo) {
        //       if (updatedTabId === newTab.id && updateInfo.status === "complete") {
        //         chrome.scripting.executeScript({
        //           target: { tabId: newTab.id },
        //           func: () => {
        //             console.log('new tab loaded')
        //             const remainingTime = Math.ceil((0.5 * 60 * 1000 - (Date.now() - lastClosedTime)) / 1000);
        //             alert(`YouTube is disabled for ${remainingTime} seconds.`);
        //           },
        //         });
        //         // Remove the listener after executing the script
        //         chrome.tabs.onUpdated.removeListener(listener);
        //       }
        //     });
        //   });          
        // });

      });
    } else if (isEnabled && !alertShown) {
      // Show alert on the first open YouTube tab
      console.log('you can watch ', maxVideos)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (maxVideos) => {
          alert(`YouTube Extension is enabled. You can watch up to ${maxVideos} videos.`);
        },
        args: [maxVideos],
      });
      chrome.storage.local.set({ alertShown: true });
    }
  });
}

