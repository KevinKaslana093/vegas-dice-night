import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CINEMA_ASSETS} from '../dist/cinema.mjs';
for(const src of Object.values(CINEMA_ASSETS).flat()){if(!fs.statSync('dist/'+src.replace('./','')).size)throw Error('Missing cinema asset '+src);}
for(const f of ['dist/index.html','dist/style.css','dist/app.mjs','dist/core.mjs']){if(!fs.statSync(f).size)throw Error(`Empty ${f}`);}
for(const f of ['dist/app.mjs','dist/core.mjs','dist/cinema.mjs','dist/tutorial.mjs'])execFileSync(process.execPath,['--check',f]);
const html=fs.readFileSync('dist/index.html','utf8');
for(const match of html.matchAll(/(?:href|src)="\.\/([^"?#]+)"/g))if(!fs.existsSync('dist/'+match[1]))throw Error('Missing '+match[1]);
console.log('Static files and JavaScript verified.');
