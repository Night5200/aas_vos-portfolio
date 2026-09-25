import {loadPortfolio} from '../lib/storage.mjs';
import {isOwner} from '../lib/auth.mjs';
import {json,report} from '../lib/http.mjs';
export async function GET(request){try{const result=await loadPortfolio();return json({...result,isOwner:isOwner(request)});}catch(error){return report(error);}}
