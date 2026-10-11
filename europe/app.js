import {drawMap,drawTimeline} from './atlas.js?v=3';
import {escapeHtml as rawEsc,formatYear,timeRange,filterPlaces,migratePassport,validateBackup,STORAGE_KEY,BACKUP_APP,BACKUP_VERSION,validVisitDate} from './guide-core.js?v=3';

import {translate as tr,message as msg,getLanguage,useLanguage,loadChinese,preferredLanguage,LANGUAGE_KEY,chineseText,captureStaticCopy,applyStaticCopy,translateElement} from './i18n.js?v=3';

const $=id=>document.getElementById(id);
const esc=value=>rawEsc(tr(value));
const shellCopy=captureStaticCopy(document);
const localize=(...ids)=>ids.forEach(id=>translateElement($(id)));
let changingLanguage=false;
let mapChoicePlaces=[],historyContext=null;
const ACTS=[
  {title:'Mediterranean foundations',subtitle:'Cities, empires & continuity',legs:[1,2,3]},
  {title:'Competing medieval worlds',subtitle:'Faith, kingdoms & towns',legs:[4,5,6]},
  {title:'Renaissance & oceanic networks',subtitle:'Art, belief & global power',legs:[7,8,9,10]},
  {title:'Dynasties & mountain worlds',subtitle:'Cities, borders & landscapes',legs:[11,12]},
  {title:'Industry & the modern world',subtitle:'Change, conflict & renewal',legs:[13,14,15]}
];
let journeys=[],places=[],stories={},photos={},journeyPhotos={},histories=[],connections=[],gaps=[],oldSites=[];
let passport={version:2,records:{},legacyRecords:{}},feedbackTimer,searchTimer,resizeTimer;
const state={leg:1,beat:0,selectedId:'01-11',category:'all',collection:'journey',query:'',page:0,mapScale:'journey',timeScale:'journey',themeId:'C-001'};
const PAGE_SIZE=12;
const MAX_BACKUP_BYTES=16000000;
const record=id=>passport.records[id]??{planned:false,visited:false,date:'',rating:'',notes:''};
const currentJourney=()=>journeys.find(j=>j.leg===state.leg)??journeys[0];
const currentStory=()=>stories[String(state.leg)]??{};
const currentPlace=()=>places.find(p=>p.id===state.selectedId);
const journeyPlaces=()=>places.filter(p=>p.leg===state.leg);
const visiblePlaces=()=>filterPlaces(places,{leg:state.leg,collection:state.collection,category:state.category,query:state.query},record);
const actFor=leg=>ACTS.findIndex(a=>a.legs.includes(leg));
const shortName=(name,max=82)=>{const text=tr(String(name));return text.length>max?`${text.slice(0,max-1).trim()}…`:text;};
const meaningful=r=>r&&(r.planned||r.visited||r.date||r.rating||r.notes);
const geoDescription=p=>{const g=p?.geo;if(!g)return p?.cityArea??'';return /reference|representative/i.test(g.label)?tr(g.label):`${tr(g.label)} · ${tr(g.precision+' reference')}`;};
const moveTo=id=>$(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
const sourceLinks=(urls,max=4)=>(urls??[]).slice(0,max).map((url,index)=>`<a href="${esc(safeLink(url))}" target="_blank" rel="noopener noreferrer">${esc(new URL(safeLink(url),location.href).hostname.replace(/^www\./,''))}${index?` · ${index+1}`:''} ↗</a>`).join('');

function notify(message){$('feedback').textContent=tr(message);$('feedback').classList.add('visible');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('feedback').classList.remove('visible'),3500);}
function savePassport(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(passport));return true;}catch{notify('Your browser cannot save this trip. Download a copy to keep it.');return false;}}
function updateRecord(id,change){passport.records[id]={...record(id),...change};savePassport();renderPassport();}
function writeLocation(){const url=new URL(location.href);url.searchParams.set('journey',String(state.leg));url.searchParams.set('place',state.selectedId);history.replaceState(null,'',url);}

function switchJourney(leg,{placeId=null,scroll=true}={}){
  if(!journeys.some(j=>j.leg===Number(leg)))return;
  state.leg=Number(leg);state.beat=0;state.category='all';state.collection='journey';state.query='';state.page=0;
  const ids=currentStory().storyBeats?.[0]?.placeIds??[];
  state.selectedId=places.find(p=>p.id===placeId&&p.leg===state.leg)?.id??ids.find(id=>places.some(p=>p.id===id))??journeyPlaces()[0]?.id;
  $('place-search').value='';$('category-filter').value='all';$('collection-filter').value='journey';
  $('map-choices').hidden=true;$('history-context-detail').hidden=true;
  renderJourney();renderPlaces();renderDetail();renderAtlas();renderConnections();renderPassport();writeLocation();
  if(scroll)moveTo('journey');
}
function selectPlace(id,{scroll=false,fromStory=false}={}){
  const p=places.find(p=>p.id===id);if(!p)return;
  if(p.leg!==state.leg){state.leg=p.leg;state.beat=0;renderJourney();renderConnections();}
  state.selectedId=p.id;
  if(fromStory){state.category='all';state.query='';state.collection='journey';$('category-filter').value='all';$('place-search').value='';$('collection-filter').value='journey';state.page=0;}
  const filtered=visiblePlaces(),index=filtered.findIndex(x=>x.id===id);if(index>=0)state.page=Math.floor(index/PAGE_SIZE);
  renderPlaces();renderDetail();renderAtlas();writeLocation();
  if(scroll)moveTo('atlas');
}
function selectBeat(index){
  state.beat=index;const beat=currentStory().storyBeats?.[index];
  const first=beat?.placeIds?.find(id=>places.some(p=>p.id===id));
  renderBeats();if(first)selectPlace(first,{fromStory:true});
}
function renderJourney(){
  const j=currentJourney(),s=currentStory(),photo=journeyPhotos[String(state.leg)];
  $('journey-select').value=String(state.leg);
  $('previous-journey').disabled=state.leg===1;$('next-journey').disabled=state.leg===15;
  $('act-navigation').innerHTML=ACTS.map((a,i)=>`<button type="button" class="act-button ${i===actFor(state.leg)?'active':''}" data-act="${i}" aria-pressed="${i===actFor(state.leg)}"><span>${esc(msg('ACT {n}',{n:['I','II','III','IV','V'][i]}))}</span>${esc(a.title)}</button>`).join('');
  $('act-navigation').querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>switchJourney(ACTS[Number(b.dataset.act)].legs[0])));
  if(photo){$('hero-photo').src=photo.src;$('hero-photo').alt=tr(photo.caption??j.title);$('hero-credit').innerHTML=`${esc(photo.caption??j.title)} · <a href="${esc(safeLink(photo.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(photo.credit)}</a> · <a href="${esc(safeLink(photo.licenseUrl))}" target="_blank" rel="noopener noreferrer">${esc(photo.license)}</a>`;}
  $('journey-kicker').textContent=`${String(j.leg).padStart(2,'0')} / ${tr(s.kicker??ACTS[actFor(j.leg)].title)}`;
  $('journey-title').textContent=tr(j.title);$('journey-hook').textContent=tr(s.hook??j.civilizationStoryline);
  $('journey-region').textContent=tr(j.countriesRegion);$('journey-count').textContent=msg('{n} candidate experiences',{n:j.candidateCount});
  $('journey-period').textContent=tr(s.chronologySummary??'Overlapping historical layers');
  $('guiding-question').textContent=tr(j.guidingQuestion);$('journey-intro').textContent=tr(j.civilizationStoryline);
  $('route-backbone').textContent=tr(j.geographicBackbone);$('route-feasibility').textContent=tr(j.tenDayFeasibility);
  $('route-options').innerHTML=(s.routeOptions??[]).map(o=>`<div class="route-option"><strong>${esc(o.label)}</strong><span>${esc((o.hops??[]).map(tr).join(' · '))}</span><p>${esc(o.note??'')}</p></div>`).join('');
  $('route-cautions').innerHTML=`<ul>${[...(s.cautions??[]),...(s.recommendedSequence??[])].map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="edition-note">${esc(s.routeNote??'')} ${esc(msg('Guide chapter: pages {start}–{end}.',{start:s.chapterPageRange?.start??'?',end:s.chapterPageRange?.end??'?'}))}</p>`;
  $('chapter-grid').innerHTML=journeys.map(c=>{const ph=journeyPhotos[String(c.leg)];return `<button type="button" class="chapter-card ${c.leg===state.leg?'active':''}" data-journey="${c.leg}" aria-pressed="${c.leg===state.leg}"><img src="${esc(ph?.src??'images/parthenon.jpg')}" alt="${esc(ph?.caption??c.title)}" loading="lazy"><span class="chapter-card-text"><span class="chapter-number">${String(c.leg).padStart(2,'0')} / ${esc(ACTS[actFor(c.leg)].subtitle)}</span><strong>${esc(c.title)}</strong><small>${esc(msg('{n} experiences · {region}',{n:c.candidateCount,region:c.countriesRegion}))}</small></span></button>`;}).join('');
  $('chapter-grid').querySelectorAll('[data-journey]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.journey))));
  renderBeats();localize('act-navigation','chapter-grid','route-cautions');
}
function renderBeats(){
  const beats=currentStory().storyBeats??[],beat=beats[state.beat]??beats[0];
  $('story-beats').innerHTML=beats.map((b,i)=>`<button type="button" class="beat-button ${i===state.beat?'active':''}" data-beat="${i}" aria-pressed="${i===state.beat}"><small>${esc(msg('SCENE {n}',{n:i+1}))}</small><strong>${esc(b.title)}</strong></button>`).join('');
  $('story-beats').querySelectorAll('[data-beat]').forEach(b=>b.addEventListener('click',()=>selectBeat(Number(b.dataset.beat))));
  $('story-focus').innerHTML=beat?`<div class="beat-copy"><p class="eyebrow">${esc(beat.timeLabel??'Historical layers')}</p><h3>${esc(beat.title)}</h3><p>${esc(beat.text)}</p></div><div class="beat-anchors">${(beat.placeIds??[]).map(id=>places.find(p=>p.id===id)).filter(Boolean).map(p=>`<button type="button" data-anchor="${esc(p.id)}"><span>${esc(p.id)}</span>${esc(shortName(p.name,74))} ↗</button>`).join('')}</div>`:'';
  $('story-focus').querySelectorAll('[data-anchor]').forEach(b=>b.addEventListener('click',()=>selectPlace(b.dataset.anchor,{scroll:true,fromStory:true})));localize('story-beats','story-focus');
}
function reconcileSelection(){
  const filtered=visiblePlaces();
  if(filtered.length&&!filtered.some(p=>p.id===state.selectedId)){
    const p=filtered[0];if(p.leg!==state.leg){state.leg=p.leg;state.beat=0;renderJourney();renderConnections();}
    state.selectedId=p.id;
  }
  state.page=Math.max(0,Math.min(state.page,Math.max(0,Math.ceil(filtered.length/PAGE_SIZE)-1)));
  return filtered;
}
function renderPlaces(){
  const filtered=reconcileSelection(),list=filtered.slice(state.page*PAGE_SIZE,(state.page+1)*PAGE_SIZE);
  $('place-count').textContent=msg(`{n} ${filtered.length===1?'experience':'experiences'}${state.collection==='journey'?' in {journey}':state.collection==='trip'?' in your trip':' across all fifteen journeys'}`,{n:filtered.length,journey:currentJourney().title});
  $('place-list').innerHTML=list.map(p=>{const r=record(p.id);return `<article class="place-card ${p.id===state.selectedId?'active':''}"><div class="place-type"><span>${esc(p.category)} · ${esc(p.id)}</span>${r.visited?'<span class="visited-stamp">VISITED ✓</span>':''}</div><h3>${esc(p.name)}</h3><p class="place-city">${esc(p.cityArea)} · ${esc(p.country)}</p><p class="place-era">${esc(p.eraPeriod)}</p><div class="place-card-actions"><button type="button" data-place="${esc(p.id)}" aria-label="${esc(msg('Explore {name}',{name:p.name}))}">Explore its story ↗</button><button type="button" class="pick-button ${r.planned||r.visited?'picked':''}" data-pick="${esc(p.id)}" aria-label="${esc(msg(r.planned?'Remove {name} from my trip':'Add {name} to my trip',{name:p.name}))}" ${r.visited?'disabled':''}>${r.visited?'✓ Visited':r.planned?'✓ In my trip':'+ Keep'}</button></div></article>`;}).join('');
  $('place-list').querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>selectPlace(b.dataset.place,{scroll:true})));
  $('place-list').querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>togglePick(b.dataset.pick)));
  $('empty-places').hidden=filtered.length>0;
  const pages=Math.ceil(filtered.length/PAGE_SIZE);
  $('list-pagination').innerHTML=pages>1?`<button type="button" id="previous-page" ${state.page===0?'disabled':''}>← Previous</button><span>${state.page+1} / ${pages} · ${esc(msg('{n} candidates',{n:filtered.length}))}</span><button type="button" id="next-page" ${state.page===pages-1?'disabled':''}>Next →</button>`:'';
  $('previous-page')?.addEventListener('click',()=>{state.page--;renderPlaces();moveTo('places');});$('next-page')?.addEventListener('click',()=>{state.page++;renderPlaces();moveTo('places');});localize('place-list','list-pagination');
}
function togglePick(id){const r=record(id);if(r.visited){notify('This place is already recorded as visited.');return;}updateRecord(id,{planned:!r.planned});renderPlaces();renderDetail();renderPassport();renderAtlas();}
function renderDetail(){
  const p=currentPlace();if(!p||!visiblePlaces().length){$('place-detail').innerHTML='<div class="detail-content"><h3>Your next discovery awaits.</h3><p>Choose another experience, or clear the filters to return to this story.</p></div>';localize('place-detail');return;}
  const r=record(p.id),photo=photos[p.photoId??p.knownSiteId],g=p.geo,construction=p.verifiedConstruction;
  const locationDescription=geoDescription(p);
  $('place-detail').innerHTML=`${photo?`<figure class="detail-photo"><img src="${esc(photo.src)}" alt="${esc(construction?.label??oldSites.find(s=>s.id===p.knownSiteId)?.name??p.name)}" decoding="async"><figcaption>${construction?`${esc(construction.label)} · `:''}<a href="${esc(safeLink(photo.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(photo.credit)}</a> · <a href="${esc(safeLink(photo.licenseUrl))}" target="_blank" rel="noopener noreferrer">${esc(photo.license)}</a></figcaption></figure>`:''}
    <div class="detail-content"><div class="detail-meta"><span>${esc(p.category)} · ${esc(p.id)}</span><span>${r.visited?'VISITED ✓':r.planned?'IN MY TRIP':msg('JOURNEY {n}',{n:String(p.leg).padStart(2,'0')})}</span></div><h3>${esc(p.name)}</h3><p class="detail-era">${esc(p.eraPeriod)}</p>
    <div class="detail-chunk"><span class="tiny-title">WHERE IT BELONGS</span><p>${esc(p.cityArea)}, ${esc(p.country)}<br><span class="small-label">${esc(locationDescription)}</span></p></div>
    <div class="detail-chunk"><span class="tiny-title">WHAT YOU WILL SEE OR DO</span><p>${esc(p.whatToSee)}</p></div><div class="detail-chunk"><span class="tiny-title">WHY IT MATTERS TO THE STORY</span><p>${esc(p.whyItMatters)}</p></div>
    ${construction?`<details><summary>${esc(msg('Time detail: {name} · {dates}',{name:construction.label,dates:construction.dateLabel}))}</summary><p>${esc(construction.note??'')} ${esc(tr('These dates identify the featured building within this candidate’s wider historical context.'))}</p>${sourceLinks([construction.sourceUrl])}</details>`:''}
    <details><summary>Geography, route choices & guide notes</summary><p>${esc(p.routeNotes)}</p><p>${esc(p.candidateStatus)}</p><p>${esc(msg('Original inventory {id} · workbook row {row}; guide chapter pages {start}–{end}.',{id:p.id,row:p.sourceRow,start:stories[String(p.leg)]?.chapterPageRange?.start??'?',end:stories[String(p.leg)]?.chapterPageRange?.end??'?'}))}</p><div class="detail-sources">${sourceLinks(g?.sourceUrl?[g.sourceUrl]:[])}</div></details>
    ${p.relatedLegs?.length?`<div class="detail-chunk"><span class="tiny-title">FOLLOW THIS IDEA ELSEWHERE</span><p>${esc(p.connectsTo)}</p><div class="detail-links">${p.relatedLegs.filter(l=>l!==p.leg).map(l=>`<button type="button" data-detail-journey="${l}">${String(l).padStart(2,'0')} · ${esc(journeys.find(j=>j.leg===l)?.title??'Journey')}</button>`).join('')}</div></div>`:''}
    <div class="detail-sources">${sourceLinks(p.sourceUrls,3)}${g?`<a href="https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lon}#map=${g.precision==='site'?17:11}/${g.lat}/${g.lon}" target="_blank" rel="noopener noreferrer">Open location reference ↗</a>`:''}</div>${p.sourceUrls?.length>3?`<details><summary>${esc(msg('All {n} source links',{n:p.sourceUrls.length}))}</summary><div class="detail-sources">${sourceLinks(p.sourceUrls,50)}</div></details>`:''}
    <div class="detail-actions"><button type="button" id="detail-pick" class="${r.planned||r.visited?'active':''}" aria-pressed="${r.planned||r.visited}" ${r.visited?'disabled':''}>${r.visited?'✓ In my passport':r.planned?'✓ In my trip':'+ Keep for my trip'}</button><button type="button" id="detail-visited" class="visited ${r.visited?'active':''}" aria-pressed="${r.visited}">${r.visited?'✓ Visited':'Mark visited'}</button></div>
    <details class="personal-record" ${r.planned||r.visited||r.notes?'open':''}><summary>My visit, impression & field notes</summary><div class="record-fields"><label>Visit date<input id="visit-date" type="date" value="${esc(r.date)}"></label><label>My impression<select id="visit-rating"><option value="">No rating</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${String(r.rating)===String(n)?'selected':''}>${n} / 5</option>`).join('')}</select></label><label class="notes-label">My field notes<textarea id="visit-notes" maxlength="6000" placeholder="What did you notice? What will you compare at the next stop?">${rawEsc(r.notes)}</textarea></label></div></details></div>`;
  $('detail-pick').addEventListener('click',()=>togglePick(p.id));
  $('detail-visited').addEventListener('click',()=>{updateRecord(p.id,r.visited?{visited:false}:{planned:true,visited:true});renderPlaces();renderDetail();renderPassport();renderAtlas();});
  $('visit-date').addEventListener('change',e=>updateRecord(p.id,{date:validVisitDate(e.target.value)?e.target.value:''}));
  $('visit-rating').addEventListener('change',e=>updateRecord(p.id,{rating:e.target.value}));
  $('visit-notes').addEventListener('input',e=>updateRecord(p.id,{notes:e.target.value.slice(0,6000)}));
  $('place-detail').querySelectorAll('[data-detail-journey]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.detailJourney))));localize('place-detail');
}
function renderMapChoices(){
  $('map-choices').innerHTML=mapChoicePlaces.map(p=>`<button type="button" class="${p.id===state.selectedId?'active':''}" data-map-place="${esc(p.id)}">${esc(shortName(p.name,90))} · ${esc(p.cityArea)}</button>`).join('');
  $('map-choices').querySelectorAll('[data-map-place]').forEach(b=>b.addEventListener('click',()=>selectPlace(b.dataset.mapPlace,{fromStory:true})));
}
function renderHistoryContext(){
  if(!historyContext)return;
  $('history-context-detail').innerHTML=`<strong>${esc(historyContext.label??historyContext.name??'Historical context')}</strong><p>${esc(historyContext.summary??historyContext.note??historyContext.description??'')}</p>${sourceLinks(historyContext.sourceUrl?[historyContext.sourceUrl]:[])}`;
}
function renderAtlas(){
  const j=currentJourney(),selected=visiblePlaces().length?currentPlace():null,list=journeyPlaces(),s=currentStory();
  $('map-caption').textContent=state.mapScale==='europe'?tr('Fifteen connected regional stories'):msg('{n} places · {region}',{n:list.length,region:j.countriesRegion});
  $('time-caption').textContent=tr(state.timeScale==='focus'?'Inspect the selected historical layer':'These histories overlap');
  drawMap({element:$('journey-map'),places:list,allPlaces:places,journey:{...j,routeCities:s.geoHops??[]},selected,scale:state.mapScale,record,onSelect:id=>selectPlace(id,{fromStory:true}),onCluster:group=>{
    mapChoicePlaces=group;$('map-choices').hidden=false;renderMapChoices();},onJourney:leg=>switchJourney(leg)});
  $('map-selection').innerHTML=selected?`<strong>${esc(selected.cityArea)}</strong> · ${esc(selected.country)}<br><span class="small-label">${esc(geoDescription(selected))}</span>`:`<span class="small-label">Journey context. Clear the filters or select a map reference to choose an experience.</span>`;
  $('selected-time-label').innerHTML=selected?`<strong>${esc(shortName(selected.name,100))}</strong><br>${esc(selected.eraPeriod)}${selected.verifiedConstruction?`<br><span class="small-label">${esc(msg('Featured building: {name} · {dates}',{name:selected.verifiedConstruction.label,dates:selected.verifiedConstruction.dateLabel}))}</span>`:''}`:'<strong>No matching experience</strong><br>Clear the filters to locate a place in history.';
  const anchors=(s.anchors??[]).map(a=>places.find(p=>p.id===a.placeId)).filter(Boolean);
  if(selected)drawTimeline({element:$('journey-timeline'),places:list,selected,histories,journey:{...j,anchorIds:anchors.map(p=>p.id)},scale:state.timeScale,onContext:item=>{
    if(item.id&&places.some(p=>p.id===item.id)){selectPlace(item.id,{fromStory:true});return;}
    historyContext=item;$('history-context-detail').hidden=false;renderHistoryContext();
  }});
  else{$('journey-timeline').replaceChildren();$('journey-timeline').removeAttribute('viewBox');$('journey-timeline').setAttribute('height','1');$('history-context-detail').hidden=true;}
  const crossTime=list.filter(p=>!timeRange(p)||(!p.verifiedConstruction&&p.time?.precision==='mixed'));
  $('time-floating').innerHTML=crossTime.length?`<strong>More than one time layer:</strong> ${esc(msg('{n} places in this chapter have mixed, open-ended or landscape contexts. Their original period labels remain visible in every place card.',{n:crossTime.length}))}`:'';localize('map-selection','selected-time-label','time-floating');
  if(!$('map-choices').hidden)renderMapChoices();
  if(!$('history-context-detail').hidden)renderHistoryContext();
}
function renderConnections(){
  const themes=connections.filter(c=>c.id.startsWith('C-')),theme=themes.find(c=>c.id===state.themeId)??themes[0];
  $('theme-select').value=theme?.id??'';
  $('theme-card').innerHTML=theme?`<div><h3>${esc(theme.theme)}</h3><p>${esc(theme.description)}</p></div><div class="theme-comparison"><span class="tiny-title">WHAT TO COMPARE</span><p>${esc(theme.whatToCompare??'')}</p><p class="example-list">${esc(theme.placesRegions??'')}</p><p class="example-list">${esc(theme.notes??'')}</p></div>`:'';
  const linked=connections.filter(c=>c.fromLegs.includes(state.leg)&&c.id.startsWith('L'));
  const outgoing=linked.slice(0,3);
  $('journey-bridges').innerHTML=outgoing.map(c=>{const leg=c.toLegs[0],j=journeys.find(j=>j.leg===leg);return `<button type="button" class="bridge-button" data-bridge="${leg}"><span>${esc(msg('CONTINUE THE STORY / {n}',{n:String(leg).padStart(2,'0')}))}</span><strong>${esc(j?.title??'Journey')}</strong><p>${esc(c.description)}</p></button>`;}).join('');
  $('journey-bridges').querySelectorAll('[data-bridge]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.bridge))));
  const relevant=connections.filter(c=>c.fromLegs.includes(state.leg)||c.toLegs.includes(state.leg));
  $('all-links-summary').textContent=msg('All {n} connections involving {journey}',{n:relevant.length,journey:currentJourney().title});
  $('all-links-list').innerHTML=relevant.map(c=>`<article><strong>${esc(c.theme)}</strong><p>${esc(c.description)}</p>${c.whatToCompare?`<p>${esc(c.whatToCompare)}</p>`:''}${c.placesRegions?`<p>${esc(c.placesRegions)}</p>`:''}${c.notes?`<p>${esc(c.notes)}</p>`:''}<div>${[...new Set([...c.fromLegs,...c.toLegs])].map(l=>`<button type="button" data-connected-leg="${l}">${String(l).padStart(2,'0')} · ${esc(journeys.find(j=>j.leg===l)?.title??'Journey')} ↗</button>`).join(' · ')}</div></article>`).join('');
  $('all-links-list').querySelectorAll('[data-connected-leg]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.connectedLeg))));localize('theme-card','journey-bridges','all-links-list');
}
function renderGaps(){
  $('coverage-gaps').innerHTML=gaps.map(g=>`<article><p class="tiny-title">${esc(g.region)}</p><h3>${esc(g.theme)}</h3><p>${esc(g.whyItMatters)}</p><p><strong>Places to consider:</strong> ${esc(g.placesToConsider)}</p><p>${esc(g.routeNotes)}</p><p>${esc(g.relationToLegs)}</p><div>${(g.relatedLegs??[]).map(l=>`<button type="button" data-gap-journey="${l}">${String(l).padStart(2,'0')} · ${esc(journeys.find(j=>j.leg===l)?.title??'Journey')}</button>`).join('')}</div><div>${sourceLinks(g.sourceUrls,20)}</div></article>`).join('');
  $('coverage-gaps').querySelectorAll('[data-gap-journey]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.gapJourney))));localize('coverage-gaps');
}
function renderPassport(){
  const saved=places.filter(p=>record(p.id).planned||record(p.id).visited),visited=saved.filter(p=>record(p.id).visited);
  $('nav-trip-count').textContent=saved.length;$('trip-planned').textContent=saved.length;$('trip-visited').textContent=visited.length;
  $('trip-journeys').textContent=`${new Set(visited.map(p=>p.leg)).size} / 15`;$('trip-categories').textContent=`${new Set(visited.map(p=>p.category)).size} / 10`;
  $('passport-summary').textContent=saved.length?msg('{n} places still to discover in your selected trip.',{n:saved.length-visited.length}):tr('Keep a few places from any chapter to begin your own journey.');
  const legacy=Object.entries(passport.legacyRecords).filter(([,r])=>meaningful(r));
  $('download-trip').disabled=!Object.values(passport.records).some(meaningful)&&!legacy.length;
  $('passport-journeys').innerHTML=journeys.map(j=>{const selected=saved.filter(p=>p.leg===j.leg),done=selected.filter(p=>record(p.id).visited),pct=selected.length?done.length/selected.length*100:0;return `<button type="button" class="passport-chip" data-passport-leg="${j.leg}"><span>${esc(msg('JOURNEY {n}',{n:String(j.leg).padStart(2,'0')}))}</span><strong>${esc(j.title)}</strong><small>${esc(msg('{done} visited / {kept} kept · {n} candidates',{done:done.length,kept:selected.length,n:j.candidateCount}))}</small><div class="mini-progress"><i style="width:${pct}%"></i></div></button>`;}).join('');
  $('passport-journeys').querySelectorAll('[data-passport-leg]').forEach(b=>b.addEventListener('click',()=>switchJourney(Number(b.dataset.passportLeg))));
  $('legacy-visits').hidden=!legacy.length;$('legacy-visits').innerHTML=legacy.length?`<h3>Your earlier passport records</h3><p>${esc(msg('These {n} landmarks sit outside the expanded guide’s candidate list. Their visit status and field notes are retained in your backup.',{n:legacy.length}))}</p>${legacy.map(([id,r])=>`<div class="legacy-record"><strong>${esc(oldSites.find(s=>s.id===id)?.name??id)}</strong> · ${esc(tr(r.visited?'visited':'kept'))}${r.date?` · ${esc(r.date)}`:''}${r.rating?` · ${esc(r.rating)} / 5`:''}${r.notes?`<p data-user-content>${rawEsc(r.notes)}</p>`:''}</div>`).join('')}`:'';localize('legacy-visits','passport-journeys');
}
function updateFilteredView(){state.page=0;$('map-choices').hidden=true;renderPlaces();renderDetail();renderAtlas();writeLocation();}
function clearFilters(){state.category='all';state.collection='journey';state.query='';state.page=0;$('category-filter').value='all';$('collection-filter').value='journey';$('place-search').value='';updateFilteredView();}
function populateMenus(){
  $('journey-select').innerHTML=ACTS.map((a,i)=>`<optgroup label="${esc(msg('ACT {n}',{n:i+1}))} · ${esc(a.title)}">${journeys.filter(j=>a.legs.includes(j.leg)).map(j=>`<option value="${j.leg}">${String(j.leg).padStart(2,'0')} · ${esc(j.title)}</option>`).join('')}</optgroup>`).join('');
  $('category-filter').innerHTML=`<option value="all">${esc('All experiences')}</option>`+[...new Set(places.map(p=>p.category))].sort().map(c=>`<option value="${rawEsc(c)}">${esc(c)}</option>`).join('');
  $('category-filter').value=state.category;
  $('theme-select').innerHTML=connections.filter(c=>c.id.startsWith('C-')).map(c=>`<option value="${esc(c.id)}">${esc(c.theme)}</option>`).join('');
  $('photo-credits').innerHTML=[...new Map([...Object.values(journeyPhotos),...Object.values(photos)].map(p=>[p.src,p])).values()].map(p=>`<p><a href="${esc(safeLink(p.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(p.caption??oldSites.find(s=>photos[s.id]?.src===p.src)?.name??p.file??'Landmark photograph')}</a> · ${esc(p.credit)} · <a href="${esc(safeLink(p.licenseUrl))}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a></p>`).join('');
  localize('photo-credits');
}
function bilingualSearch(){
  for(const p of places)p.searchText=[p.name,p.cityArea,p.country,p.cluster,p.category,p.eraPeriod,p.whatToSee,p.whyItMatters,p.connectsTo,p.routeNotes].map(chineseText).join(' ');
}
function renderLanguageControls(){
  for(const lang of ['en','zh']){$('language-'+lang).setAttribute('aria-pressed',String(getLanguage()===lang));$('language-'+lang).disabled=changingLanguage;}
}
async function changeLanguage(lang){
  if(changingLanguage||lang===getLanguage())return;
  changingLanguage=true;renderLanguageControls();
  try{
    if(lang==='zh')await loadChinese();
    useLanguage(lang);bilingualSearch();applyStaticCopy(document,shellCopy);populateMenus();
    renderJourney();renderPlaces();renderDetail();renderAtlas();renderConnections();renderGaps();renderPassport();
    try{localStorage.setItem(LANGUAGE_KEY,lang);}catch{}
    const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);
  }catch{notify('Chinese copy could not load. Please try again when your connection is ready.');}
  finally{changingLanguage=false;renderLanguageControls();}
}
function attachEvents(){
  $('language-en').addEventListener('click',()=>changeLanguage('en'));$('language-zh').addEventListener('click',()=>changeLanguage('zh'));
  $('journey-select').addEventListener('change',e=>switchJourney(Number(e.target.value)));
  $('previous-journey').addEventListener('click',()=>switchJourney(state.leg-1));$('next-journey').addEventListener('click',()=>switchJourney(state.leg+1));
  $('map-scale').addEventListener('change',e=>{state.mapScale=e.target.value;$('map-choices').hidden=true;renderAtlas();});$('time-scale').addEventListener('change',e=>{state.timeScale=e.target.value;renderAtlas();});
  $('category-filter').addEventListener('change',e=>{state.category=e.target.value;updateFilteredView();});$('collection-filter').addEventListener('change',e=>{state.collection=e.target.value;updateFilteredView();});
  $('place-search').addEventListener('input',e=>{state.query=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(updateFilteredView,160);});
  $('clear-selection').addEventListener('click',clearFilters);$('empty-reset').addEventListener('click',clearFilters);
  $('theme-select').addEventListener('change',e=>{state.themeId=e.target.value;renderConnections();});
  $('download-trip').addEventListener('click',()=>{const data={app:BACKUP_APP,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),records:passport.records,legacyRecords:passport.legacyRecords};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='my-europe-story-atlas-trip.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Your trip backup has been downloaded.');});
  $('restore-trip').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>MAX_BACKUP_BYTES)throw new Error('Choose a trip backup smaller than 16 MB.');const imported=validateBackup(JSON.parse(await file.text()),places,oldSites);passport={version:2,records:{...passport.records,...imported.records},legacyRecords:{...passport.legacyRecords,...imported.legacyRecords}};const saved=savePassport();renderPlaces();renderDetail();renderPassport();renderAtlas();if(saved)notify('Your trip records and earlier passport visits are restored.');}catch(error){notify(error.message??'This file could not be restored.');}e.target.value='';});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderAtlas,120);});
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){try{passport=migratePassport(null,JSON.parse(e.newValue),places,oldSites);renderPlaces();renderDetail();renderPassport();renderAtlas();}catch{}}});
}
async function start(){
  const read=async name=>{const response=await fetch(name);if(!response.ok)throw new Error(`Could not load ${name}`);return response.json();};
  const [guide,source,storyData,enrichment,photoData,heroPhotos,historyData,oldWest,oldNorth]=await Promise.all([read('journeys-source.json'),read('places-source.json'),read('journey-stories.json'),read('place-enrichment.json'),read('photos.json'),read('journey-photos.json'),read('timeline-data.json'),read('data-west.json'),read('data-north.json')]);
  journeys=guide.journeys;connections=guide.connections;gaps=guide.coverageGaps;stories=storyData;photos=photoData;journeyPhotos=heroPhotos;histories=historyData;oldSites=[...oldWest,...oldNorth];
  places=source.map(p=>({...p,...enrichment[p.id],geo:enrichment[p.id]?.geolocation,time:enrichment[p.id]?.historicaltime}));
  const language=preferredLanguage(location.search,localStorage);
  if(language==='zh'){try{await loadChinese();useLanguage('zh');bilingualSearch();}catch{useLanguage('en');notify('Chinese copy could not load. Please try again when your connection is ready.');}}
  else useLanguage('en');
  applyStaticCopy(document,shellCopy);renderLanguageControls();
  let legacy=null,newer=null;
  try{legacy=JSON.parse(localStorage.getItem('europe-architecture-passport-v1'));}catch{}
  try{newer=JSON.parse(localStorage.getItem(STORAGE_KEY));}catch{}
  passport=migratePassport(legacy,newer,places,oldSites);
  const params=new URLSearchParams(location.search),leg=Number(params.get('journey'));if(journeys.some(j=>j.leg===leg))state.leg=leg;
  const requested=places.find(p=>p.id===params.get('place'));if(requested)state.leg=requested.leg;
  state.selectedId=requested?.id??currentStory().storyBeats?.[0]?.placeIds?.[0]??journeyPlaces()[0]?.id;
  populateMenus();
  attachEvents();renderJourney();renderPlaces();renderDetail();renderAtlas();renderConnections();renderGaps();renderPassport();
  if(language==='en')loadChinese().then(()=>{bilingualSearch();if(state.query)updateFilteredView();}).catch(()=>{});
}
start().catch(error=>{console.error(error);$('place-detail').innerHTML='<div class="detail-content"><h3>The guide could not load.</h3><p>Please refresh the page when your connection is ready.</p></div>';localize('place-detail');notify('The atlas could not load. Please refresh to try again.');});
