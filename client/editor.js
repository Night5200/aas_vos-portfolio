import {videoSource} from '../public/video-source.js';


function videoLinkControl(project){
 const box=document.createElement('div');
 const label=field('Video link',project.video,value=>{
  project.video=value.trim();
  if(project.id.startsWith('sample-'))project.id=crypto.randomUUID();
  check();
 },'url');
 const input=label.querySelector('input');input.required=true;
 input.placeholder='https://www.youtube.com/watch?v=…';
 function check(){input.setCustomValidity(videoSource(project.video)?'':'Paste a YouTube, Vimeo, Wistia, or direct HTTPS MP4/WebM link.');}
 check();
 const hint=document.createElement('p');hint.className='upload-status';
 hint.textContent='YouTube, Vimeo, Wistia, or a direct .mp4/.webm link. The host must allow playback on other websites. Hosted players open on click; direct videos also preview on hover.';
 const shapeLabel=document.createElement('label');shapeLabel.textContent='Video shape';
 const shape=document.createElement('select');
 for(const [value,text] of [['auto','Automatic'],['landscape','Landscape (16:9)'],['portrait','Vertical (9:16)'],['square','Square (1:1)']]){
  const option=document.createElement('option');option.value=value;option.textContent=text;shape.append(option);
 }
 shape.value=project.videoShape||'auto';
 shape.onchange=()=>{project.videoShape=shape.value;changed();};
 shapeLabel.append(shape);box.append(label,hint,shapeLabel);return box;
}
let state,revision,dirty=false,pending=0,saving=false;
const form=document.querySelector('#editor-form'),status=document.querySelector('#status'),save=document.querySelector('#save');
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
function changed(){dirty=true;document.querySelector('#save-note').textContent='You have unsaved changes.';}
function lock(){form.inert=saving;save.disabled=pending>0||saving;save.textContent=saving?'Saving…':pending?'Uploading…':'Save changes';}
async function api(url,options={}){const response=await fetch(url,options);let data;try{data=await response.json();}catch{throw new Error('The server could not respond. Please try again.');}if(!response.ok)throw new Error(data.error||'Something went wrong. Please try again.');return data;}
function field(label,value,onChange,type='text'){const l=document.createElement('label');l.textContent=label;const input=type==='textarea'?document.createElement('textarea'):document.createElement('input');if(type!=='textarea')input.type=type;else input.rows=3;input.value=value||'';input.maxLength=type==='textarea'?3000:1000;input.addEventListener('input',()=>{onChange(input.value);changed();});l.append(input);return l;}
function select(label,value,options,onChange){const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}s.value=value;s.addEventListener('change',()=>{onChange(Number(s.value));changed();});l.append(s);return l;}
function uploadControl(label,value,kind,onUploaded){const box=document.createElement('div'),l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='file';input.accept=kind==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp';l.append(input);const details=document.createElement('p');details.className='upload-status';details.textContent=value?'Current '+kind+' is saved.':'Choose a '+kind+'.';const progress=document.createElement('progress');progress.max=100;progress.value=0;progress.hidden=true;box.append(l,progress,details);if(kind==='image'&&value){const img=document.createElement('img');img.className='thumb';img.src=value;img.alt='Current thumbnail';box.append(img);}input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;input.disabled=true;progress.hidden=false;pending++;lock();try{const url=await upload(file,(percent)=>{progress.value=percent;details.textContent='Uploading '+file.name+' · '+percent+'%';details.classList.remove('error');});onUploaded(url);changed();details.textContent=file.name+' uploaded. Save changes to use it.';let img=box.querySelector('img');if(kind==='image'){if(!img){img=document.createElement('img');img.className='thumb';img.alt='New thumbnail';box.append(img);}img.src=url;}}catch(e){details.textContent=e.message+' Select the file again to retry.';details.classList.add('error');}finally{pending--;lock();input.disabled=false;input.value='';}});return box;}
async function upload(file,update){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024**2)throw new Error('Choose a JPG, PNG or WebP image smaller than 2 MB.');
 update(10);
 const result=await api('/api/upload',{method:'POST',headers:{'Content-Type':file.type},body:file});
 update(100);return result.url;
}
function projects(){const list=document.querySelector('#projects');list.replaceChildren();state.projects.forEach((p,index)=>{const card=document.createElement('article');card.className='project-card';const head=document.createElement('div');head.className='card-head';const h=document.createElement('h3');h.textContent='Project '+(index+1);const remove=document.createElement('button');remove.type='button';remove.textContent='Remove project';remove.onclick=()=>{if(pending){message('Wait for uploads to finish before removing a project.',true);return;}state.projects.splice(index,1);changed();projects();};head.append(h,remove);const grid=document.createElement('div');grid.className='fields';grid.append(field('Project title',p.title,v=>p.title=v),select('Placement',p.featured,[[0,'More work'],[1,'Featured 1'],[2,'Featured 2']],v=>p.featured=v),field('Category',p.type,v=>p.type=v),field('Your role',p.role,v=>p.role=v));const description=field('Your contribution',p.description,v=>p.description=v,'textarea');description.className='wide';grid.append(description,videoLinkControl(p),uploadControl('Thumbnail',p.poster,'image',url=>p.poster=url));card.append(head,grid);list.append(card);});}
function brands(){
 state.brands??=[];
 let section=document.querySelector('#brand-editor');
 if(!section){section=document.createElement('section');section.id='brand-editor';form.querySelector('section').after(section);}
 section.replaceChildren();
 const title=document.createElement('h2');title.textContent="Brands I’ve worked with";
 const add=document.createElement('button');add.type='button';add.textContent='Add brand';
 add.onclick=()=>{state.brands.push({name:'',logo:''});changed();brands();};
 section.append(title,add);
 state.brands.forEach((brand,index)=>{
 const row=document.createElement('div');row.className='fields';
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remove brand';
 remove.onclick=()=>{if(pending)return;state.brands.splice(index,1);changed();brands();};
 const darkLabel=document.createElement('label');darkLabel.textContent='Dark logo — lighten for dark background';
 const dark=document.createElement('input');dark.type='checkbox';dark.checked=Boolean(brand.lighten);
 dark.onchange=()=>{brand.lighten=dark.checked;changed();};darkLabel.append(dark);
 const scaleLabel=document.createElement('label');scaleLabel.textContent='Logo size (adjust for padding in your 512 × 512 image)';
 const scale=document.createElement('input');scale.type='range';scale.min='0.75';scale.max='2';scale.step='0.05';scale.value=brand.scale||1;
 const preview=document.createElement('img');preview.src=brand.logo;preview.alt=brand.name;preview.style.cssText='width:120px;height:90px;object-fit:contain;background:#111212';
 const updatePreview=()=>{preview.style.filter=dark.checked?'invert(1) hue-rotate(180deg)':'none';preview.style.transform='scale('+scale.value+')';};
 dark.addEventListener('change',updatePreview);
 scale.oninput=()=>{brand.scale=Number(scale.value);changed();updatePreview();};scaleLabel.append(scale);
 const previewBox=document.createElement('div');previewBox.style.cssText='height:190px;display:grid;place-items:center;overflow:hidden;background:#111212';previewBox.append(preview);updatePreview();
 row.append(field('Brand name',brand.name,value=>brand.name=value),uploadControl('Brand logo',brand.logo,'image',url=>{brand.logo=url;preview.src=url;}),darkLabel,scaleLabel,previewBox,remove);section.append(row);
 });
}
function software(){
 const list=document.querySelector('#software');list.replaceChildren();
 const levels=['','Beginner','Intermediate','Advanced','Expert'];
 state.software.forEach((s,index)=>{
  const row=document.createElement('div');row.className='software-edit';
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';
  remove.setAttribute('aria-label','Remove '+s.name);
  remove.onclick=()=>{state.software.splice(index,1);changed();software();};
  const control=document.createElement('label');control.className='software-bar-control';
  const caption=document.createElement('span');caption.className='software-bar-caption';
  const title=document.createElement('span');title.textContent='Bar level';
  const output=document.createElement('output');output.textContent=levels[s.level];
  caption.append(title,output);
  const slider=document.createElement('input');slider.type='range';slider.min='1';slider.max='4';slider.step='1';slider.value=s.level;
  const preview=document.createElement('meter');preview.min=0;preview.max=4;preview.value=s.level;
  preview.setAttribute('aria-label','Software bar preview');
  function update(){output.textContent=levels[s.level];slider.setAttribute('aria-valuetext',levels[s.level]);preview.value=s.level;}
  slider.addEventListener('input',()=>{s.level=Number(slider.value);update();changed();});
  control.append(caption,slider,preview);update();
  row.append(field('Software',s.name,v=>s.name=v),control,remove);list.append(row);
 });
}
async function load(){try{const data=await api('/api/portfolio');if(!data.isOwner){document.querySelector('#login-panel').hidden=false;form.hidden=true;message('Sign in to update your portfolio.');return;}document.querySelector('#login-panel').hidden=true;document.querySelector('#logout').hidden=false;state=data.portfolio;revision=data.revision;for(const key of ['name','intro','bio','email','linkedin']){form.elements[key].value=state[key];form.elements[key].addEventListener('input',()=>{state[key]=form.elements[key].value;changed();});}document.querySelector('#portrait-preview').src=state.portrait;const original=document.querySelector('#portrait-field');original.replaceChildren(uploadControl('Portrait',state.portrait,'image',url=>{state.portrait=url;document.querySelector('#portrait-preview').src=url;}));document.querySelector('#portrait-preview').hidden=true;projects();software();brands();form.hidden=false;message(data.configured?'Only you can edit this portfolio.':'Add GITHUB_TOKEN in Vercel to enable saving.',!data.configured);}catch(e){message(e.message,true);}}
document.querySelector('#add-project').onclick=()=>{if(pending){message('Wait for uploads to finish before adding a project.',true);return;}state.projects.push({id:crypto.randomUUID(),title:'',type:'',role:'',description:'',video:'',poster:'',featured:0});changed();projects();document.querySelector('#projects').lastElementChild.scrollIntoView({behavior:'smooth',block:'center'});};
document.querySelector('#add-software').onclick=()=>{state.software.push({name:'',level:2});changed();software();};
form.addEventListener('submit',async e=>{e.preventDefault();if(pending||saving)return;const chosen=state.projects.filter(p=>p.featured);if(new Set(chosen.map(p=>p.featured)).size!==chosen.length){message('Choose a different project for each featured position.',true);status.scrollIntoView();return;}saving=true;lock();try{const result=await api('/api/save',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({portfolio:state,revision})});revision=result.revision;dirty=false;message('Saved to GitHub. Publishing completes after Vercel deploys.');document.querySelector('#save-note').textContent='All changes saved.';}catch(e){message(e.message,true);status.scrollIntoView({behavior:'smooth'});}finally{saving=false;lock();}});
document.querySelector('#login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;try{await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.querySelector('#password').value})});document.querySelector('#password').value='';location.reload();}catch(error){message(error.message,true);}finally{button.disabled=false;}});
document.querySelector('#logout').onclick=async()=>{if(dirty||pending){message('Save your changes and finish uploads before signing out.',true);return;}try{await api('/api/logout',{method:'POST'});location.reload();}catch(e){message(e.message,true);}};
window.addEventListener('beforeunload',e=>{if(dirty||pending){e.preventDefault();e.returnValue='';}});load();
