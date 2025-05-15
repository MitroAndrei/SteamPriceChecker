console.log("Extension script loaded on:", window.location.href);

function getSteamGameName() {
    const titleEl = document.querySelector(".apphub_AppName");
    return titleEl ? titleEl.textContent.trim() : null;
}

function main() {
    const gameName = getSteamGameName();
    if (!gameName) return;

    browser.storage.local.set({lastGameQuery: gameName});
    updateInstantGamingPrice(gameName)

    browser.runtime.onMessage.addListener((message) => {
        if (message.type === "vatCountryChanged") {
            console.log("VAT country changed — updating display");
            updateInstantGamingPrice(gameName);
        }
    });
}


main();