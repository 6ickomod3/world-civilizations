import fs from 'node:fs';
import assert from 'node:assert/strict';
import {installTranslations,translate,chineseText,useLanguage,message,localizedYear,preferredLanguage,LANGUAGE_KEY} from '../europe/i18n.js';
const root=new URL('../europe/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
const catalogs=[1,2,3].map(n=>read(`locales/zh-content-${n}.json`));
const all=Object.assign({},...catalogs);
assert.equal(Object.keys(all).length,catalogs.reduce((n,c)=>n+Object.keys(c).length,0),'Translation shards must not redefine one another');
const excluded=new Set(['id','knownSiteId','photoId','existingPhotoId','placeId','placeIds','countryCodes','sourceUrl','sourceUrls','sourceUrlsText','sourcePdf','src','file','credit','license','licenseUrl','precision','source','sourceFile','connectedLegsText','fromLegsText','toLegsText']);
const required=new Set();
function collect(value,key=''){
  if(excluded.has(key)||key==='metadata')return;
  if(typeof value==='string'&&/[A-Za-z]/.test(value)&&!/^https?:/.test(value))required.add(value);
  else if(Array.isArray(value))value.forEach(v=>collect(v,key));
  else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>collect(v,k));
}
for(const file of ['places-source.json','place-enrichment.json','journeys-source.json','journey-stories.json','timeline-data.json','journey-photos.json'])collect(read(file));
for(const file of ['data-west.json','data-north.json'])read(file).forEach(p=>required.add(p.name));
for(const source of required){
  assert.ok(Object.hasOwn(all,source),`Missing Chinese content: ${source}`);
  assert.ok(typeof all[source]==='string'&&/[\u3400-\u9fff]/u.test(all[source]),`Incomplete Chinese content: ${source}`);
}
installTranslations(catalogs);useLanguage('zh');
assert.equal(localizedYear(-447),'公元前447年');assert.equal(localizedYear(532),'公元532年');assert.equal(localizedYear(0),'日期不详');
assert.equal(message('All {n} source links',{n:4}),'全部4个来源链接');
assert.match(translate('Mainland Greece'),/[\u3400-\u9fff]/);
assert.equal(translate('01-01'),'01-01');assert.equal(translate('https://example.org'),'https://example.org');
const storage={getItem:key=>key===LANGUAGE_KEY?'zh':null};
assert.equal(preferredLanguage('',storage),'zh');assert.equal(preferredLanguage('?lang=en',storage),'en');
assert.equal(preferredLanguage('?lang=zh'),'zh');assert.equal(preferredLanguage('?lang=unsupported'),'en');
assert.equal(preferredLanguage('',{getItem(){throw Error('unavailable')}}),'en');
useLanguage('en');assert.equal(translate('Mainland Greece'),'Mainland Greece');assert.equal(localizedYear(-447),'447 BCE');
assert.match(chineseText('Mainland Greece'),/[\u3400-\u9fff]/);
console.log(`Verified complete Chinese content for ${required.size} source strings, both language modes, canonical IDs and BCE/CE labels.`);
