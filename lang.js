
function extend(obj, definitions) {
    const descriptors = Object.getOwnPropertyDescriptors(definitions);
    for (let [propName, descriptor] of Object.entries(descriptors)) {
        descriptor.enumerable = false;
        Object.defineProperty(obj, propName, descriptor);
    }
}

extend(HTMLElement.prototype, {
    getJSONAttribute(name) {
        let str = this.getAttribute(name);
        if(str) { return JSON.parse(str); }
        return null;
    },

    setJSONAttribute(name, json) {
        this.setAttribute(name, JSON.stringify(json));
        return json;
    }
});

extend(Array.prototype, {
    minInData() {
        return this.reduce((acc, dat) => Math.min(acc, dat[1].reduce((acc, num) => Math.min(acc, num), Infinity)), Infinity);
    },

    maxInData() {
        return this.reduce((acc, dat) => Math.max(acc, dat[1].reduce((acc, num) => Math.max(acc, num), -Infinity)), -Infinity);
    },
});
