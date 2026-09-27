import test from 'node:test';import assert from 'node:assert/strict';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createSession,isOwner,checkPassword,sessionCookie} from '../lib/auth.mjs';
import {loadPortfolio,savePortfolio} from '../lib/storage.mjs';
import {validate} from '../lib/validation.mjs';
import {PUT as save} from '../api/save.js';import {POST as upload} from '../api/upload.js';import {POST as login} from '../api/login.js';
import defaults from '../lib/defaults.json' with {type:'json'};
import {videoSource} from '../public/video-source.js';
test('hosted links convert to trusted players and preserve Vimeo private hashes',()=>{
 assert.match(videoSource('https://youtu.be/dQw4w9WgXcQ').src,/youtube-nocookie.com\/embed\/dQw4w9WgXcQ/);
 assert.equal(videoSource('https://youtube.com/shorts/dQw4w9WgXcQ').portrait,true);
 assert.equal(new URL(videoSource('https://vimeo.com/123456789/abcdef').src).searchParams.get('h'),'abcdef');
 for(const link of ['https://home.wistia.com/medias/e4a27b971d','https://fast.wistia.net/embed/iframe/e4a27b971d','https://example.wistia.com/m/e4a27b971d']){
  assert.equal(videoSource(link).provider,'Wistia');assert.match(videoSource(link).src,/embed\/iframe\/e4a27b971d/);
 }
 assert.equal(videoSource('https://cdn.example.com/movie.mp4?token=test').kind,'direct');
 for(const link of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://example.com/page','https://home.wistia.com/s/unknown','https://user:pass@example.com/movie.mp4'])assert.equal(videoSource(link),null);
 const p=structuredClone(defaults);p.projects[0].video='https://home.wistia.com/medias/e4a27b971d';p.projects[0].videoShape='portrait';assert.equal(validate(p),p);
 p.projects[0].video='https://example.com/page';assert.throws(()=>validate(p));
});
import {signedUpload} from '../api/upload.js';
test('OIDC store connection supports reading and saving without a legacy token',async()=>{
 const saved={BLOB_READ_WRITE_TOKEN:process.env.BLOB_READ_WRITE_TOKEN,BLOB_STORE_ID:process.env.BLOB_STORE_ID};
 try{
  delete process.env.BLOB_READ_WRITE_TOKEN;process.env.BLOB_STORE_ID='store_test';
  const store={get:async()=>null,put:async()=>({etag:'oidc-revision'})};
  assert.equal((await loadPortfolio(store)).configured,true);
  assert.equal((await savePortfolio(defaults,null,store)).revision,'oidc-revision');
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('presigned uploads require login and reject cross-origin requests',async()=>{
 const body={type:'blob.generate-presigned-url',payload:{}};
 assert.equal((await upload(req('/api/upload',body))).status,401);
 assert.equal((await upload(req('/api/upload',body,'portfolio_session='+createSession(),'https://attacker.test'))).status,403);
});
test('signed upload grants only one media path, type and size limit',async()=>{
 const path='media/12345678-1234-1234-1234-123456789abc.png';
 let issued;
 const result=await signedUpload(path,JSON.stringify({type:'image/png',size:100}),async options=>{issued=options;return {test:true};});
 assert.equal(issued.pathname,path);assert.deepEqual(issued.operations,['put']);
 assert.deepEqual(issued.allowedContentTypes,['image/png']);assert.equal(issued.maximumSizeInBytes,20*1024**2);
 assert.equal(result.urlOptions.allowOverwrite,false);
 await assert.rejects(signedUpload('portfolio/content.json','{}'),e=>e.status===400);
 await assert.rejects(signedUpload(path,JSON.stringify({type:'video/mp4',size:100})),e=>e.status===400);
 await assert.rejects(signedUpload(path,JSON.stringify({type:'image/png',size:21*1024**2})),e=>e.status===400);
});
process.env.ADMIN_PASSWORD='Test1234';process.env.SESSION_SECRET='a-separate-test-session-secret-of-at-least-32-characters';
function req(path,body={},cookie='',origin='https://portfolio.test'){return new Request('https://portfolio.test'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});}
test('signed sessions reject tampering, expiry, password changes and forged Sites headers',()=>{const token=createSession();const request=new Request('https://portfolio.test',{headers:{Cookie:'portfolio_session='+token}});assert.equal(isOwner(request),true);assert.equal(isOwner(new Request('https://portfolio.test',{headers:{Cookie:'portfolio_session='+token+'x'}})),false);assert.equal(isOwner(request,Date.now()+13*60*60*1000),false);assert.equal(isOwner(new Request('https://portfolio.test',{headers:{'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'adnan@zerodesignstudios.com'}})),false);const original=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD+='rotated';assert.equal(isOwner(request),false);process.env.ADMIN_PASSWORD=original;assert.match(sessionCookie(request,token),/HttpOnly; SameSite=Strict;.*Secure/);});
test('login handles wrong passwords, CSRF and valid credentials',async()=>{assert.equal((await login(req('/api/login',{password:'incorrect'}))).status,401);assert.equal((await login(req('/api/login',{password:process.env.ADMIN_PASSWORD},'','https://attacker.test'))).status,403);const result=await login(req('/api/login',{password:process.env.ADMIN_PASSWORD}));assert.equal(result.status,200);assert.match(result.headers.get('set-cookie'),/portfolio_session=/);assert.equal(checkPassword('wrong'),false);});
test('write and upload endpoints require owner session and same origin',async()=>{assert.equal((await save(req('/api/save'))).status,401);const uploadRequest={type:'blob.generate-client-token',payload:{pathname:'media/test.mp4'}};assert.equal((await upload(req('/api/upload',uploadRequest))).status,401);const cookie='portfolio_session='+createSession();assert.equal((await save(req('/api/save',{},cookie,'https://attacker.test'))).status,403);assert.equal((await upload(req('/api/upload',uploadRequest,cookie,'https://attacker.test'))).status,403);});
test('public sample portfolio works before Blob configuration',async()=>{const token=process.env.BLOB_READ_WRITE_TOKEN;delete process.env.BLOB_READ_WRITE_TOKEN;const data=await loadPortfolio();assert.equal(data.configured,false);assert.equal(data.revision,null);assert.equal(data.portfolio.projects.length,5);if(token)process.env.BLOB_READ_WRITE_TOKEN=token;});
test('storage reads latest data and guards simultaneous updates with ETags',async()=>{process.env.BLOB_READ_WRITE_TOKEN='test-only';let options;const store={get:async(path,opts)=>{options=opts;return {stream:new Blob([JSON.stringify(defaults)]).stream(),blob:{etag:'"r1"'}};},put:async(path,body,opts)=>{options=opts;return {etag:'"r2"'};}};assert.equal((await loadPortfolio(store)).revision,'"r1"');assert.equal(options.useCache,false);assert.equal((await savePortfolio(defaults,'"r1"',store)).revision,'"r2"');assert.equal(options.ifMatch,'"r1"');await savePortfolio(defaults,null,store);assert.equal(options.allowOverwrite,false);store.put=async()=>{throw new BlobPreconditionFailedError();};await assert.rejects(savePortfolio(defaults,'"r1"',store),e=>e.status===409);delete process.env.BLOB_READ_WRITE_TOKEN;});
test('invalid media URLs and duplicate featured projects cannot be saved',()=>{const p=structuredClone(defaults);p.linkedin='javascript:alert(1)';assert.throws(()=>validate(p));p.linkedin='';p.projects[1].featured=1;assert.throws(()=>validate(p));p.projects[1].featured=2;assert.equal(validate(p).projects.length,5);});
