function setupIGSearchButton() {
    console.log("Setting up InstantGaming search button");
    const button = document.getElementById("openIGSearch");
    button.addEventListener("click", handleIGSearchButtonClick)
}

function handleIGSearchButtonClick() {
    console.log("InstantGaming search button clicked");
    browser.storage.local.get("lastGameQuery").then(data => {
        const { lastGameQuery } = data;

        console.log("Last game query:", lastGameQuery);

        if (!lastGameQuery) {
            alert("No recent game name found.");
            return;
        }

        const searchUrl = buildIGSearchUrl(normalize(lastGameQuery));

        console.log("Opening InstantGaming search:", searchUrl);
        browser.tabs.create({ url: searchUrl });

    })
}