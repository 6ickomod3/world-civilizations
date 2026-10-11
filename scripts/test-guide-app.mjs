import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as core from '../europe/guide-core.js';

// Run the actual app's startup and event handlers. Only DOM, storage, timers and
// SVG renderers are replaced, so these checks exercise integration state rather
// than duplicate its implementation. Browser layout is checked separately.
const directory = new URL('../europe/',import.meta.url);
const fixtureNames = ['journeys-source.json','places-source.json','journey-stories.json',
  'place-enrichment.json','photos.json','journey-photos.json','timeline-data.json',
  'data-west.json','data-north.json'];
const fixtures = Object.fromEntries(fixtureNames.map(name => [name,
  JSON.parse(fs.readFileSync(new URL(name,directory),'utf8'))]));
const appSource = fs.readFileSync(new URL('app.js',directory),'utf8')
  .replace(/^import .*;\n/gm,'')
  .replace(/^start\(\)\.catch[^\n]*$/m,'');

function harness(initialStorage = {}) {
  const nodes = new Map(),storage = {...initialStorage},timers = new Map();
  let nextTimer = 0,lastMap = null,lastTimeline = null,timelineDraws = 0;
  function element(id) {
    if (!nodes.has(id)) {
      let html = '';
      nodes.set(id,{
        id,textContent:'',hidden:false,value:'',disabled:false,listeners:new Map(),writes:0,clears:0,attributes:new Map(),
        get innerHTML(){return html},set innerHTML(value){html=value;this.writes++},
        classList:{add(){},remove(){},toggle(){}},
        addEventListener(event,handler){this.listeners.set(event,handler)},
        querySelectorAll(){return []},
        insertAdjacentHTML(_,value){this.innerHTML+=value},
        scrollIntoView(){},
        replaceChildren(){this.innerHTML='';this.clears++},
        removeAttribute(name){this.attributes.delete(name)},
        setAttribute(name,value){this.attributes.set(name,String(value))},
      });
    }
    return nodes.get(id);
  }
  const location = {href:'https://example.test/europe/',search:''};
  const context = vm.createContext({
    ...core,esc:core.escapeHtml,console,URL,URLSearchParams,Blob,
    document:{getElementById:element,createElement(){return {click(){}}}},location,
    history:{replaceState(_state,_title,url){location.href=String(url);location.search=new URL(url).search}},
    matchMedia:()=>({matches:false}),
    setTimeout(callback){const id=++nextTimer;timers.set(id,callback);return id},
    clearTimeout(id){timers.delete(id)},
    window:{addEventListener(){}},
    localStorage:{getItem:key=>storage[key]??null,setItem:(key,value)=>{storage[key]=value}},
    fetch:async name=>({ok:Object.hasOwn(fixtures,name),json:async()=>fixtures[name]}),
    drawMap(options){lastMap=options;options.element.innerHTML=`map:${options.selected?.id??'context'}`},
    drawTimeline(options){lastTimeline=options;timelineDraws++;options.element.innerHTML=`timeline:${options.selected?.id??'none'}`},
  });
  vm.runInContext(appSource+`\nglobalThis.testApi={start,selectPlace,savePassport,visiblePlaces,
    state(){return state},passport(){return passport}};`,context,{filename:'europe/app.js'});
  function event(id,type,value) {
    const target = element(id);
    if (value !== undefined) target.value=value;
    const handler=target.listeners.get(type);
    assert.ok(handler,`Expected actual ${type} handler on #${id}`);
    handler({target});
  }
  function flushTimers() {
    while (timers.size) {
      const pending=[...timers.values()];timers.clear();pending.forEach(callback=>callback());
    }
  }
  return {api:context.testApi,element,event,flushTimers,storage,
    map:()=>lastMap,timeline:()=>lastTimeline,timelineDraws:()=>timelineDraws};
}

const results=[];
async function check(name,run) {
  try {await run();results.push({name,pass:true});}
  catch(error){results.push({name,pass:false,error:error.message});}
}

await check('Corrupt obsolete v1 storage cannot suppress or overwrite a valid v2 passport',async()=>{
  const saved={version:2,records:{'01-01':{planned:true,visited:true,date:'2024-02-29',rating:'4',notes:'Retain my saved v2 field notes'}},legacyRecords:{}};
  const app=harness({'europe-architecture-passport-v1':'{corrupt obsolete JSON',[core.STORAGE_KEY]:JSON.stringify(saved)});
  await app.api.start();
  assert.equal(app.api.passport().records['01-01'].notes,saved.records['01-01'].notes);
  assert.equal(app.api.passport().records['01-01'].visited,true);
  assert.equal(app.api.passport().records['01-01'].date,'2024-02-29');
  assert.equal(app.api.savePassport(),true);
  const persisted=JSON.parse(app.storage[core.STORAGE_KEY]);
  assert.equal(persisted.records['01-01'].notes,saved.records['01-01'].notes);
  assert.equal(persisted.records['01-01'].rating,'4');
});

await check('Typing a notes-only record immediately enables backup without rebuilding the detail editor',async()=>{
  const app=harness();await app.api.start();app.api.selectPlace('01-01');
  assert.equal(app.element('download-trip').disabled,true);
  const before=app.element('place-detail').writes;
  app.event('visit-notes','input','A field note to preserve even before keeping this place.');
  assert.equal(app.element('download-trip').disabled,false);
  assert.equal(app.element('place-detail').writes,before);
  assert.equal(app.api.passport().records['01-01'].planned,false);
  assert.equal(JSON.parse(app.storage[core.STORAGE_KEY]).records['01-01'].notes,'A field note to preserve even before keeping this place.');
});

await check('Searching across all 354 candidates reconciles the journey, selected card, map and timeline',async()=>{
  const app=harness();await app.api.start();
  app.event('collection-filter','change','all');assert.equal(app.api.visiblePlaces().length,354);
  app.event('place-search','input','  BUDAPEST  ');app.flushTimers();
  const visible=app.api.visiblePlaces(),state=app.api.state();
  assert.ok(visible.length>0);assert.equal(state.leg,11);assert.equal(state.collection,'all');
  assert.ok(visible.some(place=>place.id===state.selectedId));
  assert.equal(app.element('journey-select').value,'11');
  assert.equal(app.map().selected.id,state.selectedId);assert.equal(app.timeline().selected.id,state.selectedId);
  assert.ok(app.element('place-detail').innerHTML.includes(state.selectedId));
});

await check('An empty filter clears the selected map reference and timeline instead of showing a stale experience',async()=>{
  const app=harness();await app.api.start();
  const previous=app.api.state().selectedId,draws=app.timelineDraws();
  assert.ok(app.element('journey-timeline').innerHTML.includes(previous));
  app.event('place-search','input','zzzz-no-source-candidate-matches-this');app.flushTimers();
  assert.equal(app.api.visiblePlaces().length,0);assert.equal(app.element('empty-places').hidden,false);
  assert.equal(app.map().selected,null);assert.equal(app.element('journey-timeline').innerHTML,'');
  assert.ok(app.element('journey-timeline').clears>0);assert.equal(app.timelineDraws(),draws);
  assert.equal(app.element('journey-timeline').attributes.get('height'),'1');
  assert.match(app.element('selected-time-label').innerHTML,/No matching experience/);
  assert.ok(!app.element('map-selection').innerHTML.includes(previous));
  assert.equal(app.element('history-context-detail').hidden,true);
});

console.log(JSON.stringify({passed:results.filter(test=>test.pass).length,failed:results.filter(test=>!test.pass).length,results},null,2));
if(results.some(test=>!test.pass))process.exitCode=1;
