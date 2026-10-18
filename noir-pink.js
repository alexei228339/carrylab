(()=>{if(document.getElementById('clThemeHeader'))return;const h=document.createElement('div');h.id='clThemeHeader';h.className='cl-welcome';const image=document.createElement('img');image.className='cl-brand';image.src='assets/logo.png';image.alt='Логотип CarryLab';image.onerror=()=>{image.style.display='none'};const s=document.createElement('span');s.textContent='Добро пожаловать, господин. CarryLab поможет спокойно разобрать матч и найти точки роста.';h.append(image,s);document.body.prepend(h);const replacements=[[/\b(?:ты ошибся|твоя ошибка|плохой игрок)\b/gi,'здесь есть возможность улучшить решение'],[/\b(?:ошибки в игре)\b/gi,'точки роста']];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(!node.parentElement||['SCRIPT','STYLE','TEXTAREA','INPUT','CODE'].includes(node.parentElement.tagName))continue;let t=node.textContent;for(const [from,to] of replacements)t=t.replace(from,to);if(t!==node.textContent)node.textContent=t}})();
(()=>{
  if(document.querySelector('.cl-anime-panel'))return;
  const panel=document.createElement('section');
  panel.className='cl-anime-panel';
  panel.setAttribute('aria-label','Аниме оформление CarryLab');
  const head=document.createElement('div');head.className='cl-anime-top';
  const text=document.createElement('div');
  const title=document.createElement('div');title.className='cl-anime-title';title.textContent='♡ CarryLab — Nyaa Edition! ♡';
  const note=document.createElement('div');note.className='cl-anime-note';note.textContent='Господин, герои готовы помочь вам стать сильнее. Без токсичности, только полезный анализ.';
  text.append(title,note);
  const stamp=document.createElement('span');stamp.className='cl-kawaii-stamp';stamp.textContent='✧ にゃ~ ♡';
  head.append(text,stamp);panel.append(head);
  const heroes=document.createElement('div');heroes.className='cl-anime-heroes';
  const roster=[['Anti-Mage','antimage'],['Drow Ranger','drow_ranger'],['Juggernaut','juggernaut'],['Luna','luna'],['Phantom Assassin','phantom_assassin'],['Muerta','muerta']];
  for(const [name,key] of roster){const item=document.createElement('div');item.className='cl-hero';const img=document.createElement('img');img.loading='lazy';img.alt=name;img.referrerPolicy='no-referrer';img.src='https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/'+key+'.png';img.onerror=()=>{img.style.display='none'};const nameEl=document.createElement('span');nameEl.textContent=name;item.append(img,nameEl);heroes.append(item);}
  panel.append(heroes);
  const nav=document.createElement('div');nav.className='cl-anime-nav';
  for(const [name,href] of [['♡ Главная','./'],['✦ Профиль','data-hub.html'],['⚔ Драфт','command-center.html'],['☆ Анализ','deep-analyzer.html'],['♢ Реплеи','replay-download.html']]){const a=document.createElement('a');a.href=href;a.textContent=name;nav.append(a);}
  panel.append(nav);
  const headBar=document.getElementById('clThemeHeader');
  if(headBar) headBar.after(panel);else document.body.prepend(panel);
})();