const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'../dist'),out=process.argv[2]||path.join(__dirname,'../output/vegas-dice-night.html');
const mime=file=>file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.ogg')?'audio/ogg':file.endsWith('.webp')?'image/webp':'image/png';
const data=file=>'data:'+mime(file)+';base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
const blob=file=>'embeddedAsset('+JSON.stringify(mime(file))+','+JSON.stringify(fs.readFileSync(path.join(root,'assets',file)).toString('base64'))+')';
const runtime='function embeddedAsset(mime,encoded){const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return URL.createObjectURL(new Blob([bytes],{type:mime}));}\n';
const modules=['core','identity','music','cinema','claims','decisions','exam','tutorial','encore','finale','basics','journey','experience','app'].map(name=>{
 let s=fs.readFileSync(path.join(root,name+'.mjs'),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
 if(name==='cinema'||name==='music')s=s.replace(/'\.\/assets\/([^']+)'/g,(_,file)=>blob(file));
 if(name==='app')s=s.replace(/const ART=\[([^\n]+?)\];/,(_,list)=>'const ART=['+[...list.matchAll(/'([^']+)'/g)].map(m=>blob(m[1])).join(',')+'];').replaceAll('src="./assets/${ART[i]}"','src="${ART[i]}"').replaceAll("ART.map(x=>'./assets/'+x)",'ART');
 return s;
});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="\.\/([^" ]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8').replace(/url\(['"]?\.\/assets\/([^'"\)]+)['"]?\)/g,(_,asset)=>'url("'+data(asset)+'")')+'</style>');
html=html.replace('<script type="module" src="./app.mjs"></script>',()=>'<script>'+runtime+modules.join('\n')+'</script>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log('Offline game exported: '+out);
