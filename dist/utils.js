"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAsyncGeneratorEmpty = checkAsyncGeneratorEmpty;
exports.prettyDuration = prettyDuration;
exports.zip = zip;
async function* prefixAsyncGenerator(prefix, gen) {
    yield prefix;
    for await (const item of gen) {
        yield item;
    }
}
async function checkAsyncGeneratorEmpty(gen) {
    const { done, value } = await gen.next();
    let isEmpty;
    let out_gen;
    if (done) {
        isEmpty = true;
        out_gen = gen;
    }
    else {
        isEmpty = false;
        out_gen = prefixAsyncGenerator(value, gen);
    }
    return { isEmpty, generator: out_gen };
}
function prettyDuration(seconds) {
    seconds = Math.ceil(seconds);
    let minutes = Math.floor(seconds / 60);
    if (minutes === 0) {
        return `${seconds}s`;
    }
    seconds = seconds % 60;
    const hours = Math.floor(minutes / 60);
    if (hours === 0) {
        return `${minutes}m ${seconds}s`;
    }
    minutes = minutes % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}
function zip(a, b) {
    return a.map((obj, idx) => [obj, b[idx]]);
}
