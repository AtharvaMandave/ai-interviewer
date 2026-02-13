const pdf = require('pdf-parse');
console.log('Type:', typeof pdf);
console.log('Keys:', Object.keys(pdf));
console.log('Is Default Function?', typeof pdf.default === 'function');

try {
    const fs = require('fs');
    // Create a dummy PDF buffer (not a real PDF, but enough to see if function gets called)
    // Actually pdf-parse might throw if buffer is invalid, but we just want to see if `pdf()` is callable.
    // better to just check if it IS a function.
} catch (e) {
    console.error(e);
}
