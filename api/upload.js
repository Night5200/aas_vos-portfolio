import {randomUUID} from 'node:crypto';
import {requireOwner} from '../lib/auth.mjs';
import {commitFile} from '../lib/storage.mjs';
import {json,fail,report,sameOrigin} from '../lib/http.mjs';
export async function POST(request){try{
 requireOwner(request);sameOrigin(request);
 const type=request.headers.get('content-type');
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];
 if(!ext)fail('Choose a JPG, PNG or WebP image.');
 if(Number(request.headers.get('content-length'))>2*1024**2)fail('Images must be smaller than 2 MB.',413);
 const bytes=Buffer.from(await request.arrayBuffer());
 if(!bytes.length||bytes.length>2*1024**2)fail('Images must be smaller than 2 MB.',413);
 const valid=ext==='jpg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:ext==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!valid)fail('The file does not match its image type.');
 const path='media/'+randomUUID()+'.'+ext;
 await commitFile('public/'+path,bytes,null,'Add portfolio image');
 return json({url:'/'+path});
}catch(error){return report(error);}}
