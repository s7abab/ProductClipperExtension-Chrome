document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const resultDiv = document.getElementById('result');
    const selectButtons = document.querySelectorAll('.select-btn');

    let isSelecting = false;
    let currentTargetId = null;

    // Inject content script when the side panel is opened
    chrome.runtime.sendMessage({ action: "injectContentScript" }, (response) => {
        if (response && response.success) {
            console.log("Content script injected successfully");
        } else {
            console.error("Failed to inject content script:", response ? response.error : "Unknown error");
        }
    });

    selectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (!isSelecting) {
                startSelecting(targetId);
            } else {
                stopSelecting();
            }
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log("Message received in sidepanel:", request);
        if (request.action === "textSelected") {
            handleSelectedText(request.data);
            stopSelecting();
        }
    });

    function startSelecting(targetId) {
        console.log("Starting selection for", targetId);
        isSelecting = true;
        currentTargetId = targetId;
        sendMessageToContentScript({action: "startSelecting", targetId: targetId}, function(response) {
            if (response && response.status === "Selection started") {
                selectButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === targetId) {
                        btn.textContent = "Cancel";
                        btn.style.backgroundColor = "#f44336";
                    }
                });
            }
        });
    }

    function stopSelecting() {
        console.log("Stopping selection");
        isSelecting = false;
        currentTargetId = null;
        sendMessageToContentScript({action: "stopSelecting"}, function(response) {
            if (response && response.status === "Selection stopped") {
                selectButtons.forEach(btn => {
                    btn.textContent = "Select";
                    btn.style.backgroundColor = "";
                });
            }
        });
    }

    function handleSelectedText(data) {
        console.log("Handling selected text:", data);
        const targetId = data.targetId;
        document.getElementById(targetId).value = data.text;
    }
});

function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found");
            callback(null);
            return;
        }

        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, message, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
                callback(null);
            } else {
                callback(response);
            }
        });
    });
}
