// Pure guide and passport logic shared by the page and its verification harness.
export const STORAGE_KEY = 'europe-journey-atlas-v2';
export const BACKUP_APP = 'europe-journey-atlas';
export const BACKUP_VERSION = 2;

const objectRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value,key) => objectRecord(value) && Object.hasOwn(value,key);
const validCivilYear = value => Number.isInteger(value) && value !== 0;

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const safeHTML = escapeHtml;

export function validVisitDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}

function allowedSet(values) {
  if (!values) return new Set();
  return new Set(Array.from(values,value => typeof value === 'string' ? value : value?.id).filter(Boolean));
}

export function normalizeRecords(raw,allowedIds,additionalAllowedIds = []) {
  const clean = {};
  if (!objectRecord(raw)) return clean;
  const allowed = new Set([...allowedSet(allowedIds),...allowedSet(additionalAllowedIds)]);
  for (const id of allowed) {
    if (!own(raw,id) || !objectRecord(raw[id])) continue;
    const source = raw[id], rating = String(source.rating ?? '');
    clean[id] = {
      planned:source.planned === true || source.visited === true,
      visited:source.visited === true,
      date:validVisitDate(source.date) ? source.date : '',
      rating:['1','2','3','4','5'].includes(rating) ? rating : '',
      notes:typeof source.notes === 'string' ? source.notes.slice(0,6000) : '',
    };
  }
  return clean;
}

export function migratePassport(legacyV1,newerV2,places = [],oldSites = []) {
  const placeIds = places.map(place => place.id), oldIds = oldSites.map(site => typeof site === 'string' ? site : site.id);
  const firstMatch = new Map();
  for (const place of places) if (place.knownSiteId && !firstMatch.has(place.knownSiteId)) firstMatch.set(place.knownSiteId,place.id);
  const records = {}, legacyRecords = {};
  const migrateOld = oldRecords => {
    for (const [id,record] of Object.entries(normalizeRecords(oldRecords,oldIds))) {
      const target = firstMatch.get(id);
      if (target) records[target] = record;
      else legacyRecords[id] = record;
    }
  };
  migrateOld(legacyV1?.trip);
  migrateOld(newerV2?.legacyRecords);
  Object.assign(records,normalizeRecords(newerV2?.records,placeIds));
  return {version:BACKUP_VERSION,records,legacyRecords};
}

const searchable = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
function journeyLeg(value) {
  if (objectRecord(value)) value = value.leg;
  const text = String(value ?? '').replace(/^journey-/,'');
  if (!/^\d+$/.test(text)) return null;
  const leg = Number(text);
  return Number.isInteger(leg) && leg >= 1 && leg <= 15 ? leg : null;
}

export function filterPlaces(places,options = {},recordFn = () => ({})) {
  const collection = options.collection ?? 'journey';
  const leg = journeyLeg(options.leg ?? options.journey);
  const category = options.category ?? 'all', query = searchable(options.query);
  return places.filter(place => {
    if (collection === 'journey' && leg !== null && place.leg !== leg) return false;
    if (collection === 'trip') {
      const record = recordFn(place.id) ?? {};
      if (record.planned !== true && record.visited !== true) return false;
    }
    if (category !== 'all' && category !== '' && place.category !== category) return false;
    if (query && !searchable([
      place.name,place.cityArea,place.city,place.country,place.cluster,place.category,
      place.eraPeriod,place.whatToSee,place.whyItMatters,place.connectsTo,place.routeNotes,place.searchText,
    ].join(' ')).includes(query)) return false;
    return true;
  });
}

function completeBand(band) {
  return objectRecord(band) && validCivilYear(band.startYear) && validCivilYear(band.endYear) && band.startYear <= band.endYear;
}

export function timeRange(place) {
  if (!objectRecord(place)) return null;
  const construction = place.verifiedConstruction;
  if (completeBand(construction)) return {...construction,kind:'construction',precision:'verified'};
  const history = place.historicaltime ?? place.historicalTime;
  if (completeBand(history)) return {...history,kind:'context'};
  return null;
}

export function formatYear(year) {
  return validCivilYear(year) ? `${Math.abs(year).toLocaleString('en-US')} ${year < 0 ? 'BCE' : 'CE'}` : 'Date unknown';
}
export function civilToAxis(year) {
  return validCivilYear(year) ? year < 0 ? year + 1 : year : null;
}
export function axisToCivil(axis) {
  if (!Number.isFinite(axis)) return null;
  const year = Math.round(axis);
  return year <= 0 ? year - 1 : year;
}
export const toAxis = civilToAxis;
export const fromAxis = axisToCivil;
export const axisYear = axis => formatYear(axisToCivil(axis));

export function validateBackup(payload,places = [],oldSites = []) {
  if (!objectRecord(payload)) throw new Error('Choose a trip backup downloaded from this atlas.');
  let normalized;
  if (payload.app === BACKUP_APP && payload.version === BACKUP_VERSION && objectRecord(payload.records)) {
    if (payload.legacyRecords !== undefined && !objectRecord(payload.legacyRecords)) throw new Error('The backup has invalid saved landmark records.');
    normalized = migratePassport(null,payload,places,oldSites);
  } else if (payload.app === 'europe-architecture-passport' && payload.version === 1 && objectRecord(payload.trip)) {
    normalized = migratePassport(payload,null,places,oldSites);
  } else {
    throw new Error('Choose a supported atlas trip backup (version 1 or 2).');
  }
  if (!Object.keys(normalized.records).length && !Object.keys(normalized.legacyRecords).length) {
    throw new Error('This backup contains no recognized place records.');
  }
  return normalized;
}
