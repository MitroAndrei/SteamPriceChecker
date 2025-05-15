function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')    // remove punctuation
        .replace(/\s+/g, ' ')        // collapse whitespace
        .trim();
}

function fetchPage(url) {
    return fetch(url)
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        });
}

function getSimilarityScore(a, b) {
    a = normalize(a);
    b = normalize(b);

    const aWords = new Set(a.split(' '));
    const bWords = new Set(b.split(' '));

    const sharedWords = [...aWords].filter(word => bWords.has(word));
    const score = sharedWords.length / Math.max(aWords.size, bWords.size);

    return score;
}