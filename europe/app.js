import world from 'https://esm.sh/@d3-maps/atlas@1.0.0/world/countries/countries-110m';
import { feature } from 'https://esm.sh/topojson-client@3.1.0';

const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toAxis = y => y < 0 ? y + 1 : y;
const formatYear = y => `${Math.abs(y).toLocaleString('en-US')} ${y < 0 ? 'BCE' : 'CE'}`;
const axisYear = y => formatYear(y <= 0 ? Math.round(y)-1 : Math.round(y));
const storageKey = 'europe-architecture-passport-v1';
let sites = [], histories = [], eras = [], photos = {}, selectedId = 'parthenon';
let trip = {}, mapFeatures = [], filterTimer, feedbackTimer;
const state = {country:'all',era:'all',query:'',view:'all',window:'classical',cluster:[]};

function record(id) { return trip[id] ?? {planned:false,visited:false,date:'',rating:'',notes:''}; }
function getSelected() { return sites.find(s => s.id === selectedId) ?? sites[0]; }
function eraFor(id) { return eras.find(e => e.id === id); }
function selectedSites() {
  const query = state.query.toLocaleLowerCase().trim();
  return sites.filter(s => (state.country === 'all' || s.iso3 === state.country)
    && (state.era === 'all' || s.eraId === state.era)
    && (state.view === 'all' || record(s.id).planned || record(s.id).visited)
    && (!state.cluster.length || state.cluster.includes(s.id))
    && (!query || `${s.name} ${s.city} ${s.country} ${s.style} ${s.civilization}`.toLocaleLowerCase().includes(query)));
}
function notify(message) {
  $('feedback').textContent = message;
  $('feedback').classList.add('visible');
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => $('feedback').classList.remove('visible'), 3200);
}
function normalizedTrip(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
  for (const s of sites) {
    const r = Object.hasOwn(raw,s.id) ? raw[s.id] : null;
    if (!r || typeof r !== 'object') continue;
    clean[s.id] = {planned:r.planned === true || r.visited === true,visited:r.visited === true,
      date:validVisitDate(r.date) ? r.date : '',
      rating:['1','2','3','4','5'].includes(String(r.rating)) ? String(r.rating) : '',
      notes:typeof r.notes === 'string' ? r.notes.slice(0,6000) : ''};
  }
  return clean;
}
function validVisitDate(value) {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000'))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
}
function saveTrip() {
  try { localStorage.setItem(storageKey,JSON.stringify({version:1,trip})); return true; }
  catch { notify('This browser cannot save your trip. Download a copy to keep it.'); return false; }
}
function updateRecord(id,changes) {
  trip[id] = {...record(id),...changes};
  saveTrip();
}
function togglePlan(id) {
  const r = record(id);
  updateRecord(id,r.planned || r.visited ? {planned:false,visited:false} : {planned:true});
  render();
}
function chooseSite(id,scroll=false) {
  selectedId = id;
  const s = getSelected();
  ensureWindow(s);
  renderDetail(); drawMap(); drawTimeline(); renderCards();
  if (scroll) $('explore').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
}
function ensureWindow(s) {
  if (s.startYear < -800) state.window = 'all';
  else if (state.window === 'medieval' && s.endYear < 500) state.window = 'classical';
  $('time-window').value = state.window;
}
function updatePassport() {
  const inTrip = sites.filter(s => record(s.id).planned || record(s.id).visited);
  const visited = sites.filter(s => record(s.id).visited);
  $('visited-score').textContent = `${visited.length} / ${inTrip.length}`;
  $('countries-score').textContent = new Set(visited.map(s => s.iso3)).size;
  $('eras-score').textContent = new Set(visited.map(s => s.eraId)).size;
  $('passport-summary').textContent = inTrip.length ? `${inTrip.length-visited.length} ${inTrip.length-visited.length === 1 ? 'stop still' : 'stops still'} to discover in your trip.` : 'Add your first stop to start your trip.';
  $('download-trip').disabled = !Object.keys(trip).length;
}
function renderDetail() {
  if (!selectedSites().length) {
    $('selected-card').innerHTML = '<div class="selected-content"><h3>Your next discovery awaits.</h3><p>Choose a different filter, or add buildings from Explore all to start your personal trip.</p></div>';
    return;
  }
  const s = getSelected(), r = record(s.id), photo = photos[s.id];
  $('selected-card').innerHTML = `${photo ? `<figure class="selected-photo"><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(s.name)}, ${escapeHtml(s.city)}" decoding="async"><figcaption class="photo-caption"><a href="${escapeHtml(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.credit)}</a> · <a href="${escapeHtml(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license)}</a></figcaption></figure>` : `<div class="photo-placeholder"><span>${escapeHtml(s.city)}</span><small>ARCHITECTURE FIELD GUIDE</small></div>`}
    <div class="selected-content"><div class="site-location"><span>${escapeHtml(s.city)} · ${escapeHtml(s.country)}</span>${r.visited ? '<span class="status-label">✓ VISITED</span>' : r.planned ? '<span class="status-label">IN YOUR TRIP</span>' : ''}</div>
    <h3>${escapeHtml(s.name)}</h3><p class="site-dates">${escapeHtml(s.dateLabel)}</p><div class="style-label">${escapeHtml(s.style)}</div>
    <p class="context-name">${escapeHtml(s.civilization)}</p><p>${escapeHtml(s.significance)}</p>
    <div class="look-for"><strong>WHEN YOU ARE THERE</strong><p>${escapeHtml(s.lookFor)}</p></div>
    <p class="construction-note">${escapeHtml(s.constructionNote)}</p><div class="detail-sources"><a href="${escapeHtml(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.sourceName)} ↗</a>${s.secondarySourceUrl ? `<a href="${escapeHtml(s.secondarySourceUrl)}" target="_blank" rel="noopener noreferrer">Further history ↗</a>` : ''}<a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}" target="_blank" rel="noopener noreferrer">Find on a street map ↗</a></div>
    <div class="trip-buttons"><button id="detail-plan" type="button" class="${r.planned || r.visited ? 'active' : ''}" aria-pressed="${r.planned || r.visited}">${r.planned || r.visited ? '✓ In my trip' : '+ Add to my trip'}</button><button id="detail-visited" type="button" class="visited ${r.visited ? 'active' : ''}" aria-pressed="${r.visited}">${r.visited ? '✓ Visited' : 'Mark visited'}</button></div>
    <div class="personal-record"><label>Visit date (optional)<input id="visit-date" type="date" value="${escapeHtml(r.date)}"></label><label>Your impression (optional)<select id="visit-rating"><option value="">No rating</option>${[1,2,3,4,5].map(n => `<option value="${n}" ${String(r.rating) === String(n) ? 'selected' : ''}>${n} / 5</option>`).join('')}</select></label><label class="notes-label">My field notes<textarea id="visit-notes" maxlength="6000" placeholder="What did you notice? A column, an arch, a story…">${escapeHtml(r.notes)}</textarea></label></div></div>`;
  $('detail-plan').addEventListener('click',() => togglePlan(s.id));
  $('detail-visited').addEventListener('click',() => {updateRecord(s.id,r.visited ? {visited:false} : {visited:true,planned:true});render();});
  $('visit-date').addEventListener('change',e => updateRecord(s.id,{date:e.target.value}));
  $('visit-rating').addEventListener('change',e => updateRecord(s.id,{rating:e.target.value}));
  $('visit-notes').addEventListener('input',e => updateRecord(s.id,{notes:e.target.value}));
}
function renderCards() {
  const visible = selectedSites();
  $('collection-count').textContent = `${visible.length} ${visible.length === 1 ? 'landmark' : 'landmarks'}${state.view === 'trip' ? ' in your trip' : ' in this selection'}`;
  $('building-grid').innerHTML = visible.map(s => {
    const r = record(s.id);
    return `<article class="building-card ${s.id === selectedId ? 'selected' : ''}">${r.visited ? '<span class="visited-stamp">VISITED ✓</span>' : ''}<p class="card-country">${escapeHtml(s.country)} · ${escapeHtml(s.city)}</p><h3>${escapeHtml(s.name)}</h3><p class="card-date">${escapeHtml(s.dateLabel)}</p><p class="card-style">${escapeHtml(s.style)}</p><div class="card-footer"><button class="card-open" type="button" data-open="${s.id}" aria-label="Explore ${escapeHtml(s.name)}">Explore its story ↗</button><button class="card-plan ${r.planned || r.visited ? 'active' : ''}" type="button" data-plan="${s.id}" aria-pressed="${r.planned || r.visited}" aria-label="${r.planned || r.visited ? 'Remove' : 'Add'} ${escapeHtml(s.name)} ${r.planned || r.visited ? 'from' : 'to'} my trip">${r.planned || r.visited ? '✓ In my trip' : '+ My trip'}</button></div></article>`;
  }).join('');
  $('building-grid').querySelectorAll('[data-open]').forEach(b => b.addEventListener('click',() => chooseSite(b.dataset.open,true)));
  $('building-grid').querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click',() => togglePlan(b.dataset.plan)));
  $('empty-state').hidden = visible.length > 0;
  $('empty-copy').textContent = state.view === 'trip' ? 'Add a few buildings to your trip from Explore all.' : 'Try another country or period, or clear the map selection.';
  const countrySites = sites.filter(s => state.country === 'all' || s.iso3 === state.country);
  $('era-coverage').innerHTML = eras.filter(e => countrySites.some(s => s.eraId === e.id)).map(e => {
    const group = countrySites.filter(s => s.eraId === e.id), visited = group.filter(s => record(s.id).visited).length;
    return `<button type="button" data-era="${e.id}" class="${state.era === e.id ? 'active' : ''}" aria-pressed="${state.era === e.id}" aria-label="${escapeHtml(e.label)}: ${visited} of ${group.length} selected collection sites visited">${escapeHtml(e.label)}<span>${visited} / ${group.length}</span></button>`;
  }).join('');
  $('era-coverage').querySelectorAll('[data-era]').forEach(b => b.addEventListener('click',() => {state.era = state.era === b.dataset.era ? 'all' : b.dataset.era;state.cluster=[];syncFilters();render();}));
}
function mapProjection(width,height) {
  const projection = d3.geoConicConformal().parallels([35,65]).rotate([-12,0]).center([0,52]).scale(1).translate([0,0]);
  const points = [];
  for (let lon=-15;lon<=40;lon+=5) for (let lat=33;lat<=71;lat+=3) points.push(projection([lon,lat]));
  const [xmin,xmax] = d3.extent(points,p => p[0]), [ymin,ymax] = d3.extent(points,p => p[1]);
  const scale = Math.min((width-16)/(xmax-xmin),(height-18)/(ymax-ymin));
  return projection.scale(scale).translate([(width-scale*(xmax+xmin))/2,(height-scale*(ymax+ymin))/2]);
}
function drawMap() {
  const visible = selectedSites(), selected = visible.length ? getSelected() : null;
  $('map-count').textContent = `${visible.length} ${visible.length === 1 ? 'stop' : 'stops'} on the map`;
  const svg = d3.select($('europe-map')), width = $('europe-map').clientWidth || 500, height = Math.max(285,Math.min(430,width*.76));
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height); svg.selectAll('*').remove();
  svg.append('title').text('European architecture landmarks, grouped where nearby points overlap');
  svg.append('desc').text('Select a country to filter the collection. Select a dot to explore a building. Numbered dots contain several nearby stops. Country outlines are modern reference boundaries.');
  const projection = mapProjection(width,height), path = d3.geoPath(projection);
  const countryIds = new Set(sites.map(s => s.iso3));
  const map = svg.append('g');
  map.selectAll('path').data(mapFeatures).join('path').attr('d',path).attr('class',d => `country ${countryIds.has(d.properties.id) ? 'interactive' : ''} ${d.properties.id === state.country ? 'filtered' : ''} ${d.properties.id === selected?.iso3 ? 'selected' : ''}`)
    .attr('aria-label',d => sites.find(s => s.iso3 === d.properties.id)?.country ?? d.properties.name ?? d.properties.id)
    .on('click',(_,d) => {if (!countryIds.has(d.properties.id)) return;state.country = state.country === d.properties.id ? 'all' : d.properties.id;state.cluster=[];syncFilters();render();});
  const labels = new Set(['GBR','FRA','ESP','DEU','ITA','POL','SWE','NOR','GRC','TUR']);
  mapFeatures.filter(f => labels.has(f.properties.id)).forEach(f => {
    const centroid = d3.geoCentroid(f), p = projection(centroid), name = sites.find(s => s.iso3 === f.properties.id)?.country;
    if (p && p[0] > 15 && p[0] < width-15 && p[1] > 10 && p[1] < height-10 && name) svg.append('text').attr('x',p[0]).attr('y',p[1]).attr('text-anchor','middle').attr('class','map-label').text(name === 'United Kingdom' ? 'UK' : name);
  });
  const groups = [];
  visible.forEach(s => {
    const [x,y] = projection([s.lon,s.lat]);
    const group = groups.find(g => Math.hypot(g.x-x,g.y-y)<18);
    if (group) {group.sites.push(s);group.x = d3.mean(group.sites,t => projection([t.lon,t.lat])[0]);group.y=d3.mean(group.sites,t => projection([t.lon,t.lat])[1]);}
    else groups.push({x,y,sites:[s]});
  });
  for (const group of groups) {
    const isSelected = group.sites.some(s => s.id === selectedId), allVisited = group.sites.every(s => record(s.id).visited), anyPlan = group.sites.some(s => record(s.id).planned || record(s.id).visited);
    const color = allVisited ? '#a8863c' : '#315b4e';
    const pin = svg.append('g').attr('class','map-pin').attr('transform',`translate(${group.x},${group.y})`).attr('role','button').attr('tabindex',0)
      .attr('aria-label',group.sites.length > 1 ? `Choose from ${group.sites.length} nearby buildings: ${group.sites.map(s => s.name).join(', ')}` : `Explore ${group.sites[0].name}, ${group.sites[0].city}`);
    if (isSelected) pin.append('circle').attr('r',18).attr('fill','#ad6144').attr('opacity',.14);
    pin.append('circle').attr('r',group.sites.length > 1 ? 10 : 6).attr('fill',isSelected ? '#ad6144' : anyPlan ? color : '#fffdf8').attr('stroke',isSelected ? '#ad6144' : color).attr('stroke-width',1.8);
    if (group.sites.length > 1) pin.append('text').attr('text-anchor','middle').attr('y',3.5).attr('fill',isSelected || anyPlan ? '#fffdf8' : color).attr('font-family','DM Sans,system-ui,sans-serif').attr('font-size',9).text(group.sites.length);
    pin.append('circle').attr('r',18).attr('fill','transparent');
    pin.append('title').text(group.sites.map(s => `${s.name} · ${s.city}`).join('\n'));
    const activate = () => {
      if (group.sites.length === 1) {chooseSite(group.sites[0].id);$('cluster-choices').hidden=true;}
      else {const choice = $('cluster-choices');choice.hidden=false;choice.innerHTML=group.sites.map(s=>`<button type="button" data-map-stop="${s.id}">${escapeHtml(s.name)} · ${escapeHtml(s.city)}</button>`).join('');choice.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>chooseSite(b.dataset.mapStop)));}
    };
    pin.on('click',activate).on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});
  }
}
function wrapLabel(group,text,x,y,maxWidth) {
  const words = text.split(/\s+/), node = group.append('text').attr('class','row-label').attr('x',x).attr('y',y);let line=[],n=0;
  let span = node.append('tspan').attr('x',x).attr('dy',0);
  for(const word of words){line.push(word);span.text(line.join(' '));if(span.node().getComputedTextLength()>maxWidth && line.length>1){line.pop();span.text(line.join(' '));line=[word];span=node.append('tspan').attr('x',x).attr('dy',13).text(word);n++;}}
  return (n+1)*13;
}
function drawTimeline() {
  const selected = getSelected(), era = eraFor(selected.eraId), visible = selectedSites();
  $('time-context').innerHTML = `<strong>${escapeHtml(selected.name)}</strong> · <span class="phase-text">${escapeHtml(selected.dateLabel)}</span> · ${escapeHtml(selected.civilization)}<br>Dashed guide: construction begins ${formatYear(selected.startYear)}.${state.country !== 'all' ? `<br>Context tracks with a geographic connection to ${escapeHtml(selected.country)}.` : '<br>European context tracks; geography and political influence changed over time.'}`;
  const svg = d3.select($('history-timeline'));if(!visible.length){svg.selectAll('*').remove();svg.attr('height',1);$('time-context').textContent='Choose a building in this selection to locate it in history.';$('period-detail').hidden=true;return;}const width = $('history-timeline').clientWidth || 900, compact=width<540;
  svg.selectAll('*').remove();
  const range = state.window === 'all' ? [-3199,2026] : state.window === 'medieval' ? [500,2026] : [-799,2026];
  const left = compact ? 123 : 222, right = width-8, x=d3.scaleLinear().domain(range).range([left+5,right-4]);
  const contextCountry=state.country==='VAT'?'ITA':state.country;
  const tracks=histories.filter(h => (state.country==='all' || h.countryCodes.includes(contextCountry)) && toAxis(h.endYear)>=range[0] && toAxis(h.startYear)<=range[1]);
  const rows=[{id:'selected',label:'Construction span',startYear:selected.startYear,endYear:selected.endYear,selected:true,summary:selected.constructionNote,sourceUrl:selected.sourceUrl,sourceName:selected.sourceName},
    ...(era ? [{...era,label:`Architecture · ${era.label}`,architecture:true}] : []),...tracks];
  let y=43;const layout=[];
  for(const row of rows){const node=svg.append('g');const labelHeight=wrapLabel(node,row.label,0,y+10,left-13);const height=Math.max(35,labelHeight+8);layout.push({row,y,height,node});y+=height;}
  const height=y+57;svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height);
  svg.append('title').text(`Construction phase and historical contexts for ${selected.name}`);
  svg.append('desc').text('The first band locates the selected building’s construction. The next band is an illustrative architectural flowering period. Remaining bands are political or cultural contexts. Modern geographic references do not reconstruct historical borders.');
  const ticks=compact ? [range[0],range[1]] : d3.ticks(range[0]<=0?range[0]-1:range[0],range[1],5).map(y=>toAxis(y===0?1:y));
  for(const t of ticks){const px=x(t);svg.insert('line',':first-child').attr('x1',px).attr('x2',px).attr('y1',29).attr('y2',y+10).attr('stroke','#dcded2').attr('stroke-width',1);svg.append('text').attr('x',px).attr('y',15).attr('text-anchor',t===ticks[0]?'start':t===ticks[ticks.length-1]?'end':'middle').text(axisYear(t));}
  const mid=toAxis(selected.startYear);
  if(mid>=range[0] && mid<=range[1])svg.append('line').attr('x1',x(mid)).attr('x2',x(mid)).attr('y1',28).attr('y2',y+10).attr('stroke','#ad6144').attr('stroke-width',1).attr('stroke-dasharray','3 4');
  for(const {row,y:ry,height:rh,node} of layout){
    if (toAxis(row.endYear)<range[0] || toAxis(row.startYear)>range[1]) {
      node.append('text').attr('x',left+5).attr('y',ry+12).text('Outside this window');
      continue;
    }
    const start=x(Math.max(range[0],toAxis(row.startYear))),end=x(Math.min(range[1],toAxis(row.endYear))), overlaps=toAxis(row.startYear)<=mid && toAxis(row.endYear)>=mid;
    const rect=node.append('rect').attr('x',start).attr('y',ry+4).attr('width',Math.max(2,end-start)).attr('height',row.selected?10:7).attr('rx',1).attr('fill',row.selected?'#ad6144':row.architecture?'#a8863c':overlaps?'#577b67':'#b9c6b8').attr('opacity',row.selected||row.architecture||overlaps?1:.6);
    rect.append('title').text(`${row.label}: ${row.dateLabel??selected.dateLabel}`);
    if(!row.selected){const activate=()=>{$('period-detail').hidden=false;$('period-detail').innerHTML=`<strong>${escapeHtml(row.label)} · ${escapeHtml(row.dateLabel)}</strong><br>${escapeHtml(row.summary)} ${escapeHtml(row.rangeNote??row.geographyNote??'')} <a href="${escapeHtml(row.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.sourceName)} ↗</a>`;};node.append('rect').attr('x',left).attr('y',ry-3).attr('width',right-left).attr('height',rh-2).attr('fill','transparent').attr('class','history-hit').attr('tabindex',0).attr('role','button').attr('aria-label',`Read about ${row.label}`).on('click',activate).on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});}
  }
  visible.filter(s=>s.id!==selectedId).forEach(s=>{const year=toAxis(s.startYear);if(year>=range[0] && year<=range[1]){const c=svg.append('circle').attr('cx',x(year)).attr('cy',y+23).attr('r',3).attr('fill','#a8863c').attr('opacity',.7);c.append('title').text(`${s.name}: ${s.dateLabel}`);}});
  svg.append('text').attr('x',0).attr('y',y+27).text('Other starts');
  svg.append('text').attr('x',(left+right)/2).attr('y',height-6).attr('text-anchor','middle').text('Time · BCE / CE');
}
function syncFilters() {$('country-filter').value=state.country;$('era-filter').value=state.era;$('search-filter').value=state.query;$('view-all').classList.toggle('active',state.view==='all');$('view-trip').classList.toggle('active',state.view==='trip');$('view-all').setAttribute('aria-pressed',state.view==='all');$('view-trip').setAttribute('aria-pressed',state.view==='trip');$('cluster-choices').hidden=true;$('period-detail').hidden=true;}
function render(){
  const visible=selectedSites();
  if(visible.length && !visible.some(s=>s.id===selectedId)) {
    selectedId=visible[0].id;ensureWindow(getSelected());
    $('cluster-choices').hidden=true;$('period-detail').hidden=true;
  }
  updatePassport();renderDetail();renderCards();drawMap();drawTimeline();
}
function clearFilters(){state.country='all';state.era='all';state.query='';state.view='all';state.cluster=[];syncFilters();render();}
function attachEvents(){
  $('country-filter').addEventListener('change',e=>{state.country=e.target.value;state.cluster=[];syncFilters();const visible=selectedSites();if(visible.length&&!visible.some(s=>s.id===selectedId)){selectedId=visible[0].id;ensureWindow(getSelected());}render();});
  $('era-filter').addEventListener('change',e=>{state.era=e.target.value;state.cluster=[];syncFilters();const visible=selectedSites();if(visible.length&&!visible.some(s=>s.id===selectedId))selectedId=visible[0].id;chooseSite(selectedId);render();});
  $('search-filter').addEventListener('input',e=>{state.query=e.target.value;state.cluster=[];clearTimeout(filterTimer);filterTimer=setTimeout(render,140);});
  $('clear-filters').addEventListener('click',clearFilters);$('empty-reset').addEventListener('click',clearFilters);
  $('view-all').addEventListener('click',()=>{state.view='all';state.cluster=[];syncFilters();render();});$('view-trip').addEventListener('click',()=>{state.view='trip';state.cluster=[];syncFilters();render();});
  $('time-window').addEventListener('change',e=>{state.window=e.target.value;drawTimeline();});
  $('download-trip').addEventListener('click',()=>{const payload={app:'europe-architecture-passport',version:1,exportedAt:new Date().toISOString(),trip};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='my-europe-architecture-trip.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Your trip copy has been downloaded.');});
  $('restore-trip').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw new Error('The file is too large.');const payload=JSON.parse(await file.text());if(payload.app!=='europe-architecture-passport'||payload.version!==1||typeof payload.trip!=='object')throw new Error('Choose a trip file downloaded from this page.');const restored=normalizedTrip(payload.trip);trip={...trip,...restored};const saved=saveTrip();render();if(saved)notify(`Restored ${Object.keys(restored).length} building records.`);}catch(error){notify(error.message||'Could not restore this file.');}e.target.value='';});
  window.addEventListener('storage',e=>{if(e.key===storageKey){try{trip=normalizedTrip(JSON.parse(e.newValue)?.trip);render();}catch{}}});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{drawMap();drawTimeline();},100);});
}
async function start(){
  const read=async path=>{const response=await fetch(path);if(!response.ok)throw new Error(`Could not load ${path}`);return response.json();};
  const [west,north,history,architecture,photoData]=await Promise.all([read('data-west.json'),read('data-north.json'),read('timeline-data.json'),read('architecture-eras.json'),read('photos.json').catch(()=>({}))]);
  sites=[...west,...north].sort((a,b)=>a.startYear-b.startYear);histories=history;eras=architecture;photos=photoData;
  mapFeatures=feature(world,world.objects.features).features.flatMap(f=>{
    const polygons=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
    const regional=polygons.filter(p=>p[0].some(([lon,lat])=>lon>=-25&&lon<=60&&lat>=25&&lat<=74));
    return regional.length?[{...f,geometry:{type:'MultiPolygon',coordinates:regional}}]:[];
  });
  try{trip=normalizedTrip(JSON.parse(localStorage.getItem(storageKey))?.trip);}catch{trip={};}
  const countries=[...new Map(sites.map(s=>[s.iso3,s.country])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  $('country-filter').insertAdjacentHTML('beforeend',countries.map(([iso,name])=>`<option value="${iso}">${escapeHtml(name)}</option>`).join(''));
  $('era-filter').insertAdjacentHTML('beforeend',eras.filter(e=>sites.some(s=>s.eraId===e.id)).map(e=>`<option value="${e.id}">${escapeHtml(e.label)}</option>`).join(''));
  $('landmark-total').textContent=sites.length;$('country-total').textContent=countries.length;
  attachEvents();syncFilters();render();
}
start().catch(error=>{console.error(error);$('selected-card').innerHTML='<div class="selected-content"><h3>The atlas could not load.</h3><p>Please refresh the page when your connection is ready.</p></div>';$('map-count').textContent='Connection needed';notify('The atlas could not load. Please try refreshing.');});
