
# Steam Price Checker
This is a browser extension that shows the price of a game on Instant Gaming when you visit the game's page on Steam store.
It scrapes the Instant Gaming page for the price and displays it next to the Steam price. It highlights it in green if 
the game is available on Instant Gaming and in red if it is not. It also allows you to select your country to automatically
add the VAT to the price found on Instant Gaming. Clicking on the price will take you to the Instant Gaming page for the game.

---

## Table of contents

- [Context](#Context)
- [Code structure](#code-structure) 
  - [manifest.json](#manifestjson)
  - [Background scripts](#background-scripts)
  - [Content scripts](#content-scripts)
  - [Popup](#popup)
- [How to run the extension locally](#how-to-run-the-extension-locally)
- [Examples](#examples)

## Context

I like playing video games, as a matter of fact, it's my favorite pastime activity. To do that, I obviously need to first
buy said games. Lately games have become more expensive, and in trying to save money, I have been looking for discounts and 
deals on games. I'm mainly using Steam for my games, and outside their major sales, there aren't many discounts. So I started
using a site called [Instant Gaming](https://www.instant-gaming.com/en/) which has a lot of discounts on games. The problem is
that I still like browsing the Steam store (because there's a SteamDB extension that displays the lowest recorded price on a game
from Steam discounts), and I don't want to have to go back and forth between the two sites. As such, I decided to make a browser extension
that would automatically show me the price of a game on Instant Gaming, when I visit the game's page on Steam store.


### Disclaimer

Firefox is currently my primary browser, as such this extension was designed to work on Firefox only for the time being. Since Chrome
and Firefox use different manifest versions, the extension will not work on Chrome. However, it may work on other browsers
that also use manifest version 2, but I have not tested it.

This is the official [documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension) I have used in writing my code. 

---

# Code structure

This is the code structure of the extension:

```
.
├── icons
│   ├── controller-16.svg
│   └── controller-48.svg
├── background  
│   ├── background.js
│   ├── ig-scraper.js
│   └── utils.js
├── content
│   ├── content.css
│   ├── content.js
│   └── ig-price.js
├── popup
│   ├── popup.css
│   ├── popup.html
│   ├── country-select.js
│   ├── ig-search-button.js9
│   └── popup.js
├── manifest.json
├── vat-rates.json
└── README.md

```

The files are organized into folders based on their purpose. The `manifest.json` file is the main file that tells the browser 
how to load the extension. For a better understanding of the code, I will explain each file in detail, starting with the `manifest.json` file.
# manifest.json

```
  "manifest_version": 2,
  "name": "Steam Price Checker",
  "version": "1.0",
  "description": "Checks for better prices on Instant Gaming.",
  "browser_specific_settings": {
    "gecko": {
      "id": "steam-price-checker@example.com"
    }
  },
  "icons": {
    "16": "icons/controller-16.svg",
    "48": "icons/controller-48.svg"
  },

  "permissions": [
    "storage",
    "https://store.steampowered.com/*",
    "https://www.instant-gaming.com/*"
  ]
```
This contains metadata for the extension, alongside the required permissions it needs to perform the tasks. The extension
accesses the Steam store and Instant Gaming pages to scrape the prices. The `storage` permission is used to save the user's
country and VAT rate, and the last game opened on the Steam store.

```
"content_scripts": [
    {
      "matches": [
        "https://store.steampowered.com/app/*"
      ],
      "js": [
        "content/ig-price.js",
        "background/ig-scraper.js",
        "content/content.js"
      ],
      "css": [
          "content/content.css"
      ]
    }
  ]
```
The `content_scripts` section tells the browser to inject the `ig-price.js`, `ig-scraper.js` and `content.js` scripts,
in this order, into the Steam store page. The scripts are only injected on the Steam store page, as specified in the `matches` section. 
The `content.js` is the main script that handles injecting the price into the page, using functions from the other two scripts.

```
  "background": {
    "scripts": [
      "background/utils.js",
      "background/ig-scraper.js",
      "background/background.js"
    ]
  },
```
The `background` section tells the browser to load the scripts in the background. This will be running all the time, much
like a server. When it receives a message from the `content` script, it will execute its code and send back the result.
```
"browser_action": {
    "default_popup": "popup/popup.html",
    "default_title": "Steam Price Checker",
    "default_icon": {
      "16": "icons/controller-16.svg",
      "48": "icons/controller-48.svg"
    }
  }
```
This is how we can add a popup to the extension. The `default_popup` section tells the browser to load the `popup.html`
file when the user clicks on the extension icon.

# Background scripts

A reminder of the structure of the background folder:
```
├── background  
│   ├── background.js
│   ├── ig-scraper.js
│   └── utils.js
```

The main background script is `background.js`. It receives requests from the `content.js` script, and sends back the result.

```
// background.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "searchInstantGaming") {
        handleIGSearchRequest(message.query, sendResponse);
        return true; // Needed for async sendResponse
    }
});
```

So far it only handles the request to get the price from Instant Gaming, but it can be extended to handle other requests as well.

The `ig-scraper.js` file contains the code to scrape the Instant Gaming page for the price. I decided to have this logic 
in a separate file, to keep the code organized and to prevent bloat in the `background.js` file. This way, if in the future
I want to scrape a different website, like [G2A](https://www.g2a.com/), I can just add the required functions (following a similar logic) in a new file and add another if branch in
the `background.js` file.
The `utils.js` file contains utility functions that are used in `ig-scraper.js` and could potentially be used in other files
that would handle scraping other websites.

Using a top-down view, the `handleIGSearchRequest` function is called from the `background.js` file when a request is made.
```
// ig-scraper.js
function handleIGSearchRequest(query, sendResponse) {
    const queryNormalized = normalize(query);
    const searchUrl = buildIGSearchUrl(queryNormalized);

    console.log("Searching InstantGaming for:", searchUrl);

    fetchPage(searchUrl)
        .then(doc => {
            const bestMatch = findBestMatch(doc, queryNormalized);
            if (!bestMatch) {
                sendResponse({ error: true, reason: "No suitable match found.", url: searchUrl });
                return;
            }
            console.log("Best match found:", bestMatch);

            fetchProductDetails(bestMatch.link, bestMatch.title, sendResponse);
        })
}
```

Step by step, it normalizes the query to remove any punctuation, and to lowercase the string using the `normalize` function. 

```
// utils.js
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')    // remove punctuation
        .replace(/\s+/g, ' ')        // collapse whitespace
        .trim();
}
```
Then the `buildIGSearchUrl` function builds the search URL using the normalized query and filters for Steam games on PC.

```
// ig-scraper.js
function buildIGSearchUrl(query) {
    const baseURL = "https://www.instant-gaming.com/en/search/";
    const searchParams = new URLSearchParams({
        "platform[]": "1",
        "type[]": "steam",
        "query": query
    });

    return `${baseURL}?${searchParams.toString()}`;
}
```

Then the `fetchPage` function retrieves the wanted page, and parses it returning a DOM object.

```
//utils.js
function fetchPage(url) {
    return fetch(url)
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        });
}
```

Usually there are multiple results that match the query, so we need to find the best match. The `findBestMatch` function
does this by comparing the title of the game in the search results with the normalized query. It uses the `getSimilarityScore`
function, which is a simple algorithm to find the best match, by checking the similarity of the words in the title with
the words in the query. It chooses the result with the highest score, and returns it.

```
// utils.js
function getSimilarityScore(a, b) {
    a = normalize(a);
    b = normalize(b);

    const aWords = new Set(a.split(' '));
    const bWords = new Set(b.split(' '));

    const sharedWords = [...aWords].filter(word => bWords.has(word));
    const score = sharedWords.length / Math.max(aWords.size, bWords.size);

    return score;
}

// ig-scraper.js
function findBestMatch(doc, queryNormalized) {
    const items = doc.querySelectorAll('.item');
    let bestMatch = null;
    let bestScore = 0;

    for (const item of items) {

        const titleEl = item.querySelector('.title');
        const linkEl = item.querySelector('a.cover');
        if (!titleEl || !linkEl) continue;

        const title = titleEl.textContent.trim();
        const link = linkEl.href;
        const score = getSimilarityScore(normalize(title), queryNormalized);

        console.log("Score for:", title, "=>", score.toFixed(2));

        if (score > bestScore) {
            bestMatch = { title, link };
            bestScore = score;
        }
    }

    return bestMatch;
}
```
After finding the best match, we need to get the price, and if it's in stock or not of the game. The `fetchProductDetails`
function does this by fetching the product page of the game, and parsing it to get the price and stock status. Once it
has the information, it sends the response back using the `sendResponse` function, all the way to the `content.js` file.
``` 
// ig-scraper.js
function fetchProductDetails(url, title, sendResponse) {
    fetchPage(url)
        .then(doc => {

            const priceEl = doc.querySelector('.total');
            const outOfStock = !!doc.querySelector('.subinfos .nostock');
            const price = priceEl ? priceEl.textContent.trim() : "Unknown";

            const response = {
                title,
                price,
                inStock: !outOfStock,
                url
            };

            console.log("Product details fetched:", response);
            sendResponse(response);
        })
        .catch(err => {
            console.error("Product page fetch failed:", err);
            sendResponse({ error: true });
        });
}
```

# Content scripts

A reminder of the structure of the background folder:
```
├── content
│   ├── content.css
│   ├── content.js
│   └── ig-price.js
```

This split is similar to the background folder, to keep the code organized and to prevent bloat in the `content.js` file.
It also allows easier expansion in the future for other websites if needed, like I mentioned in the background section.

The primary content script is `content.js`. It handles the injection of the price into the Steam store page, and it only
activates when the user is on a Steam store page. The script consists of an initial call to `updateInstantGamingPrice`, and
adding an event listener to listen for messages from the `popup` scripts, when the user changes the VAT country. The event
listener will call the `updateInstantGamingPrice` function again to update the price. Here we also save the name of the last browsed game in
the local storage, so that we can use it later when the user opens the [popup](#popup).
``` 
// content.js
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
```

Going more in depth, the `updateInstantGamingPrice` function is the one that actually renders the new price element on the page.
It first sends a message to the background script to get the price from Instant Gaming, and then it waits for the response.
Assuming the response is valid, it gets the VAT rate by calling the `getVatRate` function, and then it proceeds to `renderInstantGamingPrice`.
If the response is not valid, it checks if the error is because no match was found, and if so, it calls the `renderNotFoundPrice` function
```
// ig-price.js
function updateInstantGamingPrice(gameName) {
    browser.runtime.sendMessage({ type: "searchInstantGaming", query: gameName }).then(data => {
        const steamPriceEl = document.querySelector('.game_area_purchase_game_wrapper .game_purchase_price, .game_area_purchase_game_wrapper .discount_block');
        if (!steamPriceEl) return;

        if (data.error) {
            if(data.reason === "No suitable match found.") {
                renderNotFoundPrice(steamPriceEl, data.url);
            }
            return;
        }

        getVATRate().then(vat => {
            renderInstantGamingPrice(data, vat, steamPriceEl);
        });
    });
}
```

The `getVATRate` function retrieves the VAT rate from the `vat-rates.json` file, which contains the VAT rates for different countries.
The current country selected by the is saved in the local storage (details [here, initCountrySelector](#popup)), and the function retrieves it to get the correct VAT rate.

```
// ig-price.js
async function getVATRate() {
    const {vatCountry} = await browser.storage.local.get("vatCountry");
    if (!vatCountry) return null;

    const response = await fetch(browser.runtime.getURL("vat-rates.json"));
    const vatData = await response.json();
    return {rate: vatData[vatCountry] ?? 0, country: vatCountry};
}
```

Now the `renderInstantGamingPrice` function is the one that handles the injection of the price on the page.
It creates a new element if it doesn't exist, and sets its properties based on the data received from the background script.
It sets the color of the element based on the stock status, and it sets the text content to show the price and VAT rate.
Also, it sets the link to the Instant Gaming page for the game, so that when the user clicks on it, it opens the page in a new tab.

```
// ig-price.js
function renderInstantGamingPrice(data, vat, anchorElement) {
    let igEl = document.querySelector('.ig-vat-price');
    if (!igEl) {
        igEl = document.createElement('a');
        igEl.className = 'ig-vat-price';
        anchorElement.parentNode.appendChild(igEl);
    }

    const rawPrice = parseFloat(data.price.replace(/[^\d.]/g, ''));
    let label = `🛒 IG: ${data.price}`;

    if (!isNaN(rawPrice) && vat?.rate > 0) {
        const vatPrice = (rawPrice * (1 + vat.rate)).toFixed(2);
        label += ` (+${(vat.rate * 100).toFixed(0)}% VAT = ${vatPrice}€)`;
    }

    igEl.href = data.url;
    igEl.target = "_blank";
    igEl.style.color = data.inStock ? "limegreen" : "crimson";
    igEl.textContent = label;
}
```

The `renderNotFoundPrice` function is similar to the `renderInstantGamingPrice` function, but it sets the text content to show that
the game was not found on Instant Gaming. It also sets the color to red, and it sets the link to the Instant Gaming search page for the game
so that the user may look for it manually, using different filters.

```
// ig-price.js
function renderNotFoundPrice(anchorElement,url) {
    let igEl = document.querySelector('.ig-vat-price');
    if (!igEl) {
        igEl = document.createElement('a');
        igEl.className = 'ig-vat-price';
        anchorElement.parentNode.appendChild(igEl);
    }

    igEl.href = url;
    igEl.target = "_blank";
    igEl.style.color = "crimson";
    igEl.textContent = "🛒 IG: Not found";
}
```

# Popup

The popup is the last part of the extension. It allows the user to select the country they're in for the VAT rate, and it provides a button to
access Instant Gaming's search results of the last game opened on the Steam store. As soon as the DOM loads, we set up the search button,
and initialize the country select element.

```
// popup.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Popup script loaded");
    setupIGSearchButton();
    initCountrySelector();
});

```

Starting with the `setupIGSearch Button` function, we add an on click event listener to the button. When the button is clicked,
it retrieves the last game query from the local storage, builds the search URL using the `buildIGSearchUrl` function
(found in the [background scripts](#background-scripts)), and then it opens the URL in a new tab.

```
// ig-search-button.js
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
```

Lastly, the `initCountrySelector` function initializes the country select element. It retrieves the VAT rates from the `vat-rates.json` file,
then it populates the select element with the countries and their VAT rates, using the `populateCountryOptions` function.
It also retrieves the last selected country from the `local storage`, and sets it as the selected option in the select element. 
If no country is selected, it defaults to Romania (RO) and saves it in the `local storage`. When the user changes the country,
the `handleCountryChange` function is called, which updates the `local storage` with the new country and notifies the active tab
to update the price, through the `notifyTabsOfVATChange` function.

```
// country-select.js
async function initCountrySelector() {
    const vatData = await fetch(browser.runtime.getURL("vat-rates.json")).then(res => res.json());
    const select = document.getElementById("countrySelect");

    populateCountryOptions(select, vatData);

    const { vatCountry } = await browser.storage.local.get("vatCountry");
    const selected = vatCountry || "RO";
    if (!vatCountry) {
        await browser.storage.local.set({ vatCountry: selected });
        console.log("Default VAT country set to RO");
    }

    select.value = selected;

    select.addEventListener("change", () => handleCountryChange(select));
}

function populateCountryOptions(select, vatData) {
    for (const [code, rate] of Object.entries(vatData)) {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = `${getFlagEmoji(code)} ${code} (${(rate * 100).toFixed(1)}% VAT)`;
        select.appendChild(option);
    }
}

function handleCountryChange(select) {
    const selected = select.value;
    browser.storage.local.set({ vatCountry: selected }).then(() => {
        notifyTabsOfVATChange();
    });
}

function notifyTabsOfVATChange() {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id) {
            browser.tabs.sendMessage(tabs[0].id, { type: "vatCountryChanged" });
        }
    });
}
```

## How to run the extension locally
If you have the extension code, you can run inside your Firefox browser as follows:

1. Type ```about:debugging#/runtime/this-firefox``` in a new browser tab.
   This will open a settings page where you can see your extensions. Here you can add a temporary extension.
2. Click on ```Load temporary Add-on``` and select your extensions manifest file.
3. Now you should see your extension added, you can test by going to a different browser tab.


## Examples

### Popup
![Popup image](/readme-images/popup-example.png)

![Popup image](/readme-images/popup-example-expanded.png)


### Without the extension
![Without extension image](/readme-images/base-case.png)
### Game found on Instant Gaming, and the game is in stock
![Game in stock image](/readme-images/found-game-in-stock.png)
### Game found on Instant Gaming, but the game is out of stock
![Game out of stock image](/readme-images/found-game-out-stock.png)
### Game found on Instant Gaming, but the game is out of stock and the price is unknown
![Game unknown price image](/readme-images/out-stock-no-price.png)
### Game not found on Instant Gaming
![Game not found image](/readme-images/game-not-found.png)
