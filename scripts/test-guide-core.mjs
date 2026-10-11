import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  escapeHtml,safeHTML,validVisitDate,normalizeRecords,migratePassport,filterPlaces,
  timeRange,formatYear,civilToAxis,axisToCivil,validateBackup,STORAGE_KEY,BACKUP_APP,
} from '../europe/guide-core.js';

const read = name => JSON.parse(fs.readFileSync(new URL(`../europe/${name}`,import.meta.url),'utf8'));
const source = read('places-source.json'), guide = read('journeys-source.json'), enrichment = read('place-enrichment.json');
const places = source.map(place => ({...place,...enrichment[place.id]}));
const oldSites = [...read('data-west.json'),...read('data-north.json')];
const results=[];
function check(name,fn) {try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.message});}}
const ids = rows => rows.map(row => row.id);

check('Complete 354-place / 15-journey source and enrichment references',() => {
  assert.equal(places.length,354);assert.equal(new Set(ids(places)).size,354);
  assert.deepEqual(guide.journeys.map(journey=>journey.leg),Array.from({length:15},(_,i)=>i+1));
  assert.equal(guide.connections.length,112);assert.equal(guide.coverageGaps.length,13);
  assert.equal(Object.keys(enrichment).length,354);
  for (const place of places) assert.ok(guide.journeys.some(journey=>journey.leg===place.leg),place.id);
  for (const journey of guide.journeys) assert.equal(journey.candidateCount,places.filter(place=>place.leg===journey.leg).length);
  for (const connection of guide.connections) for (const leg of [...connection.fromLegs,...connection.toLegs]) assert.ok(leg>=1&&leg<=15);
  for (const place of places) if(place.knownSiteId)assert.ok(oldSites.some(site=>site.id===place.knownSiteId),place.id);
});

check('Public fields exclude private decisions, personal notes and named commentary',() => {
  const text=JSON.stringify({source,guide});assert.ok(!/"(?:decision|personalNotes|Personal notes|Decision)"/.test(text));assert.ok(!/\bJi\b/.test(text));
  assert.ok(source.every(place=>place.sourceUrls.length>0));
});
check('Calendar validation rejects impossible dates and preserves leap days and early years',() => {
  for(const date of ['2026-99-99','2025-02-29','2026-04-31','0000-01-01','2026-1-01',null,42])assert.equal(validVisitDate(date),false,String(date));
  for(const date of ['2024-02-29','2026-10-11','0099-01-01','0001-01-01'])assert.equal(validVisitDate(date),true,date);
});
check('Normalization allows known IDs only and preserves sanitized records',() => {
  const raw={'01-01':{visited:true,planned:false,date:'2025-02-29',rating:5,notes:'<img> field note'},unknown:{planned:true}};
  assert.deepEqual(normalizeRecords(raw,['01-01']),{'01-01':{planned:true,visited:true,date:'',rating:'5',notes:'<img> field note'}});
  assert.deepEqual(normalizeRecords([],['01-01']),{});assert.deepEqual(normalizeRecords(Object.create(raw),['01-01']),{});
  for(const rating of [0,6,true,{},'invalid'])assert.equal(normalizeRecords({'01-01':{rating}},['01-01'])['01-01'].rating,'');
  assert.equal(normalizeRecords({'01-01':{notes:'x'.repeat(7000)}},['01-01'])['01-01'].notes.length,6000);
});
check('Both HTML helpers escape notes safely without changing stored text',() => {
  const note='</textarea><script>alert("x")</script>&\'';
  assert.equal(safeHTML(note),escapeHtml(note));assert.ok(!escapeHtml(note).includes('<script>'));
  assert.ok(escapeHtml(note).includes('&lt;/textarea&gt;'));assert.ok(escapeHtml(note).includes('&quot;'));assert.ok(escapeHtml(note).includes('&#39;'));
});

const legacyTrip=Object.fromEntries(oldSites.map((site,index)=>[site.id,{planned:index%2===0,visited:index%3===0,date:'2024-02-29',rating:String(index%5+1),notes:`Preserve ${site.id}: <arch> & memory`} ]));
check('Migration preserves every one of the 32 previous records, including unmatched landmarks',() => {
  assert.equal(oldSites.length,32);const migrated=migratePassport({version:1,trip:legacyTrip},null,places,oldSites);
  assert.equal(Object.keys(migrated.records).length+Object.keys(migrated.legacyRecords).length,32);
  for(const site of oldSites){const target=places.find(place=>place.knownSiteId===site.id);const actual=target?migrated.records[target.id]:migrated.legacyRecords[site.id];
    assert.deepEqual(actual,normalizeRecords({[site.id]:legacyTrip[site.id]},[site.id])[site.id]);}
});
check('Mapping uses the first matching candidate and newer v2 records take precedence',() => {
  const target=places.find(place=>place.knownSiteId==='parthenon');assert.ok(target);
  const newer={version:2,records:{[target.id]:{planned:true,notes:'newer saved note'}},legacyRecords:{}};
  const migrated=migratePassport({trip:legacyTrip},newer,places,oldSites);
  assert.equal(migrated.records[target.id].notes,'newer saved note');
  const duplicate=[...places,{...target,id:'duplicate'}];assert.ok(migratePassport({trip:{parthenon:legacyTrip.parthenon}},null,duplicate,oldSites).records[target.id]);
  assert.ok(!migratePassport({trip:{parthenon:legacyTrip.parthenon}},null,duplicate,oldSites).records.duplicate);
});
check('A v2 backup retains legacy-only records without silent drops',() => {
  const old=oldSites.find(site=>!places.some(place=>place.knownSiteId===site.id));assert.ok(old);
  const backup={app:BACKUP_APP,version:2,records:{},legacyRecords:{[old.id]:legacyTrip[old.id]}};
  const restored=validateBackup(backup,places,oldSites);assert.deepEqual(restored.legacyRecords[old.id],normalizeRecords(backup.legacyRecords,[old.id])[old.id]);
});
check('Both old and new backup formats normalize into v2 state',() => {
  const old=validateBackup({app:'europe-architecture-passport',version:1,trip:legacyTrip},places,oldSites);
  assert.equal(old.version,2);const next=validateBackup({app:BACKUP_APP,version:2,...old},places,oldSites);assert.deepEqual(next,old);
  assert.equal(STORAGE_KEY,'europe-journey-atlas-v2');
});
check('Invalid, empty and wholly unknown backups are rejected',() => {
  for(const payload of [null,[],{app:'other',version:2,records:{}},{app:BACKUP_APP,version:3,records:{}},
    {app:BACKUP_APP,version:2,records:{}},{app:BACKUP_APP,version:2,records:[]},
    {app:BACKUP_APP,version:2,records:{unknown:{planned:true}}},
    {app:'europe-architecture-passport',version:1,trip:{unknown:{planned:true}}}])assert.throws(()=>validateBackup(payload,places,oldSites));
});
check('Journey scope, all scope and category intersections select actual source records',() => {
  assert.equal(filterPlaces(places,{journey:'journey-01',collection:'journey'}).length,22);
  assert.equal(filterPlaces(places,{leg:9,collection:'journey'}).length,25);
  assert.equal(filterPlaces(places,{journey:1,collection:'all'}).length,354);
  const museums=filterPlaces(places,{journey:{leg:1},category:'Museum'});assert.ok(museums.length>0);assert.ok(museums.every(place=>place.leg===1&&place.category==='Museum'));
});
check('Trip scope spans journeys, honors category, and excludes notes-only records',() => {
  const first=places[0], other=places.find(place=>place.leg===2), notesOnly=places[1];
  const selected={[first.id]:{planned:true},[other.id]:{visited:true},[notesOnly.id]:{notes:'not a selected stop'}};
  assert.deepEqual(ids(filterPlaces(places,{journey:1,collection:'trip'},id=>selected[id])),[first.id,other.id]);
  assert.ok(filterPlaces(places,{collection:'trip',category:first.category},id=>selected[id]).every(place=>place.category===first.category));
});
check('Search trims, ignores case and supports diacritic-free place searches',() => {
  const selected=filterPlaces(places,{collection:'all',query:'  ACROPOLIS  '});assert.ok(selected.length>=2);assert.ok(selected.every(place=>JSON.stringify(place).toLowerCase().includes('acropolis')));
  const cordoba=filterPlaces(places,{collection:'all',query:'cordoba'});assert.ok(cordoba.length>0);
});
check('Verified construction takes priority over contextual source periods',() => {
  const parthenon=places.find(place=>place.knownSiteId==='parthenon'), range=timeRange(parthenon);
  assert.equal(range.kind,'construction');assert.equal(range.startYear,-447);assert.equal(range.endYear,-432);assert.ok(range.sourceUrl);
  const history={startYear:-800,endYear:-323,dateLabel:'A broad period',source:'provided label'};
  assert.deepEqual(timeRange({historicaltime:history}),{...history,kind:'context'});
});
check('Incomplete, zero-year and non-finite source bands stay unknown',() => {
  for(const historicaltime of [{startYear:null,endYear:1800},{startYear:1800,endYear:null},{startYear:0,endYear:1},
    {startYear:1800,endYear:1700},{startYear:-Infinity,endYear:1800},{startYear:1700,endYear:Infinity}])assert.equal(timeRange({historicaltime}),null);
  assert.equal(timeRange(null),null);assert.equal(timeRange({}),null);
});
check('BCE and CE axis roundtrips have no year zero',() => {
  for(const year of [-5000,-447,-2,-1,1,2,2026])assert.equal(axisToCivil(civilToAxis(year)),year);
  assert.equal(civilToAxis(1)-civilToAxis(-1),1);assert.equal(axisToCivil(0),-1);assert.equal(civilToAxis(0),null);
  assert.equal(formatYear(-447),'447 BCE');assert.equal(formatYear(2026),'2,026 CE');assert.equal(formatYear(0),'Date unknown');
});

console.log(JSON.stringify({passed:results.filter(test=>test.pass).length,failed:results.filter(test=>!test.pass).length,results},null,2));
if(results.some(test=>!test.pass))process.exitCode=1;
