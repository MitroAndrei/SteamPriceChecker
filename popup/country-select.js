
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

function getFlagEmoji(countryCode) {
    return countryCode
        .toUpperCase()
        .replace(/./g, char =>
            String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0))
        );
}
