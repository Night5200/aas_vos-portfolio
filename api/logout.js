import {sessionCookie} from '../lib/auth.mjs';
import {json,report,sameOrigin} from '../lib/http.mjs';
export async function POST(request){try{sameOrigin(request);return json({ok:true},200,{'Set-Cookie':sessionCookie(request,'',true)});}catch(error){return report(error);}}
