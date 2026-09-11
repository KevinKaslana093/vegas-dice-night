import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const f of ['dist/index.html','dist/style.css','dist/app.mjs','dist/core.mjs']){if(!fs.statSync(f).size)throw Error(`Empty ${f}`);}
for(const f of ['dist/app.mjs','dist/core.mjs'])execFileSync(process.execPath,['--check',f]);
const html=fs.readFileSync('dist/index.html','utf8');
for(const match of html.matchAll(/(?:href|src)="\.\/([^"?#]+)"/g))if(!fs.existsSync('dist/'+match[1]))throw Error('Missing '+match[1]);
console.log('Static files and JavaScript verified.');
