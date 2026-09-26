import {loadPortfolio} from '../lib/storage.mjs';
import {isOwner} from '../lib/auth.mjs';
import {presignedUploads} from '../lib/blob-config.mjs';
import {json,report} from '../lib/http.mjs';
export async function GET(request){try{const result=await loadPortfolio();return json({...result,presignedUploads:presignedUploads(),isOwner:isOwner(request)});}catch(error){return report(error);}}
