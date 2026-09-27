export function fail(message,status=400){throw Object.assign(new Error(message),{status});}
export function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
export async function readBody(request){if(Number(request.headers.get('content-length'))>150000)fail('Request too large.',413);const text=await request.text();if(text.length>150000)fail('Request too large.',413);try{return JSON.parse(text);}catch{fail('Invalid request.');}}
export function sameOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')fail('Request origin was not accepted.',403);}
export function report(error,ownerDiagnostic=false){
 if(error.status)return json({error:error.message},error.status);
 const name=String(error?.name||'Error');
 const message=String(error?.message||'');
 let code='STORAGE_UNAVAILABLE',detail='The storage service could not complete this request.';
 if(/No blob credentials|no storeId|Invalid token|unable to extract store ID/i.test(message)){
  code='BLOB_CREDENTIALS';detail='The deployment is missing valid Blob credentials. Check the Blob project connection and redeploy.';
 }else if(/forbidden|unauthorized|access denied|permission/i.test(name+' '+message)){
  code='BLOB_ACCESS';detail='Blob refused access. Check that this store is connected to this project for Production, then redeploy.';
 }else if(/store.*not found|store.*does not exist/i.test(message)){
  code='BLOB_STORE';detail='The connected Blob store could not be found. Check the project’s Blob connection.';
 }else if(/private.*public|public.*private/i.test(message)){
  code='BLOB_ACCESS_MODE';detail='This portfolio requires a public Blob store.';
 }else if(/suspended/i.test(message)){
  code='BLOB_SUSPENDED';detail='The service reports a suspension. This does not necessarily mean current usage exceeds a limit.';
 }else if(/quota|limit exceeded/i.test(name+' '+message)){
  code='BLOB_LIMIT';detail='Blob reported a storage or usage limit. Check the store in Vercel.';
 }
 // Log only classified diagnostics: never credentials, submitted content or raw SDK messages.
 const type=name.replace(/[^a-zA-Z0-9_]/g,'').slice(0,64)||'Error';
 console.error('Portfolio service error:',code,type);
 let diagnostic=message;
 if(ownerDiagnostic){
  for(const value of Object.values(process.env)){if(value&&value.length>=8)diagnostic=diagnostic.split(value).join('[redacted]');}
  diagnostic=diagnostic.replace(/https?:\/\/[^\s"'<>]+/g,'[URL removed]').replace(/(?:Bearer\s+)?[A-Za-z0-9_+\/-]{32,}(?:\.[A-Za-z0-9_+\/-]+)*/g,'[redacted]').slice(0,600);
 }
 return json({error:detail+' Your edits are still on this page. Reference: '+code+' ('+type+').'+(ownerDiagnostic?' Service detail: '+diagnostic:'')},503);
}
