import {savePortfolio} from '../lib/storage.mjs';
import {requireOwner} from '../lib/auth.mjs';
import {json,readBody,report,sameOrigin} from '../lib/http.mjs';
import {validate} from '../lib/validation.mjs';
export async function PUT(request){try{requireOwner(request);sameOrigin(request);const input=await readBody(request);return json(await savePortfolio(validate(input.portfolio),input.revision));}catch(error){return report(error);}}
