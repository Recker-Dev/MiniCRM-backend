const crypto = require('crypto');

// A helper function to create a stable JSON string for hashing
exports.stringifyAndSort = (obj) => {
    // Sorts the keys of the main object
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        // If the value is an array of objects (like 'items'), sort it too
        if (Array.isArray(obj[key])) {
            sortedObj[key] = obj[key].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        } else {
            sortedObj[key] = obj[key];
        }
    }
    return JSON.stringify(sortedObj);
};


exports.createChecksum = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};
