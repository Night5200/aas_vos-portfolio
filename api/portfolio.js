import defaults from '../lib/defaults.json' with {type:'json'};
import {loadPortfolio} from '../lib/storage.mjs';
import {isOwner} from '../lib/auth.mjs';
import {json,report} from '../lib/http.mjs';
export async function GET(request){try{
 const owner=isOwner(request);
 return json(owner?{...await loadPortfolio(),isOwner:true}:{portfolio:defaults,isOwner:false});
}catch(error){return report(error);}}
