const API="https://hhyfixoxwxmzncosmcqo.supabase.co/rest/v1/countdowns";
const KEY="sb_publishable_KWvHkZqW2aAipujklitrdg_C7bSBFce";
const DEFAULT={end_time:"2026-10-23T19:00:00+01:00",message:"OPENING NIGHT"};
async function readBase(){
 const response=await fetch(API+"?id=eq.main&select=id,label,end_time,updated_at",{headers:{apikey:KEY}});
 if(!response.ok)throw new Error("Could not load countdown.");
 const rows=await response.json();if(!rows[0])throw new Error("Countdown settings unavailable.");return rows[0];
}
function documentSettings(base){
 let doc;try{doc=JSON.parse(base.label)}catch{}
 return doc?.version===2?doc:{version:2,message:base.label||"",groups:{}};
}
function rebelSettings(base){
 return {...DEFAULT,...documentSettings(base).groups?.rebelbingo};
}
function formatCountdown(ms){
 ms=Math.max(0,Math.floor(ms));
 const total=Math.floor(ms/1000), pad=n=>String(n).padStart(2,"0");
 return Math.floor(total/86400)+"D "+pad(Math.floor(total/3600)%24)+":"+pad(Math.floor(total/60)%60)+":"+pad(total%60)+"."+String(ms%1000).padStart(3,"0");
}

const timer=document.getElementById("rebel-time"),milliseconds=document.getElementById("rebel-milliseconds"),message=document.getElementById("rebel-countdown-label");
let settings=DEFAULT;
function render(){
 if(message.textContent!==settings.message)message.textContent=settings.message;
 const [time,ms]=formatCountdown(new Date(settings.end_time).getTime()-Date.now()).split(".");
 if(timer.textContent!==time)timer.textContent=time;
 milliseconds.textContent="."+ms;
}
function animate(){render();requestAnimationFrame(animate)}
async function load(){try{const next=rebelSettings(await readBase());if(Number.isFinite(Date.parse(next.end_time)))settings=next;render()}catch{}}
animate();load();setInterval(load,5000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
