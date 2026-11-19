const selector='.review-book strong,.shelved-book strong,.flashlight .word-sign';
export function fitBookLabels(root,styleFor=element=>getComputedStyle(element)){
 const labels=[...root.querySelectorAll(selector)];
 // Restore the responsive base size before measuring, so labels can grow again on a larger display.
 for(const label of labels)label.style.removeProperty('font-size');
 for(const label of labels){
  const available=label.clientWidth;
  if(!available)continue;
  const font=Number.parseFloat(styleFor(label).fontSize);
  if(!Number.isFinite(font)||!font)continue;
  let size=font;
  for(let pass=0;pass<4&&label.scrollWidth>available;pass++){
   size=Math.max(1,Math.floor(size*(available-2)/label.scrollWidth*10)/10);
   label.style.fontSize=size+'px';
  }
 }
}
export function watchBookLabels(root){
 let frame,stopped=false;
 const schedule=()=>{if(stopped)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>fitBookLabels(root));};
 const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
 root.querySelectorAll('.review-bookcase,.returned-bookshelf,.arcade-field.flashlight').forEach(node=>observer?.observe(node));
 window.addEventListener('resize',schedule);
 document.fonts?.addEventListener('loadingdone',schedule);
 document.fonts?.ready.then(schedule);
 schedule();
 return ()=>{stopped=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule);document.fonts?.removeEventListener('loadingdone',schedule);};
}
