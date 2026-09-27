export function videoSource(value) {
 let url;
 try {url=new URL(value);} catch {return null;}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 const host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)){
  const id=host==='youtu.be'?parts[0]:parts[0]==='watch'?url.searchParams.get('v'):['embed','shorts','live'].includes(parts[0])?parts[1]:null;
  if(!/^[\w-]{11}$/.test(id||''))return null;
  return {kind:'embed',provider:'YouTube',src:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1',portrait:parts[0]==='shorts'};
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
  const match=url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
  if(!match)return null;
  const embed=new URL('https://player.vimeo.com/video/'+match[1]);
  const hash=url.searchParams.get('h')||match[2];if(hash)embed.searchParams.set('h',hash);
  embed.searchParams.set('autoplay','1');
  return {kind:'embed',provider:'Vimeo',src:embed.href};
 }
 if(['wistia.com','wistia.net','wi.st'].some(domain=>host===domain||host.endsWith('.'+domain))){
  if(/^\/s\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname))return {kind:'share',provider:'Wistia',src:url.href};
  const script=url.pathname.match(/^\/embed\/([a-zA-Z0-9]{10})\.js$/);
  if(script)return {kind:'embed',provider:'Wistia',src:'https://fast.wistia.net/embed/iframe/'+script[1]+'?autoPlay=true'};
  const match=url.pathname.match(/^\/(?:medias|m|embed\/iframe)\/([a-zA-Z0-9]{10})(?:\/manage)?\/?$/);
  if(!match)return null;
  return {kind:'embed',provider:'Wistia',src:'https://fast.wistia.net/embed/iframe/'+match[1]+'?autoPlay=true'};
 }
 if(/\.(mp4|webm)$/i.test(url.pathname))return {kind:'direct',src:url.href};
 return null;
}
