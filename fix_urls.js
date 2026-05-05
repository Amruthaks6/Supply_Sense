const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findAndReplace(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000')) {
                // Determine import path
                const relativeToSrc = path.relative(path.dirname(fullPath), srcDir);
                // if it's in src/pages, relativeToSrc is '..'. If in src, it's '.'
                let importPath = relativeToSrc === '' ? './api/config' : `${relativeToSrc}/api/config`;
                importPath = importPath.replace(/\\/g, '/');

                // Check if API_URL is already imported
                if (!content.includes('import API_URL from')) {
                    // Add import after the first few imports (or at the top)
                    const importStatement = `import API_URL from '${importPath}';\n`;
                    const reactImportMatch = content.match(/import .* from 'react';?/);
                    if (reactImportMatch) {
                        content = content.replace(reactImportMatch[0], `${reactImportMatch[0]}\n${importStatement}`);
                    } else {
                        content = importStatement + content;
                    }
                }

                // Replace 'http://localhost:5000' with API_URL
                // Replace `http://localhost:5000/...` with `${API_URL}/...`
                content = content.replace(/`http:\/\/localhost:5000(.*?)`/g, '`${API_URL}$1`');
                
                // Replace 'http://localhost:5000/api/...' with `${API_URL}/api/...`
                content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, '`${API_URL}$1`');
                
                // Replace io('http://localhost:5000') with io(API_URL)
                content = content.replace(/io\(['"`]http:\/\/localhost:5000['"`]\)/g, 'io(API_URL)');

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

findAndReplace(srcDir);
console.log('Done!');
