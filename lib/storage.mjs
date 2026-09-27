import defaults from './defaults.json' with {type:'json'};
import {fail} from './http.mjs';
export const configured=()=>Boolean(process.env.GITHUB_TOKEN);
const branch=()=>process.env.GITHUB_BRANCH||'main';
export async function github(path,options={},fetcher=fetch){
 if(!configured())fail('Add GITHUB_TOKEN in Vercel to enable saving.',503);
 const repo=process.env.GITHUB_REPOSITORY||'Night5200/aas_vos-portfolio';
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo))fail('Check GITHUB_REPOSITORY in Vercel.',503);
 const response=await fetcher('https://api.github.com/repos/'+repo+'/contents/'+path+(!options.method?'?ref='+encodeURIComponent(branch()):''),{
 ...options,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN,'X-GitHub-Api-Version':'2022-11-28',...options.headers},signal:AbortSignal.timeout(15000)});
 if(response.status===404&&!options.method)return null;
 if(!response.ok){
  if(response.status===409)fail('A newer version was saved. Copy your edits before reloading.',409);
  if([401,403,404].includes(response.status))fail('Check the GitHub token, repository access and Contents read/write permission in Vercel.',503);
  fail('GitHub could not save this change (status '+response.status+'). Your edits are still here.',503);
 }
 return response.json();
}
export async function loadPortfolio(){
 if(!configured())return {portfolio:structuredClone(defaults),revision:null,configured:false};
 const file=await github('lib/defaults.json');
 if(!file)fail('Cannot find lib/defaults.json on the configured GitHub branch. Check repository and branch settings.',503);
 return {portfolio:JSON.parse(Buffer.from(file.content,'base64').toString()),revision:file.sha,configured:true};
}
export async function commitFile(path,content,sha,message){
 return github(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,content:Buffer.from(content).toString('base64'),branch:branch(),...(sha?{sha}:{})})});
}
export async function savePortfolio(portfolio,revision){
 if(typeof revision!=='string'||! /^[a-f0-9]{40}$/.test(revision))fail('Reload the editor to load the current GitHub version before saving.',409);
 const result=await commitFile('lib/defaults.json',JSON.stringify(portfolio,null,2)+'\n',revision,'Update portfolio from private editor');
 return {revision:result.content.sha};
}
