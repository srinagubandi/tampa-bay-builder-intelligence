import fs from 'node:fs';
const required=['index.html','src/main.tsx','src/styles.css','server/index.js','server/db.js','server/census.js','server/scoring.js','railway.json','VERSION'];
for(const file of required){if(!fs.existsSync(file)) throw new Error(`Missing ${file}`)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); if(pkg.version!==fs.readFileSync('VERSION','utf8').trim()) throw new Error('VERSION mismatch');
console.log(`Validation passed for v${pkg.version}`);
