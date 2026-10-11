// Human copy is translated; identifiers, sources and personal records stay stable.
export const LANGUAGE_KEY = 'europe-atlas-language';
let language = 'en', content = {}, loading;
const chinese = {
  'Europe in Fifteen Stories · A Journey Atlas':'十五段欧洲故事 · 旅行地图集',
  'Explore Europe through 15 connected stories, 354 places, a living map and a historical timeline. Build your own journeys through art, cities, landscapes and civilizations.':'通过15段相互连接的故事、354个体验、一幅互动地图和一条历史时间轴探索欧洲，在艺术、城市、风景与文明之间规划自己的旅程。',
  'Skip to the journey':'跳转到旅程', 'EUROPE':'欧洲', 'A JOURNEY ATLAS':'旅行地图集',
  'Main navigation':'主导航', 'Display language':'显示语言', '15 stories':'15段故事',
  'Map + time':'地图与时间', 'Connections':'故事之间的联系', 'My trip':'我的旅程',
  'World atlas ↗':'世界文明地图集 ↗', 'The Parthenon in Athens':'雅典的帕特农神庙',
  '15 CONNECTED JOURNEYS · 354 PLACES TO DISCOVER':'15段相连的旅程 · 354个待探索的体验',
  'Europe is a story.':'欧洲，是一段故事。', 'Walk into it.':'走进它。',
  'Read an empire in a street. Follow an idea across a sea. Find the layers of history in the places you choose to visit.':'在一条街道中读懂一个帝国，循着一种思想跨越海洋，在你选择探访的地方发现层层叠叠的历史。',
  'Begin the journey':'开启旅程', 'Art · architecture · archaeology · living culture · landscapes':'艺术 · 建筑 · 考古 · 活态文化 · 风景',
  'regional stories':'地域故事', 'candidate experiences':'候选体验',
  'Choose a journey':'选择旅程', 'Previous journey':'上一段旅程', 'CHOOSE YOUR STORY':'选择你的故事',
  'Choose your journey':'选择你的旅程', 'Next journey':'下一段旅程',
  'A sequence for learning.':'按学习脉络串联。', 'Histories overlap.':'历史彼此交叠。',
  'See all fifteen journeys':'查看全部15段旅程', 'THE QUESTION THAT LEADS THE JOURNEY':'引领这段旅程的问题',
  'Story chapters':'故事章节', 'THE SAME STORY, IN SPACE AND TIME':'同一个故事，在空间与时间中展开',
  'Where it happened.':'故事发生在哪里。', 'When it mattered.':'它属于哪个时代。',
  'Map scale':'地图范围', 'This journey':'这段旅程', 'All Europe':'整个欧洲',
  'Time scale':'时间范围', 'Journey overview':'旅程全貌', 'Selected period':'所选时期',
  'THE GEOGRAPHY':'地理位置', 'Sourced locations for this journey':'这段旅程中有来源依据的位置',
  'Candidate':'候选体验', 'In my trip':'已加入旅程', 'Visited':'已到访',
  'Numbers group nearby references':'数字表示附近合并显示的体验数量',
  'Modern borders for orientation. City and regional reference points are labelled; route lines connect learning stops.':'现代国界帮助定位。城市及区域参考点均有标注；连线串联学习地点。',
  'THE HISTORICAL LAYERS':'历史的层次', "Historical periods and a selected place's time context":'历史时期与所选地点的时间背景',
  'Period from the guide':'指南中的时期', 'Verified building phase':'有依据的建造阶段', 'Historical context':'历史背景',
  'Century and era bands are approximate. Collections can span several periods; landscape and living-culture experiences need their own kinds of time.':'世纪与时代区间是近似范围。藏品可能跨越多个时期；风景及活态文化体验各自有不同的时间尺度。',
  'MAKE THE STORY TANGIBLE':'让故事变得可见、可感', 'Places, objects,':'地点、物件，', 'and experiences.':'还有体验。',
  'Find a place':'寻找地点', 'A city, a painting, a building, an idea…':'一座城市、一幅画、一栋建筑、一种思想……',
  'Experience':'体验类型', 'All experiences':'全部体验', 'Show':'显示范围', 'All 354 candidates':'全部354个候选体验',
  'My trip across Europe':'我的欧洲旅程', 'Clear filters':'清除筛选', 'A different story is waiting.':'另一个故事正在等待。',
  'Clear the filters or add places to your trip.':'清除筛选，或将地点加入你的旅程。',
  'Explore this journey':'探索这段旅程', 'Selected place':'所选地点', 'Opening the atlas…':'正在打开地图集……',
  'TURN A CHAPTER INTO A TRIP':'把一个章节变成一次旅行', 'Choose a backbone.':'选择一条主线。',
  'Leave room to live.':'留些时间感受生活。', 'The inventory is a pool of choices.':'清单提供选择，无须逐一打卡。',
  'THE GEOGRAPHIC BACKBONE':'地理主线', 'SHAPING ROUGHLY TEN DAYS':'规划约十天的旅程',
  'Interpretation and practical notes':'解读与实用提示',
  'Availability notes follow the guide’s 11 October 2026 edition. Recheck them for your eventual travel dates.':'开放及可用情况依据指南的2026年10月11日版本。请按实际出行日期再次确认。',
  'THE STORY CONTINUES ELSEWHERE':'故事在别处继续', 'Follow a thread':'循着一条线索，', 'across Europe.':'走过欧洲。',
  'Choose a theme':'选择主题', 'All connections for this journey':'这段旅程的全部联系',
  'YOUR PERSONAL JOURNEY':'属于你的旅程', 'Keep the places.':'收藏这些地点。', 'Collect the stories.':'收集它们的故事。',
  'Download my trip ↓':'下载我的旅程 ↓', 'Restore a trip ↑':'恢复旅程备份 ↑', 'places in your trip':'已加入旅程的地点',
  'places visited':'已到访的地点', 'journeys with a visit':'已有到访记录的旅程', 'experience types explored':'已探索的体验类型',
  'Your decisions, notes and ratings stay on this device. Download and restore a copy to move them between devices.':'你的选择、笔记和评分保存在这台设备上。下载并恢复备份即可在设备之间转移。',
  'A WIDER EUROPE':'更广阔的欧洲', 'The edges of this atlas':'地图集之外的延伸', '13 themes and regional extensions +':'13个主题与区域延伸 +',
  'Keep the guide’s open questions visible while choosing substitutions and future journeys.':'选择替代地点或未来旅程时，也保留指南中尚待探索的问题。',
  'Europe in fifteen stories.':'十五段欧洲故事。',
  'Adapted from your Europe Civilizations Atlas and its complete place inventory. Source IDs and links are preserved. The learning sequence connects overlapping histories; it is not a claim that regions belong to separate eras.':'根据你的《欧洲文明地图集》及完整地点清单改编，保留原始编号与来源链接。学习脉络串联彼此交叠的历史，并不意味着各地区只属于某一个时代。',
  'Photography credits and licenses':'摄影署名与授权', 'Return to the world atlas ↗':'返回世界文明地图集 ↗',
  'Enable JavaScript to explore the stories, maps, timeline and personal trip record.':'请启用JavaScript以探索故事、地图、时间轴和个人旅程记录。',
  'Mediterranean foundations':'地中海的根基', 'Cities, empires & continuity':'城市、帝国与延续',
  'Competing medieval worlds':'并存与竞争的中世纪世界', 'Faith, kingdoms & towns':'信仰、王国与城镇',
  'Renaissance & oceanic networks':'文艺复兴与海洋网络', 'Art, belief & global power':'艺术、信仰与全球权力',
  'Dynasties & mountain worlds':'王朝与山地世界', 'Cities, borders & landscapes':'城市、边界与风景',
  'Industry & the modern world':'工业与现代世界', 'Change, conflict & renewal':'变革、冲突与新生',
  'ACT {n}':'第{n}幕', 'SCENE {n}':'第{n}场', 'JOURNEY {n}':'旅程{n}',
  '{n} candidate experiences':'{n}个候选体验', 'Overlapping historical layers':'彼此交叠的历史层次',
  '{n} experiences in {journey}':'{journey}的{n}个体验', '{n} experience in {journey}':'{journey}的{n}个体验',
  '{n} experiences in your trip':'旅程中的{n}个体验', '{n} experience in your trip':'旅程中的{n}个体验',
  '{n} experiences across all fifteen journeys':'全部15段旅程中的{n}个体验', '{n} experience across all fifteen journeys':'全部15段旅程中的{n}个体验',
  'VISITED ✓':'已到访 ✓', 'IN MY TRIP':'已加入旅程', 'Explore its story ↗':'探索它的故事 ↗',
  'Explore {name}':'探索{name}', 'Add {name} to my trip':'将{name}加入我的旅程', 'Remove {name} from my trip':'从我的旅程移除{name}',
  '✓ Visited':'✓ 已到访', '✓ In my trip':'✓ 已加入旅程', '+ Keep':'+ 收藏',
  '← Previous':'← 上一页', 'Next →':'下一页 →', '{n} candidates':'{n}个候选体验',
  'This place is already recorded as visited.':'这个地点已有到访记录。', 'Your next discovery awaits.':'你的下一次发现就在前方。',
  'Choose another experience, or clear the filters to return to this story.':'选择另一个体验，或清除筛选以回到这个故事。',
  'WHERE IT BELONGS':'它位于哪里', 'WHAT YOU WILL SEE OR DO':'你将看到或体验什么', 'WHY IT MATTERS TO THE STORY':'它为何对故事重要',
  'Time detail: {name} · {dates}':'时间细节：{name} · {dates}',
  'These dates identify the featured building within this candidate’s wider historical context.':'这些日期标示该体验中重点建筑的阶段；整个体验的历史背景更为广泛。',
  'Geography, route choices & guide notes':'地理、路线选择与指南提示',
  'Original inventory {id} · workbook row {row}; guide chapter pages {start}–{end}.':'原清单编号{id} · 工作表第{row}行；指南章节第{start}–{end}页。',
  'FOLLOW THIS IDEA ELSEWHERE':'在别处追寻这个主题', 'Journey':'旅程', 'Open location reference ↗':'打开位置参考 ↗',
  'All {n} source links':'全部{n}个来源链接', '✓ In my passport':'✓ 已加入旅行护照', '+ Keep for my trip':'+ 加入我的旅程',
  'Mark visited':'标记已到访', 'My visit, impression & field notes':'我的到访、印象与观察笔记',
  'Visit date':'到访日期', 'My impression':'我的印象', 'No rating':'暂未评分', 'My field notes':'我的观察笔记',
  'What did you notice? What will you compare at the next stop?':'你注意到了什么？下一站想比较什么？',
  'Fifteen connected regional stories':'15段相连的地域故事', '{n} places · {region}':'{n}个地点 · {region}',
  'Inspect the selected historical layer':'查看所选历史层次', 'These histories overlap':'这些历史彼此交叠',
  'Journey context. Clear the filters or select a map reference to choose an experience.':'旅程的地理背景。清除筛选或选择地图参考点以查看体验。',
  'Featured building: {name} · {dates}':'重点建筑：{name} · {dates}', 'No matching experience':'没有匹配的体验',
  'Clear the filters to locate a place in history.':'清除筛选，找到地点在历史中的位置。',
  'More than one time layer:':'不止一个时间层次：',
  '{n} places in this chapter have mixed, open-ended or landscape contexts. Their original period labels remain visible in every place card.':'本章有{n}个地点跨越多个时期、时间范围开放，或属于风景体验。各地点卡片保留指南原有的时期说明。',
  'WHAT TO COMPARE':'可以比较什么', 'CONTINUE THE STORY / {n}':'继续故事 / {n}',
  'All {n} connections involving {journey}':'与{journey}有关的全部{n}条联系', 'Places to consider:':'可考虑的地点：',
  '{n} places still to discover in your selected trip.':'你选定的旅程中，还有{n}个地点等待探索。',
  'Keep a few places from any chapter to begin your own journey.':'从任一章节收藏几个地点，开启自己的旅程。',
  '{done} visited / {kept} kept · {n} candidates':'已到访{done} / 已收藏{kept} · {n}个候选体验',
  'Your earlier passport records':'你之前的旅行护照记录',
  'These {n} landmarks sit outside the expanded guide’s candidate list. Their visit status and field notes are retained in your backup.':'这{n}处地标不在扩展指南的候选清单中。它们的到访状态和观察笔记仍保留在你的备份内。',
  'visited':'已到访', 'kept':'已收藏', 'Landmark photograph':'地标照片', 'Public domain':'公有领域',
  'Your browser cannot save this trip. Download a copy to keep it.':'浏览器无法保存这份旅程。请下载备份以保留记录。',
  'Your trip backup has been downloaded.':'旅程备份已下载。', 'Choose a trip backup smaller than 16 MB.':'请选择小于16 MB的旅程备份。',
  'Your trip records and earlier passport visits are restored.':'旅程记录及之前的旅行护照到访记录已恢复。',
  'This file could not be restored.':'无法恢复这个文件。', 'The guide could not load.':'无法加载指南。',
  'Please refresh the page when your connection is ready.':'网络连接恢复后，请刷新页面。',
  'The atlas could not load. Please refresh to try again.':'无法加载地图集。请刷新重试。',
  'Chinese copy could not load. Please try again when your connection is ready.':'无法加载中文内容。请在网络连接恢复后重试。',
  'Choose a trip backup downloaded from this atlas.':'请选择从本地图集下载的旅程备份。',
  'The backup has invalid saved landmark records.':'备份中的地标记录格式无效。',
  'Choose a supported atlas trip backup (version 1 or 2).':'请选择支持的地图集旅程备份（版本1或2）。',
  'This backup contains no recognized place records.':'这份备份中没有可识别的地点记录。',
  'site reference':'地点参考', 'city reference':'城市参考', 'region reference':'区域参考',
  'Europe map of historical place references':'欧洲历史地点参考地图', 'Journey map of historical place references':'本旅程的历史地点参考地图',
  'Places in geographic context':'地理背景中的地点',
  'Modern country outlines are reference geography. City and region points are approximate references, not exact museum or entrance locations. Numbered markers group nearby candidates.':'现代国界仅供地理定位。城市及区域点为近似参考，并非博物馆或入口的精确位置。数字标记合并显示附近的候选体验。',
  'Conceptual connections between reference cities; not a transport route.':'城市参考点之间的学习联系，并非交通路线。',
  '{n} nearby candidates':'附近的{n}个候选体验', 'No mapped references in this selection.':'当前选择没有地图参考点。',
  'Date range not established':'时间范围尚未确定', 'Selected place, representative candidates and historical contexts in time':'所选地点、代表性候选体验与历史背景的时间位置',
  'Historical time around {name}':'{name}的历史时间背景',
  'Brick bands show verified construction phases. Sage bands show broad source periods; pale bands show political or cultural context. Mixed collections and geological landscapes are not assigned invented points. There is no year zero.':'砖红色区间表示有依据的建造阶段。绿色区间表示来源中的宽泛时期；浅色区间表示政治或文化背景。跨时期藏品与地质风景不会被虚构为单一时间点。时间轴没有公元零年。',
  'Multiple periods':'多个时期', 'Read historical context':'阅读历史背景', 'Read place context':'阅读地点背景',
  'Construction':'建造阶段', 'Approximate era':'大致时代', 'Source period':'来源中的时期', 'Outside focused window':'位于当前时间范围之外',
  'Date unknown':'日期不详', 'Historical layers':'历史层次',
  'Guide chapter: pages {start}–{end}.':'指南章节：第{start}–{end}页。',
  '{n} experiences · {region}':'{n}个体验 · {region}', 'Place':'地点',
  'United States of America':'美国', 'United States':'美国', 'United Kingdom':'英国',
  'Czech Republic':'捷克', 'Czechia':'捷克', 'Russia':'俄罗斯', 'Russian Federation':'俄罗斯',
  'Belarus':'白俄罗斯', 'Ukraine':'乌克兰', 'Moldova':'摩尔多瓦', 'Romania':'罗马尼亚',
  'Bulgaria':'保加利亚', 'Serbia':'塞尔维亚', 'Montenegro':'黑山', 'Kosovo':'科索沃',
  'Macedonia':'北马其顿', 'North Macedonia':'北马其顿', 'Albania':'阿尔巴尼亚',
  'Estonia':'爱沙尼亚', 'Latvia':'拉脱维亚', 'Lithuania':'立陶宛', 'Finland':'芬兰', 'Slovakia':'斯洛伐克',
  'Iceland':'冰岛', 'Greenland':'格陵兰', 'Ireland':'爱尔兰', 'Luxembourg':'卢森堡',
  'Greece':'希腊', 'Turkey':'土耳其', 'Türkiye':'土耳其', 'Italy':'意大利',
  'France':'法国', 'Spain':'西班牙', 'Portugal':'葡萄牙', 'Germany':'德国',
  'Denmark':'丹麦', 'Sweden':'瑞典', 'Norway':'挪威', 'Switzerland':'瑞士',
  'Austria':'奥地利', 'Hungary':'匈牙利', 'Poland':'波兰', 'Belgium':'比利时',
  'Netherlands':'荷兰', 'Slovenia':'斯洛文尼亚', 'Croatia':'克罗地亚',
  'Bosnia and Herzegovina':'波斯尼亚和黑塞哥维那', 'Bosnia and Herz.':'波斯尼亚和黑塞哥维那',
  'Cyprus':'塞浦路斯', 'N. Cyprus':'北塞浦路斯', 'Malta':'马耳他', 'Andorra':'安道尔',
  'Liechtenstein':'列支敦士登', 'Monaco':'摩纳哥', 'San Marino':'圣马力诺', 'Vatican City':'梵蒂冈',
  'Georgia':'格鲁吉亚', 'Armenia':'亚美尼亚', 'Azerbaijan':'阿塞拜疆',
  'Canada':'加拿大', 'Morocco':'摩洛哥', 'Algeria':'阿尔及利亚', 'Tunisia':'突尼斯',
  'Libya':'利比亚', 'Egypt':'埃及', 'Israel':'以色列', 'Palestine':'巴勒斯坦',
  'Jordan':'约旦', 'Lebanon':'黎巴嫩', 'Syria':'叙利亚', 'Iraq':'伊拉克', 'Iran':'伊朗',
  'Saudi Arabia':'沙特阿拉伯', 'W. Sahara':'西撒哈拉'
};

export const getLanguage = () => language;
export function preferredLanguage(search = '', storage) {
  const requested = new URLSearchParams(search).get('lang');
  if (requested === 'en' || requested === 'zh') return requested;
  try { return storage?.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en'; } catch { return 'en'; }
}
export function installTranslations(catalogs) { content = Object.assign({}, ...catalogs); }
export async function loadChinese(fetcher = fetch) {
  if (!loading) loading = Promise.all([1,2,3].map(async n => {
    const response = await fetcher(`locales/zh-content-${n}.json`);
    if (!response.ok) throw new Error('Chinese copy could not load. Please try again when your connection is ready.');
    return response.json();
  })).then(installTranslations).catch(error => { loading = null; throw error; });
  return loading;
}
export function useLanguage(value) { language = value === 'zh' ? 'zh' : 'en'; }
export function translate(value) {
  if (language !== 'zh' || typeof value !== 'string') return value;
  return chinese[value] ?? content[value] ?? value;
}
export function chineseText(value) { return chinese[value] ?? content[value] ?? value; }
export function message(key, values = {}) {
  return String(translate(key)).replace(/\{(\w+)\}/g, (_, name) => String(translate(values[name] ?? `{${name}}`)));
}
export function localizedYear(year) {
  if (!Number.isInteger(year) || year === 0) return translate('Date unknown');
  const n = Math.abs(year).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
  return language === 'zh' ? `${year < 0 ? '公元前' : '公元'}${n}年` : `${n} ${year < 0 ? 'BCE' : 'CE'}`;
}

// Snapshot only the original shell. Newly rendered content is translated by the app.
export function captureStaticCopy(doc) {
  const copy = {texts:[],attributes:[],title:doc.title,description:doc.querySelector?.('meta[name="description"]')};
  copy.originalDescription = copy.description?.getAttribute('content');
  if (!doc.createTreeWalker || !doc.body) return copy;
  const walker = doc.createTreeWalker(doc.body,4);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue.trim() && !node.parentElement?.closest('script,style,textarea,[data-language]')) copy.texts.push([node,node.nodeValue]);
  }
  doc.body.querySelectorAll('[aria-label],[placeholder],[alt]').forEach(node => {
    for (const attr of ['aria-label','placeholder','alt']) if (node.hasAttribute(attr) && node.id !== 'hero-photo') copy.attributes.push([node,attr,node.getAttribute(attr)]);
  });
  return copy;
}
export function translateElement(element) {
  const doc = element?.ownerDocument;
  if (language !== 'zh' || !doc?.createTreeWalker) return;
  const walker = doc.createTreeWalker(element,4);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue.trim() || node.parentElement?.closest('script,style,textarea,[data-user-content],[data-language]')) continue;
    const original = node.nodeValue;
    node.nodeValue = original.replace(original.trim(),translate(original.trim()));
  }
  element.querySelectorAll('[aria-label],[placeholder],[alt]').forEach(node => {
    for (const attr of ['aria-label','placeholder','alt']) if (node.hasAttribute(attr)) node.setAttribute(attr,translate(node.getAttribute(attr)));
  });
}
export function applyStaticCopy(doc, copy) {
  doc.documentElement?.setAttribute('lang',language === 'zh' ? 'zh-Hans' : 'en');
  if (copy.title) doc.title = translate(copy.title);
  if (copy.originalDescription) copy.description.setAttribute('content',translate(copy.originalDescription));
  for (const [node,original] of copy.texts) if (node.isConnected) node.nodeValue = original.replace(original.trim(),translate(original.trim()));
  for (const [node,attr,original] of copy.attributes) if (node.isConnected) node.setAttribute(attr,translate(original));
}
