
const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports like '../src' or '../src/...' with '../src'
    content = content.replace(/from ['"]\.\.\/src(.*)['"]/g, (match, p1) => {
        if (!p1 || p1 === '' || p1 === '/index') {
            return `from '../src'`;
        }
        return match;
    });

    fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            replaceInFile(filePath);
        }
    }
}

const distTestsDir = path.join(__dirname, '../dist/tests');
if (fs.existsSync(distTestsDir)) {
    walkDir(distTestsDir);
    console.log('✅ Fixed test import paths');
}
