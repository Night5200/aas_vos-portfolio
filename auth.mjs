import {createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {fail} from './http.mjs';
const COOKIE='portfolio_session',LIFETIME=12*60*60;
function config(){const password=process.env.ADMIN_PASSWORD,secret=process.env.SESSION_SECRET;if(!password||password.length<8||!secret||secret.length<32)fail('The private editr needs ADMIN_PASSWORD (8+ characters) and SESSION_SECRET (32+ characters) in Vercel.',503);return {password,key:createHash('sha256').update(secret+'\0'+password).digest()};}
function equal(a,b){const x=createHash('sha256').update(a).digest(),y=createHash('sha256').update(b).digest();return timingSafeEqual(x,y);}
function signature(payload,key){return createHmac('sha256',key).update(payload).digest('base64url');}
export function checkPassword(password){return typeof password==='string'&&password.length<=1024&&equal(password,config().password);}
export function createSession(now=Date.now()){const payload=Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+LIFETIME,nonce:randomBytes(16).toString('hex')})).toString('base64url');return payload+'.'+signature(payload,config().key);}
export function isOwner(request,now=Date.now()){try{const token=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>1024)return false;const parts=token.split('.');if(parts.length!==2||!equal(parts[1],signature(parts[0],config().key)))return false;const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());return Number.isInteger(data.exp)&&data.exp>Math.floor(now/1000)&&data.exp<=Math.floor(now/1000)+LIFETIME;}catch{return false;}}
export function requireOwner(request){if(!isOwner(request))fail('Please sign in to edit this portfolio.',401);}
export function sessionCookie(request,value,clear=false){const secure=new URL(request.url).protocol==='https:'||!!process.env.VERCEL;return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:LIFETIME}${secure?'; Secure':''}`;}
// Supplemental warm-instance protection; use Vercel Firewall for global login rate limiting.
const attempts=new Map();
export function rateLimit(request,now=Date.now()){const key=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local';let record=attempts.get(key);if(!record||record.until<now){record={count:0,until:now+15*60*1000};attempts.set(key,record);}if(++record.count>10)fail('Too many sign-in attempts. Please try again in 15 minutes.',429);if(attempts.size>10000){for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);}}
