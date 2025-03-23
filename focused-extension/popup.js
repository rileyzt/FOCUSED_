document.addEventListener("DOMContentLoaded", function () {
    const timerDisplay = document.getElementById("timerDisplay");
    const focusDurationInput = document.getElementById("focusDuration");
    const startFocusBtn = document.getElementById("startFocus");
    const stopFocusBtn = document.getElementById("stopFocus");
    const siteInput = document.getElementById("siteInput");
    const addSiteBtn = document.getElementById("addSiteBtn");
    const siteList = document.getElementById("siteList");
    const blockAllBtn = document.getElementById("blockAll");
    const unblockAllBtn = document.getElementById("unblockAll");

    let focusEndTime = null;
    let countdownInterval;

    // Load existing blocked sites and focus status
    chrome.storage.sync.get(["blockedSites", "focusActive", "focusEndTime"], function (data) {
        updateSiteList(data.blockedSites || []);
        if (data.focusActive) {
            focusEndTime = data.focusEndTime;
            updateTimer();
            countdownInterval = setInterval(updateTimer, 1000);
            startFocusBtn.disabled = true;
            stopFocusBtn.disabled = false;
        }
    });

    // Start Focus Session
    startFocusBtn.addEventListener("click", function () {
        let minutes = parseInt(focusDurationInput.value);
        if (!minutes || minutes <= 0) return alert("Enter a valid duration!");

        focusEndTime = Date.now() + minutes * 60000;
        chrome.storage.sync.set({ focusActive: true, focusEndTime }, () => {
            updateTimer();
            countdownInterval = setInterval(updateTimer, 1000);
            startFocusBtn.disabled = true;
            stopFocusBtn.disabled = false;
            enableBlocking();
        });
    });

    // Stop Focus Session
    stopFocusBtn.addEventListener("click", function () {
        chrome.storage.sync.set({ focusActive: false }, () => {
            clearInterval(countdownInterval);
            timerDisplay.innerText = "00:00";
            startFocusBtn.disabled = false;
            stopFocusBtn.disabled = true;
            disableBlocking();
        });
    });

    // Update Countdown Timer
    function updateTimer() {
        let remainingTime = focusEndTime - Date.now();
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            chrome.storage.sync.set({ focusActive: false }, () => {
                timerDisplay.innerText = "00:00";
                alert("Focus session complete! Take a break.");
                disableBlocking();
            });
            return;
        }
        let minutes = Math.floor(remainingTime / 60000);
        let seconds = Math.floor((remainingTime % 60000) / 1000);
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Enable Blocking When Focus is ON
    function enableBlocking() {
        chrome.storage.sync.get("blockedSites", function (data) {
            let blockedSites = data.blockedSites || [];
            updateBlockingRules(blockedSites);
        });
    }

    // Disable Blocking When Focus Ends
    function disableBlocking() {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1000, 1001, 1002, 1003, 1004]
        });
    }

    // Add Site to Blocklist
    addSiteBtn.addEventListener("click", function () {
        let site = siteInput.value.trim();
        if (!site) return;

        chrome.storage.sync.get("blockedSites", function (data) {
            let blockedSites = data.blockedSites || [];
            if (!blockedSites.includes(site)) {
                blockedSites.push(site);
                chrome.storage.sync.set({ blockedSites }, () => {
                    updateSiteList(blockedSites);
                    enableBlocking();
                });
            }
        });

        siteInput.value = "";
    });

    // Remove Site from Blocklist
    function removeSite(site) {
        chrome.storage.sync.get("blockedSites", function (data) {
            let blockedSites = data.blockedSites || [];
            blockedSites = blockedSites.filter(s => s !== site);
            chrome.storage.sync.set({ blockedSites }, () => {
                updateSiteList(blockedSites);
                enableBlocking();
            });
        });
    }

    // Update UI for Blocked Sites
    function updateSiteList(blockedSites) {
        siteList.innerHTML = "";
        blockedSites.forEach(site => {
            const li = document.createElement("li");
            li.className = "site-item";
            li.innerHTML = `${site} <button class="remove-btn" data-site="${site}">❌</button>`;
            siteList.appendChild(li);
        });

        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function () {
                removeSite(this.dataset.site);
            });
        });
    }

    // Block All Sites
    blockAllBtn.addEventListener("click", function () {
        chrome.storage.sync.set({ blockedSites: ["*"] }, function () {
            alert("All sites are now blocked.");
            enableBlocking();
        });
    });

    // Unblock All Sites
    unblockAllBtn.addEventListener("click", function () {
        chrome.storage.sync.set({ blockedSites: [] }, function () {
            alert("All sites are now unblocked.");
            disableBlocking();
            siteList.innerHTML = "";
        });
    });

    // Update extension blocking rules
    function updateBlockingRules(blockedSites) {
        let rules = blockedSites.map((site, index) => ({
            id: 1000 + index,
            priority: 1,
            action: { type: "redirect", redirect: { url: "http://localhost:3000/blocked" } },
            condition: { urlFilter: `*://*.${site}/*`, resourceTypes: ["main_frame"] }
        }));

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1000, 1001, 1002, 1003, 1004],
            addRules: rules
        });
    }
});

