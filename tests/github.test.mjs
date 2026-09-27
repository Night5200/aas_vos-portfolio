import test from 'node:test';
import assert from 'node:assert/strict';
import {github,savePortfolio} from '../lib/storage.mjs';
import {POST as upload} from '../api/upload.js';
test('GitHub credentials stay server-side and conflicts are reported',async()=>{
 process.env.GITHUB_TOKEN='test-only';
 await github('lib/defaults.json',{},async(url,options)=>{
  assert.match(url,/Night5200/);assert.equal(options.headers.Authorization,'Bearer test-only');
  return Response.json({sha:'abc'});
 });
 await assert.rejects(github('lib/defaults.json',{method:'PUT'},async()=>new Response('',{status:409})),e=>e.status===409);
 await assert.rejects(savePortfolio({},null),e=>e.status===409);
 delete process.env.GITHUB_TOKEN;
});
test('image uploads require login',async()=>{
 assert.equal((await upload(new Request('https://example.com/api/upload',{method:'POST'}))).status,401);
});
