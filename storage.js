
export function loadJSON(key) {
    const stringValue = localStorage.getItem(key);

    if (!stringValue) {
        return undefined;
    }

    return JSON.parse(stringValue);
}

export function saveJSON(key, json) {
    const stringValue = JSON.stringify(json, undefined, 2);

    localStorage.setItem(key, stringValue);
}
