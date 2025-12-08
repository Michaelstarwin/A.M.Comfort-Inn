const fs = require('fs');
// Read as UTF-8 (or UCS-2 if it was indeed PowerShell output, but let's try reading what we have)
try {
    let content = fs.readFileSync('debug-output.txt', 'utf8');
    // If it looks like binary garbage, it might be UTF-16LE. 
    // But let's assume 'type' converted it? Or just read it directly.
    if (content.indexOf('\0') !== -1) {
        content = fs.readFileSync('debug-output.txt', 'utf16le');
    }
    console.log(content);
} catch (e) {
    console.error(e);
}
