/* CarryLab v0.3: post-match coach. Uses existing app.js match/player and OpenDota data. */
(() => {
  const root = document.querySelector('.content');
  const section = document.createElement('section');
  section.className = 'tab';
  section.id = 'coach';
  section.innerHTML = `
    <div class="section-title"><div><div class="eyebrow">POST-MATCH COACH · v0.3</div><h2>Разбор решений керри</h2></div><span class="badge" id="coachMode">ДЕМО</span></div>
    <div class="panel"><p class="muted">Анализ использует только поля загруженного матча. Отсутствующие тайминги не выдумываются. Это подсказки на основе правил, а не разбор реплея.</p>
    <div class="controls"><button class="primary" id="coachRefresh">Обновить анализ</button><button class="secondary" id="coachCopy">Скопировать отчёт</button><button class="secondary" id="coachSave">Сохранить отчёт .txt</button></div>
    <p class="note" id="coachStatus" aria-live="polite">Выбери матч и игрока, затем открой раздел.</p></div>
    <div class="kpi-grid" id="coachMetrics"></div>
    <div class="twocol"><div class="panel"><div class="panel-head"><h3>Линия и тайминги</h3></div><div id="coachLane"></div></div><div class="panel"><div class="panel-head"><h3>Смерти и участие</h3></div><div id="coachRisk"></div></div></div>
    <div class="panel" style="margin-top:16px"><div class="panel-head"><h3>Предметы по времени</h3><span class="muted">Из purchase_log, если доступен</span></div><div id="coachItems"></div></div>
    <div class="panel" style="margin-top:16px"><div class="panel-head"><h3>План на следующую игру</h3></div><div id="coachPlan"></div></div>
    <div class="warning">Важно: без последовательности позиций, реплея и контекста командных решений невозможно точно утверждать, куда следовало переместиться или была ли драка ошибкой.</div>
  `;
  const historyTab = document.getElementById('history');
  historyTab.parentNode.insertBefore(section,historyTab);
  const nav = document.querySelector('nav');
  const btn = document.createElement('button');
  btn.dataset.tab = 'coach';
  btn.innerHTML = '◎ <span>AI-тренер*</span>';
  btn.title='Правила на основе статистики, не генеративный AI';
  nav.insertBefore(btn,nav.querySelector('[data-tab="history"]'));
  btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('active',s===section));
    document.getElementById('viewName').textContent='РАЗБОР КЕРРИ';
    renderCoach();
  });
  const fmt = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString('ru-RU',{maximumFractionDigits:1}):'—';
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
  const itemNames={};
  fetch('https://api.opendota.com/api/constants/items').then(r=>r.ok?r.json():null).then(o=>{
    if(o)for(const [key,v] of Object.entries(o))itemNames[key]=v?.dname||key.replaceAll('_',' ');
  }).catch(()=>{});
  function calculate(){
    const p=player||{}, m=match||{}, mins=Math.max(1,(m.duration||60)/60);
    const laneGold=Array.isArray(p.gold_t)?p.gold_t:null;
    const lh10=Array.isArray(p.lh_t)&&p.lh_t.length>10?Number(p.lh_t[10]):null;
    const gold10=laneGold?.length>10?Number(laneGold[10]):null;
    const xp10=Array.isArray(p.xp_t)&&p.xp_t.length>10?Number(p.xp_t[10]):null;
    const deaths=Array.isArray(p.deaths_pos)?p.deaths_pos:null;
    const purchase=Array.isArray(p.purchase_log)?p.purchase_log.filter(x=>Number.isFinite(+x.time)):null;
    const kills=(p.kills??0), assists=(p.assists??0);
    const teamKills=Array.isArray(m.players)?m.players.filter(x=>(x.player_slot<128)===(p.player_slot<128)).reduce((a,x)=>a+(+x.kills||0),0):0;
    const participation=teamKills?100*(kills+assists)/teamKills:null;
    const deathRate=(p.deaths??0)/(mins/10);
    const lhMin=(p.last_hits??0)/mins;
    const priorities=[];
    if(lh10!==null&&lh10<45)priorities.push('Проверь пропущенные добивания в первые 10 минут. Цель на тренировку: улучшить LH@10 относительно собственного среднего.');
    if(p.deaths>=7)priorities.push('Пересмотри каждую смерть: видимость врагов, позиция волны, наличие телепорта и предметов для спасения.');
    if(p.gold_per_min!=null&&p.gold_per_min<500)priorities.push('Проанализируй простои между пачками крипов и лагерями, а также потери фарма после смертей.');
    if(participation!=null&&participation<35)priorities.push('Отметь командные драки: где безопасно было подключиться после фарма ключевого предмета?');
    if(p.tower_damage===0)priorities.push('Проверь возможности нанести урон вышкам после выигранных драк; не каждую вышку можно безопасно бить.');
    if(!priorities.length)priorities.push('Сравни 10-ю и 20-ю минуту с собственными прошлыми матчами на этом герое.');
    return {p,m,mins,lh10,gold10,xp10,deaths,purchase,participation,deathRate,lhMin,priorities};
  }
  function renderCoach(){
    const d=calculate(), p=d.p;
    document.getElementById('coachMode').textContent=mode==='demo'?'ДЕМО':'OPENDOTA / МАТЧ '+d.m.match_id;
    const metrics=[['LH@10',d.lh10],['GOLD@10',d.gold10],['XP@10',d.xp10],['LH/МИН',d.lhMin.toFixed(1)],['УЧАСТИЕ В КИЛЛАХ',d.participation==null?'—':d.participation.toFixed(1)+'%'],['СМЕРТЕЙ / 10 МИН',d.deathRate.toFixed(1)]];
    document.getElementById('coachMetrics').innerHTML=metrics.map(([name,val])=>`<div class="panel kpi"><div class="key">${esc(name)}</div><div class="value">${typeof val==='number'?fmt(val):esc(val??'—')}</div></div>`).join('');
    const lane=[];
    if(d.lh10!==null)lane.push(`LH@10: ${fmt(d.lh10)}. Само по себе число не говорит, что линия сыграна плохо: учитывай matchup и давление.`);
    if(d.gold10!==null)lane.push(`Золото к 10-й минуте: ${fmt(d.gold10)} (поминутные данные из OpenDota).`);
    if(d.xp10!==null)lane.push(`Опыт к 10-й минуте: ${fmt(d.xp10)}.`);
    document.getElementById('coachLane').innerHTML=lane.length?lane.map((v,i)=>`<div class="insight"><div class="number">0${i+1} / ЛИНИЯ</div><p>${esc(v)}</p></div>`).join(''):'<div class="empty">Нет поминутных данных. Для разбора линии понадобится разобранный матч или реплей.</div>';
    const risk=[`Смертей: ${fmt(p.deaths)}. Убийств: ${fmt(p.kills)}. Помощи: ${fmt(p.assists)}.`];
    if(d.participation!==null)risk.push(`Участие в убийствах команды: ${d.participation.toFixed(1)}%. Показатель зависит от роли и стратегии.`);
    if(d.deaths)risk.push(`Доступны агрегированные координаты ${d.deaths.length} событий смертей; этого недостаточно для определения причин.`);
    document.getElementById('coachRisk').innerHTML=risk.map((v,i)=>`<div class="insight"><div class="number">0${i+1} / РИСК</div><p>${esc(v)}</p></div>`).join('');
    const el=document.getElementById('coachItems');
    if(!d.purchase?.length){el.innerHTML='<div class="empty">purchase_log недоступен. Тайминги предметов не рассчитывались.</div>';}
    else {
      const important=d.purchase.filter(x=>+x.time>=0).slice(0,60).map(x=>({time:+x.time,key:x.key||'item'}));
      const grouped=important.map(x=>`<div class="history-row"><b>${esc(itemNames[x.key]||x.key.replaceAll('_',' '))}</b><span>${Math.floor(x.time/60)}:${String(Math.floor(x.time%60)).padStart(2,'0')}</span></div>`);
      el.innerHTML=grouped.join('')||'<div class="empty">Покупки после начала игры отсутствуют.</div>';
    }
    document.getElementById('coachPlan').innerHTML=d.priorities.map((s,i)=>`<div class="insight"><div class="number">ПРИОРИТЕТ ${i+1}</div><p>${esc(s)}</p></div>`).join('');
    document.getElementById('coachStatus').textContent='Результаты показаны для '+(p.hero_name||('героя #'+(p.hero_id||'?')))+'.';
  }
  function report(){
    const d=calculate(), p=d.p;
    return ['CARRYLAB · POST-MATCH REPORT','Матч: '+d.m.match_id,'Герой: '+(p.hero_name||p.hero_id),'Источник: '+(mode==='demo'?'демо':'OpenDota'),'', 'GPM: '+fmt(p.gold_per_min),'XPM: '+fmt(p.xp_per_min),'LH@10: '+fmt(d.lh10),'Gold@10: '+fmt(d.gold10),'XP@10: '+fmt(d.xp10),'LH/мин: '+fmt(d.lhMin),'Смерти: '+fmt(p.deaths),'Участие в убийствах: '+(d.participation?.toFixed(1)||'—')+'%','','План:',...d.priorities.map((v,i)=>(i+1)+'. '+v),'','Без реплея причины решений и точные маршруты не определяются.'].join('\n');
  }
  document.getElementById('coachRefresh').addEventListener('click',renderCoach);
  document.getElementById('coachCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report());document.getElementById('coachStatus').textContent='Отчёт скопирован.';}catch{document.getElementById('coachStatus').textContent='Копирование недоступно — используйте сохранение файла.';}});
  document.getElementById('coachSave').addEventListener('click',()=>{const blob=new Blob([report()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='carrylab-'+String(match?.match_id||'demo')+'-report.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  renderCoach();
})();