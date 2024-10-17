console.log("Content script loaded");

let isSelecting = false;
let currentTargetId;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received in content script:", request);
    if (request.action === "startSelecting") {
        isSelecting = true;
        currentTargetId = request.targetId;
        enableTextSelection();
        sendResponse({status: "Selection started"});
    } else if (request.action === "stopSelecting") {
        isSelecting = false;
        disableTextSelection();
        sendResponse({status: "Selection stopped"});
    } else if (request.action === "clipProductDetails") {
        const productDetails = {
            name: getProductName(),
            price: getProductPrice(),
            description: getProductDescription(),
            sku: getProductSKU()
        };
        sendResponse({productDetails: productDetails});
    }
    return true; // Keep the message channel open for asynchronous response
});

function enableTextSelection() {
    document.addEventListener('mouseup', handleTextSelection);
    document.body.style.cursor = 'text';
}

function disableTextSelection() {
    document.removeEventListener('mouseup', handleTextSelection);
    document.body.style.cursor = 'default';
}

function handleTextSelection() {
    if (!isSelecting) return;

    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        console.log("Selected text:", selectedText);
        chrome.runtime.sendMessage({
            action: "textSelected",
            data: {
                text: selectedText,
                targetId: currentTargetId
            }
        });
    }
}

// Product detail extraction functions
function getProductName() {
    const nameElement = document.querySelector('h1') || document.querySelector('.product-name');
    return nameElement ? nameElement.textContent.trim() : 'N/A';
}

function getProductPrice() {
    const priceElement = document.querySelector('.price') || document.querySelector('#product-price');
    return priceElement ? priceElement.textContent.trim() : 'N/A';
}

function getProductDescription() {
    const descElement = document.querySelector('.product-description') || document.querySelector('#product-details');
    return descElement ? descElement.textContent.trim() : 'N/A';
}

function getProductSKU() {
    const skuElement = document.querySelector('.sku') || document.querySelector('#product-sku');
    return skuElement ? skuElement.textContent.trim() : 'N/A';
}
