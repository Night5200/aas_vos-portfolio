import {build} from 'esbuild';
import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
await rm('vercel-dist',{recursive:true,force:true});await mkdir('vercel-dist',{recursive:true});await cp('public','vercel-dist',{recursive:true});
await build({entryPoints:['client/editor.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:['es2022'],outfile:'vercel-dist/editor/editor.js'});
const index=await readFile('vercel-dist/index.html','utf8');
await writeFile('vercel-dist/index.html',index.replace('</head>','<link rel="stylesheet" href="/logo-enhancements.css"></head>').replace('</body>','<script type="module" src="/logo-enhancements.js"></script></body>'));
console.log('Vercel build ready: static portfolio, private editor and API functions.');
