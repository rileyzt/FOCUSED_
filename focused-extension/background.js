// Function to check focus mode from backend
async function checkFocusMode() {
    try {
      let response = await fetch("http://localhost:5000/api/focus-status");
      let data = await response.json();
  
      if (data.focusActive) {
        enableBlocking();
      } else {
        disableBlocking();
      }
    } catch (error) {
      console.error("Error checking focus mode:", error);
    }
  }
  
  // Function to enable site blocking
  function enableBlocking() {
    chrome.declarativeNetRequest.updateEnabledRules({ enableRuleIds: [1, 2, 3] });
  }
  
  // Function to disable site blocking
  function disableBlocking() {
    chrome.declarativeNetRequest.updateEnabledRules({ disableRuleIds: [1, 2, 3] });
  }
  
  // Check focus mode every 10 seconds
  setInterval(checkFocusMode, 10000);
  