
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



async function getVATRate() {
    const {vatCountry} = await browser.storage.local.get("vatCountry");
    if (!vatCountry) return null;

    const response = await fetch(browser.runtime.getURL("vat-rates.json"));
    const vatData = await response.json();
    return {rate: vatData[vatCountry] ?? 0, country: vatCountry};
}

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
