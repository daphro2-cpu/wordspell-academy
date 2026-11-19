// Support mouse hover, whiteboard pens and direct touch without turning a drag into an answer.
export function bindFlashlightInput(host,{active,move,leave,now=()=>performance.now(),pointerEvents=typeof globalThis.PointerEvent!=='undefined'}){
 let gesture=null,ignoreClickUntil=0;
 const fieldFor=target=>target?.closest?.('.arcade-field.flashlight');
 function down(event){
  if(!active()||event.isPrimary===false||(event.button!=null&&event.button!==0))return;
  const field=fieldFor(event.target);if(!field)return;
  gesture={id:event.pointerId,field,x:event.clientX,y:event.clientY,dragged:false};
  move(event,field);
 }
 function motion(event){
  if(!active())return;
  if(gesture&&event.pointerId!==gesture.id)return;
  const field=gesture?.field??fieldFor(event.target);if(!field)return;
  if(gesture&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>10){
   gesture.dragged=true;
   try{field.setPointerCapture?.(event.pointerId);}catch{}
  }
  if(gesture&&event.pointerType!=='mouse'&&event.cancelable)event.preventDefault();
  move(event,field);
 }
 function up(event){
  if(!gesture||event.pointerId!==gesture.id)return;
  const {field,dragged}=gesture;
  if(active())move(event,field);
  if(dragged)ignoreClickUntil=now()+800;
  gesture=null;
  try{if(field.hasPointerCapture?.(event.pointerId))field.releasePointerCapture(event.pointerId);}catch{}
 }
 host.addEventListener('pointerdown',down);
 host.addEventListener('pointermove',motion);
 host.addEventListener('pointerup',up);
 host.addEventListener('pointercancel',()=>{if(gesture)ignoreClickUntil=now()+800;gesture=null;});
 host.addEventListener('pointerleave',event=>{
  // A touch/pen leaves the surface when lifted. Keep its last illuminated position.
  if(active()&&!gesture&&(!event.pointerType||event.pointerType==='mouse'))leave();
 });
 if(!pointerEvents){
  const point=(event,touch)=>({target:event.target,clientX:touch.clientX,clientY:touch.clientY,pointerId:touch.identifier,pointerType:'touch',button:0,cancelable:event.cancelable,preventDefault:()=>event.preventDefault()});
  host.addEventListener('touchstart',event=>{if(event.touches.length===1)down(point(event,event.touches[0]));},{passive:true});
  host.addEventListener('touchmove',event=>{if(event.touches.length===1)motion(point(event,event.touches[0]));},{passive:false});
  host.addEventListener('touchend',event=>{if(event.changedTouches.length)up(point(event,event.changedTouches[0]));});
  host.addEventListener('touchcancel',()=>{if(gesture)ignoreClickUntil=now()+800;gesture=null;});
 }
 return {ignoreClick(event){
  if(now()<ignoreClickUntil&&fieldFor(event.target)){ignoreClickUntil=0;return true;}
  return false;
 }};
}
