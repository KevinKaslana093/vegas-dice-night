export const MUSIC_TRACKS={
 lobby:{title:'Opening Move',src:'./assets/music/opening-move.mp3',source:'https://www.silvermansound.com/free-music/opening-move'},
 table:{title:'Signs To Nowhere',src:'./assets/music/signs-to-nowhere.mp3',source:'https://www.silvermansound.com/free-music/signs-to-nowhere'},
 final:{title:'Swing Has Swung',src:'./assets/music/swing-has-swung.mp3',source:'https://www.silvermansound.com/free-music/swing-has-swung'}
};
export function musicCredits(){return `<h3>背景音乐 · Shane Ivers</h3>${Object.values(MUSIC_TRACKS).map(t=>`<p><a href="${t.source}" target="_blank" rel="noreferrer">${t.title}</a> — Shane Ivers / Silverman Sound</p>`).join('')}<p class="fineprint">三首均采用 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>，允许署名商用。音频经音量归一与压缩，游戏中循环播放并调整音量；原曲由作者创作。</p>`;}

// One persistent media element: rerenders and lobby/selection changes cannot restart it.
export function createMusic({prefs}){
 const media=document.createElement('audio');media.id='game-music';media.preload='none';media.loop=true;media.hidden=true;media.setAttribute('aria-hidden','true');document.body.append(media);
 let context,gain,unlocked=false,current='',desired={track:'lobby',paused:false},timer=0,revision=0,transition=false,last='',pending=false,observer;
 const positions=new Map();
 const enabled=()=>prefs().music!==false&&Number(prefs().musicVolume??.28)>0;
 const ducked=()=>!!document.querySelector('#cinema[open]');
 const volume=()=>Math.max(0,Math.min(1,Number(prefs().musicVolume??.28)||0))*(ducked()?.3:1);
 function ramp(value,seconds=.25){
  if(gain){const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(value,now,Math.max(.015,seconds/3));}
  else media.volume=value;
 }
 function audioGraph(){
  if(context)return;
  const AudioContextType=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextType)return;
  try{context=new AudioContextType();gain=context.createGain();gain.gain.value=0;context.createMediaElementSource(media).connect(gain);gain.connect(context.destination);media.volume=1;}catch{gain=null;}
 }
 function blocked(){return !unlocked||!enabled()||document.hidden||desired.paused;}
 function play(){
  if(blocked()||pending)return;
  pending=true;const src=media.src;
  media.play().then(()=>{pending=false;if(src!==media.src)return;if(blocked()){media.pause();return;}if(!transition)ramp(volume(),.7);}).catch(()=>{pending=false;});
 }
 function refresh(force=false){
  const signature=[desired.track,desired.paused,document.hidden,enabled(),volume(),unlocked].join('|');
  if(!force&&signature===last)return;last=signature;
  clearTimeout(timer);const version=++revision;transition=false;
  if(blocked()){ramp(0,.08);media.pause();return;}
  if(context&&['suspended','interrupted'].includes(context.state))context.resume().catch(()=>{});
  if(current===desired.track){play();ramp(volume());return;}
  const next=desired.track;transition=true;ramp(0,.25);
  const switchTrack=()=>{
   if(version!==revision||blocked())return;
   if(current&&Number.isFinite(media.currentTime))positions.set(current,media.currentTime);
   media.pause();pending=false;current=next;media.dataset.track=current;media.src=MUSIC_TRACKS[current].src;
   const position=positions.get(current)||0;
   media.onloadedmetadata=()=>{if(version===revision&&position>0&&position<media.duration-1)media.currentTime=position;};
   transition=false;ramp(0,.02);play();
  };
  if(!current||media.paused)switchTrack();else timer=setTimeout(switchTrack,320);
 }
 function unlock(){
  unlocked=true;if(enabled()){audioGraph();if(context?.state==='suspended')context.resume().catch(()=>{});}refresh(true);
 }
 document.addEventListener('pointerdown',unlock,{passive:true});
 document.addEventListener('keydown',e=>{if(!e.repeat)unlock();});
 document.addEventListener('visibilitychange',()=>refresh(true));
 window.addEventListener('pagehide',()=>{clearTimeout(timer);++revision;media.pause();});
 window.addEventListener('pageshow',()=>refresh(true));
 // Cinema opens outside the game render loop, including both teaching modes.
 const cinema=document.getElementById('cinema');
 if(cinema){observer=new MutationObserver(()=>refresh());observer.observe(cinema,{attributes:true,attributeFilter:['open']});}
 media.addEventListener('error',()=>{pending=false;});
 return {
  update(state={}){desired={...desired,...state};if(!MUSIC_TRACKS[desired.track])desired.track='lobby';refresh();},
  get track(){return current;}
 };
}
