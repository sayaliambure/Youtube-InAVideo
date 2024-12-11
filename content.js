console.log("Content script loaded on:", window.location.href);

let currentUrl = location.href;

function observeUrlChange() {
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      console.log("URL changed to:", currentUrl);
      initializeScript(); // Reinitialize the script on URL change
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

observeUrlChange();
initializeScript();

function initializeScript() {
  const video = document.querySelector("video");

  if (video) {
    console.log("Video element detected.");
    video.addEventListener("ended", () => {
      console.log("Video ended.");
      chrome.runtime.sendMessage({ type: "videoEnded" }, () => {
        
      });
    });
  } else {
    console.log("No video element found on the page.");
  }
}

// Check if the DOM is ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeScript();
} else {
  document.addEventListener("DOMContentLoaded", initializeScript);
}
