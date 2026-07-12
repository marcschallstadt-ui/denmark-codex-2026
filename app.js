const CONFIG = window.AGGER_CONFIG || {};
const STORAGE_KEY = "agger-2026-packlist-v1";
const USER_KEY = "agger-2026-user";

const baseItems = [
  ["Dokumente","Personalausweise"],["Dokumente","EU-Heimtierausweis Twix"],["Dokumente","Buchungsbestätigungen offline speichern"],["Dokumente","Krankenversicherungskarten / EHIC"],["Dokumente","Fahrzeugpapiere und Versicherung"],
  ["Twix","Adressanhänger"],["Twix","Leine, Ersatzleine und Schleppleine"],["Twix","Futter für 10 Tage + Reserve"],["Twix","Näpfe und Reisenapf"],["Twix","Hundebett / Decke"],["Twix","Hundehandtücher"],["Twix","Zeckenschutz / Medikamente"],["Twix","Kotbeutel"],
  ["Kleidung","Wind- und Regenjacken"],["Kleidung","Fleece und warme Schichten"],["Kleidung","Feste Schuhe"],["Kleidung","Badesachen"],["Kleidung","Sonnencreme"],["Kleidung","Reiseapotheke"],
  ["Haus","Spülmittel und Schwämme"],["Haus","Toilettenpapier"],["Haus","Müllbeutel und Küchenrolle"],["Haus","Kaffee, Tee, Öl und Gewürze"],["Haus","Grundzutaten erster Abend"],["Haus","Grillzubehör"],
  ["Technik","Starlink komplett"],["Technik","Jackery Explorer 2000 V2"],["Technik","Solarmodul"],["Technik","Beamer und Leinwand"],["Technik","Streaming-Stick / HDMI"],["Technik","Soundboxen"],["Technik","Ladegeräte / Powerbanks"],
  ["Strand","Strand- und Hundehandtücher"],["Strand","Windschutz / Strandmuschel"],["Strand","Decke"],["Strand","Fernglas"],["Strand","Trinkflaschen"],
  ["Auto","Warnwesten und Warndreieck"],["Auto","Verbandskasten"],["Auto","Kühltasche und Fahrtverpflegung"],["Auto","Sonnenschutz für Twix"],["Auto","Dachbox und Träger kontrollieren"]
].map(([category,text],i)=>({id:`base-${i+1}`,category,text,done:false,addedBy:"Vorlage",updatedAt:new Date(0).toISOString()}));

const places = [
  {name:"Agger Strand",type:"walk",tag:"Direkt vor der Tür",text:"Weite Strandrunden und Sonnenuntergänge.",query:"Agger Strand Denmark"},
  {name:"Agger Tange",type:"walk",tag:"Natur",text:"Vogelparadies zwischen Nordsee und Limfjord.",query:"Agger Tange"},
  {name:"Lodbjerg Fyr",type:"trip",tag:"Halber Tag",text:"Leuchtturm, Dünenweg und Nationalpark.",query:"Lodbjerg Fyr"},
  {name:"Hundewald Vilsbøl",type:"walk",tag:"Twix",text:"Eingezäunter Freilauf-Wald nahe Vandet Sø.",query:"Vilsbøl hundeskov"},
  {name:"Klitmøller",type:"trip",tag:"Cold Hawaii",text:"Surferort und raues Küstengefühl.",query:"Klitmøller Denmark"},
  {name:"Thyborøn",type:"trip",tag:"Tagesausflug",text:"Fähre, Hafen und das Sneglehuset.",query:"Thyborøn"},
  {name:"Restaurant TRI",type:"food",tag:"Besonderer Abend",text:"Gehobene Küche; vorher reservieren.",query:"Restaurant TRI Agger"},
  {name:"Agger Darling",type:"food",tag:"Gemütlich",text:"Locker essen, teilweise mit Live-Musik.",query:"Agger Darling"},
  {name:"Vesterhavshytten",type:"food",tag:"Unkompliziert",text:"Snacks, Eis und Hotdogs.",query:"Vesterhavshytten Agger"},
  {name:"Hurup Thy",type:"trip",tag:"Einkaufen",text:"Großeinkauf und praktische Besorgungen.",query:"Hurup Thy"}
];

let items = loadLocal();
let onlyOpen = false;

function loadLocal(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(saved)&&saved.length?saved:structuredClone(baseItems)}catch{return structuredClone(baseItems)}}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(items));updateSummary()}
function hasCloud(){return Boolean(CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey)}
function headers(extra={}){return {apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${CONFIG.supabaseAnonKey}`,"Content-Type":"application/json",...extra}}

async function pullCloud(){
  if(!hasCloud())return;
  setSync("Synchronisiere …");
  try{
    const r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/packing_items?trip_id=eq.${encodeURIComponent(CONFIG.tripId)}&select=*`,{headers:headers()});
    if(!r.ok)throw new Error(await r.text());
    const cloud=await r.json();
    if(cloud.length){items=cloud.map(x=>({id:x.id,category:x.category,text:x.text,done:x.done,addedBy:x.added_by,checkedBy:x.checked_by,updatedAt:x.updated_at}));saveLocal();renderPack()}
    else await seedCloud();
    setSync("Gemeinsam synchronisiert");
  }catch(e){console.error(e);setSync("Offline - lokal gespeichert")}
}
async function seedCloud(){await fetch(`${CONFIG.supabaseUrl}/rest/v1/packing_items`,{method:"POST",headers:headers({Prefer:"resolution=merge-duplicates"}),body:JSON.stringify(items.map(toRow))})}
function toRow(x){return {id:x.id,trip_id:CONFIG.tripId,category:x.category,text:x.text,done:x.done,added_by:x.addedBy||currentUser(),checked_by:x.checkedBy||null,updated_at:new Date().toISOString()}}
async function pushItem(item){if(!hasCloud())return;try{await fetch(`${CONFIG.supabaseUrl}/rest/v1/packing_items`,{method:"POST",headers:headers({Prefer:"resolution=merge-duplicates"}),body:JSON.stringify(toRow(item))});setSync("Gemeinsam synchronisiert")}catch{setSync("Offline - lokal gespeichert")}}
async function deleteCloud(id){if(!hasCloud())return;try{await fetch(`${CONFIG.supabaseUrl}/rest/v1/packing_items?id=eq.${encodeURIComponent(id)}&trip_id=eq.${encodeURIComponent(CONFIG.tripId)}`,{method:"DELETE",headers:headers()})}catch{setSync("Offline - lokal gespeichert")}}

function currentUser(){return document.querySelector("#user-name")?.value||localStorage.getItem(USER_KEY)||"Marc"}
function setSync(text){document.querySelector("#sync-status").textContent=text}
function navigate(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===view));document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.go===view));window.scrollTo({top:view==="home"?0:document.querySelector("main").offsetTop-10,behavior:"smooth"})}

function updateCountdown(){const now=new Date();const start=new Date("2026-07-19T07:00:00+02:00");const end=new Date("2026-07-31T23:59:00+02:00");const el=document.querySelector("#countdown");if(now<start){const d=Math.ceil((start-now)/86400000);el.innerHTML=`<strong>${d}</strong><small>Tage bis Abfahrt</small>`}else if(now<end){el.innerHTML="<strong>Hej!</strong><small>Wir sind unterwegs</small>"}else{el.innerHTML="<strong>Tak</strong><small>für die Erinnerungen</small>"}}
function renderNextSteps(){const steps=["Adressanhänger für Twix besorgen","Tollwutimpfung und Heimtierausweis prüfen","Dachbox montieren und Probebeladung","48 h vorher Schlüsselcode sichern","Offline-Karten und Fährzeiten laden"];document.querySelector("#next-steps").innerHTML=steps.map((s,i)=>`<div class="mini-item"><span>${String(i+1).padStart(2,"0")}</span><div>${s}</div></div>`).join("")}
function renderPlaces(filter="all"){document.querySelector("#places").innerHTML=places.filter(p=>filter==="all"||p.type===filter).map(p=>`<article class="place"><div class="photo"><span>${p.tag}</span></div><div class="content"><h3>${p.name}</h3><p>${p.text}</p><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}">In Maps öffnen ↗</a></div></article>`).join("")}
function renderPack(){const filtered=onlyOpen?items.filter(i=>!i.done):items;const cats=[...new Set(items.map(i=>i.category))];document.querySelector("#pack-groups").innerHTML=cats.map(cat=>{const group=filtered.filter(i=>i.category===cat);if(!group.length)return"";return `<section class="pack-category"><h3>${cat}</h3>${group.map(i=>`<div class="pack-item ${i.done?"done":""}" data-id="${i.id}"><input type="checkbox" id="item-${i.id}" ${i.done?"checked":""}><label for="item-${i.id}">${escapeHtml(i.text)}<small>${i.done&&i.checkedBy?`Erledigt von ${escapeHtml(i.checkedBy)}`:`Hinzugefügt von ${escapeHtml(i.addedBy||"Vorlage")}`}</small></label><button class="delete-item" aria-label="${escapeHtml(i.text)} löschen">×</button></div>`).join("")}</section>`}).join("");updateSummary()}
function updateSummary(){const done=items.filter(i=>i.done).length,total=items.length,pct=total?done/total*100:0;document.querySelector("#pack-count").textContent=`${done} / ${total}`;document.querySelector("#packing-progress").textContent=`${done} von ${total} erledigt`;document.querySelector("#progress-bar").style.width=`${pct}%`}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}

document.addEventListener("click",e=>{
  const go=e.target.closest("[data-go]");if(go)navigate(go.dataset.go);
  const tab=e.target.closest("[data-panel]");if(tab){document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("selected",b===tab));document.querySelectorAll(".trip-panel").forEach(p=>p.classList.toggle("active",p.id===tab.dataset.panel))}
  const filter=e.target.closest("[data-filter]");if(filter){document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("selected",b===filter));renderPlaces(filter.dataset.filter)}
  const del=e.target.closest(".delete-item");if(del){const id=del.closest(".pack-item").dataset.id;items=items.filter(i=>i.id!==id);saveLocal();renderPack();deleteCloud(id)}
});
document.querySelector("#pack-groups").addEventListener("change",e=>{if(e.target.type!=="checkbox")return;const id=e.target.closest(".pack-item").dataset.id;const item=items.find(i=>i.id===id);item.done=e.target.checked;item.checkedBy=e.target.checked?currentUser():null;item.updatedAt=new Date().toISOString();saveLocal();renderPack();pushItem(item)});
document.querySelector("#add-item-form").addEventListener("submit",e=>{e.preventDefault();const input=document.querySelector("#new-item");const item={id:crypto.randomUUID(),category:document.querySelector("#new-category").value,text:input.value.trim(),done:false,addedBy:currentUser(),updatedAt:new Date().toISOString()};if(!item.text)return;items.push(item);input.value="";saveLocal();renderPack();pushItem(item)});
document.querySelector("#show-open").addEventListener("click",e=>{onlyOpen=!onlyOpen;e.target.textContent=onlyOpen?"Alle anzeigen":"Nur offene";renderPack()});
document.querySelector("#sync-button").addEventListener("click",pullCloud);
document.querySelector("#user-name").value=localStorage.getItem(USER_KEY)||"Marc";
document.querySelector("#user-name").addEventListener("change",e=>localStorage.setItem(USER_KEY,e.target.value));
window.addEventListener("focus",pullCloud);

updateCountdown();renderNextSteps();renderPlaces();renderPack();pullCloud();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js");

