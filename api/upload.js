import {handleUpload,handleUploadPresigned} from '@vercel/blob/client';
import {issueSignedToken} from '@vercel/blob';
import {requireOwner} from '../lib/auth.mjs';
import {blobConfigured,presignedUploads} from '../lib/blob-config.mjs';
import {json,fail,readBody,report,sameOrigin} from '../lib/http.mjs';

export function uploadOptions(pathname,payload) {
  if(!/^media\/[a-f0-9-]{36}\.(mp4|webm|jpg|jpeg|png|webp)$/.test(pathname))fail('Invalid upload path.');
  let info;
  try{info=JSON.parse(payload);}catch{fail('Invalid upload details.');}
  const types={mp4:'video/mp4',webm:'video/webm',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
  const type=types[pathname.split('.').pop()];
  const limit=type.startsWith('video/')?2*1024**3:20*1024**2;
  if(!info||info.type!==type||!Number.isInteger(info.size)||info.size<1||info.size>limit)fail('Check the file type and size.');
  return {allowedContentTypes:[type],maximumSizeInBytes:limit,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+60*60*1000};
}
export async function signedUpload(pathname,payload,issue=issueSignedToken) {
  const urlOptions=uploadOptions(pathname,payload);
  const {allowedContentTypes,maximumSizeInBytes,validUntil}=urlOptions;
  const token=await issue({pathname,operations:['put'],allowedContentTypes,maximumSizeInBytes,validUntil});
  return {token,urlOptions};
}
export async function POST(request) {
  try {
    const body=await readBody(request);
    if(body.type!=='blob.upload-completed'){
      requireOwner(request);sameOrigin(request);
      if(!blobConfigured())fail('Connect a public Vercel Blob store first.',503);
      if(!['blob.generate-client-token','blob.generate-presigned-url'].includes(body.type))fail('Invalid upload request.');
    }
    const authorize=()=>{requireOwner(request);sameOrigin(request);};
    const result=presignedUploads()
      ? await handleUploadPresigned({request,body,getSignedToken:async(pathname,payload)=>{authorize();return signedUpload(pathname,payload);}})
      : await handleUpload({request,body,onBeforeGenerateToken:async(pathname,payload)=>{authorize();return uploadOptions(pathname,payload);}});
    return json(result);
  }catch(error){return report(error);}
}
