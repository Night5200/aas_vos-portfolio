import {build} from 'esbuild';
import {cp,mkdir,rm} from 'node:fs/promises';
await rm('vercel-dist',{recursive:true,force:true});await mkdir('vercel-dist',{recursive:true});await cp('public','vercel-dist',{recursive:true});
await build({entryPoints:['client/editor.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:['es2022'],outfile:'vercel-dist/editor/editor.js'});
console.log('Vercel build ready: static portfolio, private editor and API functions.');
