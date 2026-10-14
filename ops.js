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
 const total=Math.max(0,Math.floor(ms/1000)), pad=n=>String(n).padStart(2,"0");
 return Math.floor(total/86400)+"d "+pad(Math.floor(total/3600)%24)+":"+pad(Math.floor(total/60)%60)+":"+pad(total%60);
}

const $=id=>document.getElementById(id);
function setStatus(message,ok=true){$("status").className=ok?"ok":"bad";$("status").textContent=message}
function showControls(){const target=$("mode").value==="target";$("targetControls").hidden=!target;$("durationControls").hidden=target}
  function londonParts(date){
    return Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,p.value]));
  }
  function setTarget(date){
    const p=londonParts(date);
    $("target").value=`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  function ukDate(value){
    const [y,m,d,h,min]=value.match(/\d+/g).map(Number);
    const wall=Date.UTC(y,m-1,d,h,min);
    let instant=wall;
    for(let i=0;i<3;i++){
      const p=londonParts(new Date(instant));
      const represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);
      instant+=wall-represented;
    }
    const result=new Date(instant);
    const p=londonParts(result);
    if(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`!==value) return null;
    return result;
  }


$("mode").addEventListener("change",showControls);
$("twoWeeks").addEventListener("click",()=>setTarget(new Date(Date.now()+14*86400000)));
$("oneHour").addEventListener("click",()=>{$("hours").value=1;$("mins").value=0;$("secs").value=0});
async function loadCurrent(){
 setStatus("Loading…");
 try{const current=rebelSettings(await readBase());$("label").value=current.message;setTarget(new Date(current.end_time));$("mode").value="target";showControls();setStatus("Current countdown loaded.")}
 catch(error){setStatus(error.message,false)}
}
async function save(){
 let endTime;
 if($("mode").value==="target"){
  if(!$("target").value){setStatus("Choose an end date & time.",false);return}
  endTime=ukDate($("target").value);
  if(!endTime){setStatus("Choose a valid UK date & time.",false);return}
 }else{
  const values=["hours","mins","secs"].map(id=>Number($(id).value||0));
  if(values.some(n=>!Number.isInteger(n)||n<0)||values[1]>59||values[2]>59){setStatus("Enter valid hours, minutes and seconds.",false);return}
  const seconds=values[0]*3600+values[1]*60+values[2];
  endTime=new Date(Date.now()+seconds*1000);
  if(seconds<=0||!Number.isFinite(endTime.getTime())){setStatus("Set a valid duration greater than zero.",false);return}
 }
 $("save").disabled=true;setStatus("Saving…");
 try{
  const base=await readBase(),doc=documentSettings(base);
  doc.groups={...doc.groups,rebelbingo:{end_time:endTime.toISOString(),message:$("label").value.trim()}};
  const query="?id=eq.main&updated_at="+(base.updated_at?"eq."+encodeURIComponent(base.updated_at):"is.null");
  const response=await fetch(API+query,{method:"PATCH",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({label:JSON.stringify(doc),updated_at:new Date().toISOString()})});
  if(!response.ok)throw new Error("Save failed. Please try again.");
  const saved=await response.json();if(!saved.length)throw new Error("Another update was made. Load current and save again.");
  setStatus("Saved. The website will update within 5 seconds.");
 }catch(error){setStatus(error.message,false)}finally{$("save").disabled=false}
}
$("load").addEventListener("click",loadCurrent);$("save").addEventListener("click",save);showControls();loadCurrent();
