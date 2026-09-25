import {checkPassword,createSession,sessionCookie,rateLimit} from '../lib/auth.mjs';
import {json,fail,readBody,report,sameOrigin} from '../lib/http.mjs';
export async function POST(request){try{sameOrigin(request);rateLimit(request);const {password}=await readBody(request);if(!checkPassword(password))fail('Incorrect password.',401);return json({ok:true},200,{'Set-Cookie':sessionCookie(request,createSession())});}catch(error){return report(error);}}
