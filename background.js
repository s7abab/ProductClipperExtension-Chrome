chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectContentScript") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true });
                    }
                });
            } else {
                sendResponse({ success: false, error: "No active tab found" });
            }
        });
        return true; // Indicates that the response will be sent asynchronously
    } else if (request.action === "closeSidePanel") {
        chrome.sidePanel.setOptions({ path: 'about:blank' });
    }
});
