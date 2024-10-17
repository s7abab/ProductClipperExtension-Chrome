document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const resultDiv = document.getElementById('result');
    const dragButtons = document.querySelectorAll('.drag-btn');
    const closeButton = document.getElementById('closeButton');

    let isClipping = false;

    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        injectContentScriptAndSendMessage({action: "clipProductDetails"}, function(response) {
            if (response && response.productDetails) {
                fillFormWithProductDetails(response.productDetails);
            } else {
                resultDiv.textContent = "Unable to clip product details. Make sure you're on a product page.";
            }
        });
    });

    dragButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (!isClipping) {
                startClipping(targetId);
            } else {
                stopClipping();
            }
        });
    });

    closeButton.addEventListener('click', function() {
        window.close();
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "elementClipped") {
            handleClippedElement(request.data);
            stopClipping();
        }
    });

    function startClipping(targetId) {
        isClipping = true;
        injectContentScriptAndSendMessage({action: "startClipping", targetId: targetId}, function(response) {
            if (response && response.status === "Clipping started") {
                dragButtons.forEach(btn => btn.textContent = "Stop");
            }
        });
    }

    function stopClipping() {
        isClipping = false;
        injectContentScriptAndSendMessage({action: "stopClipping"}, function(response) {
            if (response && response.status === "Clipping stopped") {
                dragButtons.forEach(btn => btn.textContent = "Drag");
            }
        });
    }

    function handleClippedElement(data) {
        const targetId = data.targetId;
        document.getElementById(targetId).value = data.text;
    }

    function fillFormWithProductDetails(details) {
        document.getElementById('productName').value = details.name;
        document.getElementById('description').value = details.description;
        document.getElementById('unitCost').value = details.price;
        document.getElementById('sku').value = details.sku;
        
        resultDiv.innerHTML = `
            <h2>Clipped Product Details:</h2>
            <p><strong>Name:</strong> ${details.name}</p>
            <p><strong>Price:</strong> ${details.price}</p>
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>SKU:</strong> ${details.sku}</p>
        `;
    }
});

function injectContentScriptAndSendMessage(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['content.js']
        }, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                callback(null);
            } else {
                chrome.tabs.sendMessage(tabId, message, callback);
            }
        });
    });
}
