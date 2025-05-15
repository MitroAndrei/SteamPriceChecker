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

function buildIGSearchUrl(query) {
    const baseURL = "https://www.instant-gaming.com/en/search/";
    const searchParams = new URLSearchParams({
        "platform[]": "1",
        "type[]": "steam",
        "query": query
    });

    return `${baseURL}?${searchParams.toString()}`;
}

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

