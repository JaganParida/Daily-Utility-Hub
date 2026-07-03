const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages', 'tools');

function updateTitles(dir) {
    const files = fs.readdirSync(dir);
    
    let updatedCount = 0;
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            updateTitles(filePath);
        } else if (file.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Regex to find the old title class and capture any extra classes at the end (like flex, items-center, font-sans, etc)
            const regex = /<h1 className="text-(?:xl|2xl) md:text-(?:2xl|3xl|4xl) font-bold tracking-tight text-foreground([^"]*)"/g;
            
            if (regex.test(content)) {
                // Replace with the new premium V3 typography classes
                const newContent = content.replace(regex, '<h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground$1"');
                
                fs.writeFileSync(filePath, newContent, 'utf8');
                updatedCount++;
                console.log(`Updated title in: ${file}`);
            }
        }
    });
    
    return updatedCount;
}

console.log("Starting bulk title update...");
const count = updateTitles(directoryPath);
console.log(`Successfully upgraded typography in ${count} tool components!`);
