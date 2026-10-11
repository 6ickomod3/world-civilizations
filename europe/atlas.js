import world from 'https://esm.sh/@d3-maps/atlas@1.0.0/world/countries/countries-110m';
import { feature } from 'https://esm.sh/topojson-client@3.1.0';

const colors = { paper:'#fffdf7', land:'#e6e7dd', line:'#c5cbbd', sage:'#496957', pale:'#b4c4b1', brick:'#a35e46', gold:'#a88844', ink:'#2f3c34' };
const countries = feature(world, world.objects.features).features.flatMap(f => {
  const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
  const regional=polys.filter(poly=>poly[0].some(([lon,lat])=>lon>=-25&&lon<=60&&lat>=25&&lat<=74));
  return regional.length?[{...f,geometry:{type:'MultiPolygon',coordinates:regional}}]:[];
});
let drawing=0;
const placeName=p=>p?.name??p?.title??p?.id??'Place';
const placeId=p=>typeof p==='string'?p:p?.id;
const legOf=p=>Number(p?.leg??p?.legId??p?.journeyId??String(p?.id??'').replace(/^L/,'').split('-')[0]);
const validGeo=p=>Number.isFinite(p?.geo?.lat)&&Number.isFinite(p?.geo?.lon);
const getSelected=(places,selected)=>typeof selected==='object'?selected:places.find(p=>p.id===selected);
const toAxis=y=>y<0?y+1:y;
const fromAxis=y=>y<=0?Math.round(y)-1:Math.max(1,Math.round(y));
const yearLabel=y=>`${Math.abs(y).toLocaleString('en-US')} ${y<0?'BCE':'CE'}`;
const axisLabel=y=>yearLabel(fromAxis(y));
const widthOf=el=>Math.max(220,el.getBoundingClientRect().width||el.clientWidth||600);

function svgFor(element) {
  const el=typeof element==='string'?document.querySelector(element):element;
  if(!el)return null;
  const svg=el.tagName.toLowerCase()==='svg'?d3.select(el):d3.select(el).selectAll('svg.atlas-svg').data([null]).join('svg').attr('class','atlas-svg');
  svg.selectAll('*').remove();
  svg.attr('width','100%').attr('role','group').attr('font-family','inherit').attr('fill',colors.ink);
  return {el,svg,width:widthOf(el)};
}
function activate(node,callback) {
  node.attr('tabindex',0).attr('role','button').style('cursor','pointer').on('click',callback)
    .on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();callback();}});
}
function pointGroups(items,projection,distance=23) {
  const groups=[];
  for(const p of items){
    const xy=projection([p.geo.lon,p.geo.lat]);
    if(!xy||!xy.every(Number.isFinite))continue;
    const g=groups.find(g=>Math.hypot(g.x-xy[0],g.y-xy[1])<distance);
    if(g){g.places.push(p);g.x=d3.mean(g.places,p=>projection([p.geo.lon,p.geo.lat])[0]);g.y=d3.mean(g.places,p=>projection([p.geo.lon,p.geo.lat])[1]);}
    else groups.push({x:xy[0],y:xy[1],places:[p]});
  }
  return groups;
}

/** Geo points explicitly retain site/city/region precision. record(id) is optional. */
export function drawMap({element,places=[],allPlaces=places,journey,selected,scale='journey',record=p=>null,onSelect=()=>{},onCluster=()=>{},onJourney=()=>{}}={}) {
  const setup=svgFor(element);if(!setup)return;
  const {svg,width}=setup, height=Math.max(320,Math.min(440,width*.7)), token=++drawing;
  const active=getSelected(allPlaces,selected), sid=placeId(active??selected), items=(scale==='europe'?allPlaces:places).filter(validGeo);
  const leg=Number(journey?.leg??journey?.id??journey?.number??legOf(active));
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height).attr('aria-label',`${scale==='europe'?'Europe':'Journey'} map of historical place references`);
  svg.append('title').text('Places in geographic context');
  svg.append('desc').text('Modern country outlines are reference geography. City and region points are approximate references, not exact museum or entrance locations. Numbered markers group nearby candidates.');
  svg.append('rect').attr('width',width).attr('height',height).attr('fill',colors.paper).attr('rx',12);
  let west=-12,east=41,south=34,north=71;
  if(scale!=='europe'&&items.length){
    const longs=d3.extent(items,p=>p.geo.lon),lats=d3.extent(items,p=>p.geo.lat);
    const lonPad=Math.max(1.8,(longs[1]-longs[0])*.14),latPad=Math.max(1.2,(lats[1]-lats[0])*.14);
    west=Math.max(-15,longs[0]-lonPad);east=Math.min(45,longs[1]+lonPad);
    south=Math.max(31,lats[0]-latPad);north=Math.min(73,lats[1]+latPad);
  }
  const bounds={type:'MultiPoint',coordinates:[[west,south],[west,north],[east,south],[east,north]]};
  const projection=d3.geoMercator().fitExtent([[22,18],[width-22,height-30]],bounds),path=d3.geoPath(projection);
  const clipId=`atlas-map-clip-${token}`;
  svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('width',width).attr('height',height).attr('rx',12);
  const layer=svg.append('g').attr('clip-path',`url(#${clipId})`);
  const codes=new Set(places.flatMap(p=>p.countryCodes??(p.iso3?[p.iso3]:[])));
  layer.selectAll('path.country').data(countries).join('path').attr('class',f=>`country${codes.has(f.properties.id)?' journey-country':''}`)
    .attr('aria-hidden','true')
    .attr('d',path).attr('fill',f=>codes.has(f.properties.id)?'#d1dbca':colors.land).attr('stroke',colors.line).attr('stroke-width',.8)
    .append('title').text(f=>f.properties.name??f.properties.id);
  layer.selectAll('path.country').on('click',(_,f)=>{
    const options=allPlaces.filter(p=>(p.countryCodes??[]).includes(f.properties.id));
    const legs=[...new Set(options.map(legOf))].filter(Number.isFinite);
    if(legs.length===1)onJourney(legs[0]);else if(options.length)onCluster(options);
  });
  // Only caller-provided ordered reference cities are connected; lines never represent roads.
  if(Array.isArray(journey?.routeCities)){
    const route=journey.routeCities.map(city=>items.find(p=>(p.cityArea??p.city)===city)).filter(Boolean);
    if(route.length>1)layer.append('path').datum({type:'LineString',coordinates:route.map(p=>[p.geo.lon,p.geo.lat])}).attr('d',path).attr('fill','none').attr('stroke',colors.sage).attr('stroke-width',1.3).attr('stroke-dasharray','4 5').attr('opacity',.55).append('title').text('Conceptual connections between reference cities; not a transport route.');
  }
  const groups=pointGroups(items,projection,width<450?25:22), labels=[];
  for(const g of groups){
    const chosen=g.places.some(p=>p.id===sid), count=g.places.length;
    const states=g.places.map(p=>record(p.id)??p.record??{}),visited=states.every(r=>r.visited),planned=states.some(r=>r.planned||r.visited);
    const representative=g.places.find(p=>p.id===sid)??g.places[0], label=representative.geo.label.split(' · ')[0];
    const pin=layer.append('g').attr('class',`map-pin${chosen?' selected':''}`).attr('transform',`translate(${g.x},${g.y})`)
      .attr('aria-label',`${count===1?placeName(representative):count+' nearby candidates'}; ${representative.geo.label}`);
    pin.append('circle').attr('r',19).attr('fill','transparent');
    if(chosen)pin.append('circle').attr('r',20).attr('fill',colors.brick).attr('opacity',.16);
    pin.append('circle').attr('r',count>1?12:7).attr('fill',chosen?colors.brick:visited?colors.gold:planned?colors.sage:colors.paper).attr('stroke',chosen?colors.brick:colors.sage).attr('stroke-width',1.7);
    if(count>1)pin.append('text').attr('text-anchor','middle').attr('y',3.5).attr('font-size',10).attr('font-weight',600).attr('fill',chosen||visited||planned?colors.paper:colors.sage).text(count);
    pin.append('title').text(g.places.map(p=>`${placeName(p)}\n${p.geo.label} (${p.geo.precision} reference)`).join('\n\n'));
    activate(pin,()=>count>1?onCluster(g.places):onSelect(representative.id));
    const textWidth=Math.min(116,Math.max(35,label.length*5.4)),tx=Math.min(width-textWidth-8,Math.max(8,g.x+15)),ty=Math.max(15,Math.min(height-15,g.y-10));
    const collision=labels.some(l=>Math.abs(l.y-ty)<15&&tx<l.x+l.w&&tx+textWidth>l.x);
    if(chosen||(!collision&&scale!=='europe')){
      const short=label.length>22?label.slice(0,20)+'…':label;
      layer.append('text').attr('class','location-label').attr('x',tx).attr('y',ty).attr('font-size',chosen?11:10).attr('font-weight',chosen?650:500).attr('paint-order','stroke').attr('stroke',colors.paper).attr('stroke-width',3).attr('fill',colors.ink).text(short);
      labels.push({x:tx,y:ty,w:textWidth});
    }
  }
  if(!items.length)svg.append('text').attr('x',width/2).attr('y',height/2).attr('text-anchor','middle').attr('font-size',13).text('No mapped references in this selection.');
  return {groups:groups.map(g=>g.places),count:items.length,scale,journey:leg};
}

function spanFor(p) {
  if(p?.verifiedConstruction){const c=p.verifiedConstruction;return {...c,precision:'construction',construction:true};}
  const t=p?.time;
  if(!t||!Number.isFinite(t.startYear)||!Number.isFinite(t.endYear)||['mixed','modern-experience'].includes(t.precision))return null;
  return {...t,construction:t.precision==='construction'};
}
function labelLines(text,maxCharacters,limit=3) {
  const words=String(text).split(/\s+/),lines=[];let line='';
  for(const word of words){if(line&&line.length+word.length+1>maxCharacters){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)lines.push(line);
  return lines.length>limit?[...lines.slice(0,limit-1),lines[limit-1].slice(0,maxCharacters-1)+'…']:lines;
}
function drawWrapped(group,text,x,y,characters,font=11,limit=3) {
  const lines=labelLines(text,characters,limit),node=group.append('text').attr('x',x).attr('y',y).attr('font-size',font);
  lines.forEach((line,i)=>node.append('tspan').attr('x',x).attr('dy',i?14:0).text(line));
  return lines.length*14;
}

/** Mixed/undefined collection and geological ranges are labelled, never turned into points. */
export function drawTimeline({element,places=[],selected,histories=[],journey,scale='journey',onContext=()=>{}}={}) {
  const setup=svgFor(element);if(!setup)return;
  const {svg,width}=setup,compact=width<520,left=compact?Math.min(114,Math.max(82,width*.36)):Math.min(220,width*.27),right=width-10;
  const labelCharacters=Math.max(12,Math.floor((left-8)/6));
  const plotCharacters=Math.max(16,Math.floor((right-left-12)/5.3));
  const active=getSelected(places,selected)??places[0], primary=spanFor(active), sid=active?.id;
  const available=places.filter(p=>p.id!==sid);
  const midpoint=primary?(toAxis(primary.startYear)+toAxis(primary.endYear))/2:null;
  const anchorIds=journey?.anchorIds??journey?.anchors?.map(x=>typeof x==='string'?x:x.placeId??x.id);
  const ordered=Array.isArray(anchorIds)?anchorIds.map(id=>places.find(p=>p.id===id)).filter(p=>p&&p.id!==sid):available.slice().sort((a,b)=>{
    const aa=spanFor(a),bb=spanFor(b);
    const distance=s=>s&&midpoint!==null?Math.abs((toAxis(s.startYear)+toAxis(s.endYear))/2-midpoint):Infinity;
    return distance(aa)-distance(bb)||places.indexOf(a)-places.indexOf(b);
  });
  const anchors=[active,...ordered].filter(Boolean).slice(0,5);
  // The chapter lens includes every bounded supplied period, even where a mixed
  // candidate receives a visible label rather than a misleading plotted band.
  const spans=places.flatMap(p=>[p.time,p.verifiedConstruction]).concat(primary?[primary]:[])
    .filter(s=>s&&Number.isFinite(s.startYear)&&Number.isFinite(s.endYear));
  let domain=spans.length?[d3.min(spans,s=>toAxis(s.startYear)),d3.max(spans,s=>toAxis(s.endYear))]:null;
  if(scale==='focus'&&primary){
    const length=toAxis(primary.endYear)-toAxis(primary.startYear),pad=Math.max(120,length*.5);
    domain=[toAxis(primary.startYear)-pad,Math.min(2026,toAxis(primary.endYear)+pad)];
  }else if(domain){const pad=Math.max(45,(domain[1]-domain[0])*.06);domain=[domain[0]-pad,Math.min(2026,domain[1]+pad)];}
  if(domain&&domain[0]===domain[1])domain=[domain[0]-100,Math.min(2026,domain[1]+100)];
  if(domain){
    // Round the contextual lens, not the data, to legible civil-century edges.
    const first=Math.floor(fromAxis(domain[0])/100)*100;
    const last=Math.min(2026,Math.ceil(fromAxis(domain[1])/100)*100);
    domain=[toAxis(first===0?1:first),toAxis(last===0?1:last)];
  }
  const codes=new Set(places.flatMap(p=>p.countryCodes??(p.iso3?[p.iso3]:[])));
  if(codes.has('VAT'))codes.add('ITA');
  let relevant=histories.filter(h=>Number.isFinite(h.startYear)&&Number.isFinite(h.endYear)&&h.countryCodes?.some(c=>codes.has(c)));
  if(domain)relevant=relevant.filter(h=>toAxis(h.endYear)>=domain[0]&&toAxis(h.startYear)<=domain[1]);
  relevant.sort((a,b)=>{
    const overlap=h=>primary&&h.startYear<=primary.endYear&&h.endYear>=primary.startYear?1:0;
    return overlap(b)-overlap(a)||a.startYear-b.startYear;
  });
  relevant=relevant.slice(0,4).sort((a,b)=>a.startYear-b.startYear);
  const rows=[...anchors.map(p=>({label:placeName(p).split(':')[0],place:p,span:spanFor(p),selected:p.id===sid})),...relevant.map(h=>({label:h.label,history:h,span:{...h,precision:'context'},context:true}))];
  let y=42;const layout=[];
  for(const row of rows){
    const lines=labelLines(row.label,labelCharacters,3);
    const periodLabel=row.place?.time?.dateLabel??row.place?.eraPeriod??'Date range not established';
    const periodHeight=row.span?0:labelLines(periodLabel,plotCharacters,Infinity).length*14+14;
    const height=Math.max(46,lines.length*14+14,periodHeight);
    layout.push({...row,y,height,periodLabel});y+=height+(row===rows[anchors.length-1]?20:0);
  }
  const height=y+8;
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height).attr('aria-label','Selected place, representative candidates and historical contexts in time');
  svg.append('title').text(`Historical time around ${placeName(active)}`);
  svg.append('desc').text('Brick bands show verified construction phases. Sage bands show broad source periods; pale bands show political or cultural context. Mixed collections and geological landscapes are not assigned invented points. There is no year zero.');
  const x=domain?d3.scaleLinear().domain(domain).range([left+4,right-4]):null;
  if(x){
    const ticks=compact?[domain[0],domain[1]]:d3.ticks(fromAxis(domain[0]),fromAxis(domain[1]),4).map(y=>toAxis(y===0?1:y));
    ticks.forEach((t,i)=>{
      svg.append('line').attr('x1',x(t)).attr('x2',x(t)).attr('y1',30).attr('y2',y+2).attr('stroke',colors.line).attr('stroke-opacity',.6);
      svg.append('text').attr('x',x(t)).attr('y',16).attr('text-anchor',compact?(i?'end':'start'):'middle').attr('font-size',compact?10:11).text(axisLabel(t));
    });
    if(primary){const px=x(toAxis(primary.startYear));if(px>=left&&px<=right)svg.append('line').attr('x1',px).attr('x2',px).attr('y1',30).attr('y2',y+2).attr('stroke',colors.brick).attr('stroke-width',1).attr('stroke-dasharray','3 4').attr('opacity',.75);}
  }
  for(const row of layout){
    const g=svg.append('g').attr('class',`timeline-row${row.selected?' selected':''}${row.context?' context':''}`);
    drawWrapped(g,row.label,0,row.y+12,labelCharacters,compact?10.5:11,3);
    const fullLabel=row.history?.dateLabel??row.span?.dateLabel??row.place?.time?.dateLabel??row.place?.eraPeriod??'Multiple periods';
    g.append('title').text(`${row.label}\n${fullLabel}\n${row.span?.note??row.history?.summary??''}`);
    const activateRow=()=>onContext(row.history??row.place);
    activate(g,activateRow);
    g.attr('aria-label',`${row.label}: ${fullLabel}. ${row.context?'Read historical context':'Read place context'}`);
    g.append('rect').attr('x',0).attr('y',row.y-4).attr('width',width).attr('height',row.height).attr('fill','transparent');
    if(row.span&&x){
      const a=toAxis(row.span.startYear),b=toAxis(row.span.endYear),visible=b>=domain[0]&&a<=domain[1];
      if(visible){
        const start=x(Math.max(domain[0],a)),end=x(Math.min(domain[1],b));
        g.append('rect').attr('x',start).attr('y',row.y+2).attr('width',Math.max(3,end-start)).attr('height',row.selected?12:row.context?7:9).attr('rx',2).attr('fill',row.span.construction?colors.brick:row.context?colors.pale:colors.sage).attr('opacity',row.selected?1:(row.context ? 0.7 : 0.78));
        if(a<domain[0])g.append('text').attr('x',left+1).attr('y',row.y+11).attr('font-size',13).text('‹');
        if(b>domain[1])g.append('text').attr('x',right-8).attr('y',row.y+11).attr('font-size',13).text('›');
        const kind=row.span.construction?'Construction':row.context?'Historical context':row.span.precision==='era'?'Approximate era':'Source period';
        drawWrapped(g,kind,left+4,row.y+30,plotCharacters,10,1);
      }else drawWrapped(g,'Outside focused window',left+4,row.y+12,plotCharacters,10,2);
    }else{
      drawWrapped(g,row.periodLabel,left+4,row.y+12,plotCharacters,10,Infinity);
    }
  }
  return {domain,anchors:anchors.map(p=>p.id),contexts:relevant.map(h=>h.id),hasBoundedDate:!!primary,scale};
}
