
export async function loadJSON(key) {
    const stringValue = await localforage.getItem(key);

    if (!stringValue) {
        return undefined;
    }

    return JSON.parse(stringValue);
}

export async function saveJSON(key, json) {
    const stringValue = JSON.stringify(json, undefined, 2);

    return await localforage.setItem(key, stringValue);
}

export async function removeItem(key) {
    return localforage.removeItem(key);
}
