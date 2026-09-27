import {videoSource} from './video-source.js';
async function init(){
const response=await fetch('/api/portfolio');if(!response.ok)throw new Error('Portfolio is temporarily unavailable. Please refresh to try again.');const data=await response.json();const portfolio=data.portfolio;
const featured=document.querySelector('#featured'),more=document.querySelector('#more');
document.querySelector('#portrait').src=portfolio.portrait;document.querySelector('#portrait').alt=portfolio.name+' portrait';document.querySelector('.portrait span').hidden=true;document.querySelector('.wordmark').textContent=portfolio.name;document.querySelector('.intro').textContent=portfolio.intro;document.querySelector('.bio').textContent=portfolio.bio;document.querySelector('#edit-link').hidden=!data.isOwner;const contact=document.querySelector('.contact-links');contact.replaceChildren();if(portfolio.email){const a=document.createElement('a');a.href='mailto:'+portfolio.email;a.textContent=portfolio.email;contact.append(a);}if(portfolio.linkedin){const a=document.createElement('a');a.href=portfolio.linkedin;a.textContent='LinkedIn ↗';a.target='_blank';a.rel='noopener noreferrer';contact.append(a);}const software=document.querySelector('.software');software.replaceChildren();for(const s of portfolio.software){const row=document.createElement('div');row.className='software-row';const label=document.createElement('span');label.textContent=s.name;const meter=document.createElement('meter');meter.min=0;meter.max=4;meter.value=s.level;const level=['','Beginner','Intermediate','Advanced','Expert'][s.level];meter.setAttribute('aria-label',s.name+': '+level);const text=document.createElement('span');text.textContent=level;row.append(label,meter,text);software.append(row);}const demo=portfolio.projects.some(p=>p.id.startsWith('sample-'));document.querySelector('.expertise .note').hidden=true;document.querySelector('#footer-note').textContent=demo?'Sample footage is shown until replaced with your work.':'';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let activePlayer=null;
function media(project){
 const source=videoSource(project.video);
 const wrap=document.createElement('div');wrap.className='project-player';
 const button=document.createElement('button');button.className='media';button.setAttribute('aria-label','Play '+project.title);
 const img=document.createElement('img');img.src=project.poster;img.alt='';img.loading='lazy';
 const play=document.createElement('span');play.className='play';play.textContent='▶';
 button.append(img,play);wrap.append(button);
 function shape(w,h){
  const ratio=project.videoShape==='portrait'?9/16:project.videoShape==='square'?1:project.videoShape==='landscape'?16/9:source?.portrait?9/16:w/h;
  wrap.style.setProperty('--ratio',String(ratio||16/9));
  wrap.classList.toggle('portrait-player',ratio<1);
 }
 shape(16,9);img.onload=()=>shape(img.naturalWidth,img.naturalHeight);
 let preview;
 if(source?.kind==='direct'){
  preview=document.createElement('video');preview.muted=true;preview.loop=true;preview.playsInline=true;preview.preload='metadata';preview.src=source.src;button.append(preview);
  preview.onloadedmetadata=()=>shape(preview.videoWidth,preview.videoHeight);
  button.onpointerenter=e=>{if(e.pointerType==='mouse'&&!reducedMotion.matches)preview.play().then(()=>button.classList.add('is-playing')).catch(()=>{});};
  button.onpointerleave=()=>{preview.pause();button.classList.remove('is-playing');};
 }
 button.onclick=()=>{
  if(!source||source.kind==='share')return;
  if(activePlayer)activePlayer();
  preview?.pause();button.hidden=true;
  const player=document.createElement(source.kind==='embed'?'iframe':'video');
  player.className='inline-player';player.title=project.title;
  if(source.kind==='embed'){player.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';player.allowFullscreen=true;player.referrerPolicy='strict-origin-when-cross-origin';}
  else{player.controls=true;player.playsInline=true;}
  player.src=source.src;wrap.append(player);
  if(source.kind==='direct')player.play().catch(()=>{});
  const stop=document.createElement('button');stop.className='stop-player';stop.textContent='Close player';wrap.append(stop);
  const reset=()=>{if(source.kind==='direct')player.pause();player.removeAttribute('src');player.remove();stop.remove();button.hidden=false;activePlayer=null;};
  stop.onclick=reset;activePlayer=reset;
 };
 return wrap;
}
const brands=portfolio.brands||[];
{
 const section=document.createElement('section');section.className='brands';
 const heading=document.createElement('h2');heading.className='section-label';heading.textContent="Brands I’ve worked with";
 const list=document.createElement('div');list.className='brand-logos';
 for(const brand of brands){const item=document.createElement('figure'),logo=document.createElement('img'),caption=document.createElement('figcaption');logo.src=brand.logo;logo.alt=brand.name;logo.loading='lazy';caption.textContent=brand.name;item.append(logo,caption);list.append(item);}
 section.append(heading,list);document.querySelector('#about').after(section);
 if(!brands.length){
  const note=document.createElement('p');note.className='brands-empty';
  note.textContent=data.isOwner?'Add your brand names and logos in the editor, then save and wait for deployment.':'Brand collaborations will appear here.';
  section.append(note);
 }
}
portfolio.projects.sort((a,b)=>(a.featured||3)-(b.featured||3)).forEach((project,i)=>{const article=document.createElement('article');article.className=project.featured>0?'featured-project':'small-project';article.append(media(project));const info=document.createElement('div');info.className='project-info';if(project.featured>0){const type=document.createElement('p');type.className='project-type';type.textContent='0'+project.featured+' / '+project.type;info.append(type);}const title=document.createElement('h3');title.textContent=project.title;info.append(title);if(project.featured>0){const role=document.createElement('p');role.className='project-role';role.textContent=project.role;const description=document.createElement('p');description.className='project-description';description.textContent=project.description;info.append(role,description);}article.append(info);(project.featured>0?featured:more).append(article);});
}
init().catch(error=>{const p=document.createElement("p");p.setAttribute("role","alert");p.textContent=error.message;document.querySelector("main").prepend(p);});
