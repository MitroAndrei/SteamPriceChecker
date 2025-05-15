
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "searchInstantGaming") {
        handleIGSearchRequest(message.query, sendResponse);
        return true; // Needed for async sendResponse
    }
});
