// Enhance only the logo strip; leave existing page layout and content untouched.
fetch('/api/portfolio').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(({portfolio})=>{
 const brands=portfolio.brands||[];
 const apply=()=>{
  document.querySelectorAll('.brand-logo img').forEach(img=>{
   const brand=brands.find(b=>new URL(b.logo,location.href).href===img.src);
   img.classList.toggle('lighten-logo',Boolean(brand?.lighten));
   const scale=Number(brand?.scale);
   img.style.setProperty('--brand-scale',Number.isFinite(scale)?Math.max(.75,Math.min(2,scale)):1);
  });
 };
 const observer=new MutationObserver(apply);
 observer.observe(document.body,{childList:true,subtree:true});apply();
}).catch(()=>{});
