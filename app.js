(() => {
  const AS = name => `assets/${name}`;
  const game = document.querySelector('#game');
  const image = document.querySelector('#scene-image');
  const shade = document.querySelector('#scene-shade');
  const interaction = document.querySelector('#interaction-layer');
  const hud = document.querySelector('#hud-layer');
  const menuHit = document.querySelector('#menu-hit');
  const toast = document.querySelector('#toast');
  const glitch = document.querySelector('#glitch');
  const scanline = document.querySelector('#scanline');
  const drawer = document.querySelector('#drawer');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');
  const logItems = document.querySelector('#log-items');
  const soundToggle = document.querySelector('#sound-toggle');

  const sceneAssets = {
    1: AS('screen01.png'),
    2: AS('screen02.png'),
    3: AS('screen03.png'),
    4: AS('screen04.png'),
    5: AS('screen05.png'),
    6: AS('screen06.png'),
    7: AS('screen07.png'),
    9: AS('screen09.png'),
    10: AS('screen10.png'),
    11: AS('screen11.png'),
    deer: AS('screen_deer.png'),
    lake: AS('screen_lake.png')
  };

  const sceneAlt = {
    1:'ORBIT SIGNAL 신호 수신 화면',
    2:'미확인 신호 좌표 복구 화면',
    3:'좌표 확인 및 추적 버튼 화면',
    4:'온기의 별 겨울 호수 탐사 화면',
    5:'불꽃 온도 오류 조사 화면',
    6:'호수 아래 온기 오류 신호 화면',
    7:'SIGNAL TRACE 미니게임 화면',
    9:'SIGNAL TRACE 100% 좌표 고정 화면',
    10:'푸른 보석과 예준 신호 위치 확인 화면',
    11:'공동 탐사 화면',
    deer:'예준 생명체 조사 전용 화면',
    lake:'예준 호수 조사 전용 화면'
  };

  const state = {
    scene: 1,
    explored: { fire:false, deer:false, lake:false },
    log: [],
    traceIndex: 0,
    restorationAttempted: false,
    community: 87,
    sound: true,
    timers: []
  };

  const traceNodes = [
    {id:'1.4', x:50.1, y:43.2, label:'1.4°C'},
    {id:'1.9', x:53.1, y:50.1, label:'1.9°C'},
    {id:'2.3', x:39.1, y:57.0, label:'2.3°C'},
    {id:'2.8', x:54.5, y:64.4, label:'2.8°C'},
    {id:'3.6', x:55.0, y:71.1, label:'3.6°C'},
  ];
  const decoys = [
    {x:33.2,y:32.2,label:'0.8°C'}, {x:79.1,y:34.2,label:'0.8°C'}, {x:19.0,y:44.4,label:'0.0°C'},
    {x:79.3,y:47.8,label:'0.8°C'}, {x:35.9,y:54.4,label:'0.8°C'}, {x:65.6,y:59.4,label:'0.0°C'},
    {x:22.7,y:66.0,label:'0.0°C'}, {x:46.6,y:73.6,label:'0.8°C'}
  ];

  let explorationIntroSeen = false;

  function later(fn, ms) { const id=setTimeout(fn,ms); state.timers.push(id); return id; }
  function clearTimers(){ state.timers.forEach(clearTimeout); state.timers=[]; }
  function clearLayers(){ interaction.innerHTML=''; hud.innerHTML=''; shade.className='scene-shade'; scanline.classList.remove('active'); }
  function toastMsg(msg, kind='') { toast.textContent=msg; toast.className=`toast show ${kind}`; later(()=>toast.className='toast', 1450); }
  function glitchFx(){ glitch.classList.remove('fire'); void glitch.offsetWidth; glitch.classList.add('fire'); }
  function beep(freq=660,dur=.06,vol=.035){
    if(!state.sound) return;
    try{
      const ctx=beep.ctx||(beep.ctx=new (window.AudioContext||window.webkitAudioContext)());
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur); o.stop(ctx.currentTime+dur);
    }catch(e){}
  }
  function log(key,value,bad=true){ if(!state.log.some(x=>x.key===key)) state.log.push({key,value,bad}); renderLog(); }
  function renderLog(){
    const base=[...state.log];
    if(state.traceIndex>=5 && !base.some(x=>x.key==='SIGNAL TRACE')) base.push({key:'SIGNAL TRACE',value:'100% / COORDINATE LOCKED',bad:false});
    if(state.restorationAttempted && !base.some(x=>x.key==='RESTORATION')) base.push({key:'RESTORATION',value:'FAILED',bad:true});
    logItems.innerHTML=base.length?base.map(x=>`<div class="log-item"><span>${x.key}</span><strong class="${x.bad?'bad':''}">${x.value}</strong></div>`).join(''):`<div class="log-item"><span>탐사 기록</span><strong>아직 없음</strong></div>`;
  }

  function setScene(scene, {fade=true}={}) {
    clearTimers();
    clearLayers();
    state.scene=scene;
    menuHit.classList.toggle('active', ![1,2,3].includes(scene));
    image.style.opacity='1';
    const src = sceneAssets[scene];
    if (fade) image.classList.add('fade');
    const pre = new Image();
    pre.onload=()=>{
      image.src=src; image.alt=sceneAlt[scene]||'게임 장면';
      requestAnimationFrame(()=>image.classList.remove('fade'));
    };
    pre.src=src;
    render();
  }

  function render(){
    switch(state.scene){
      case 1: return renderIntro1();
      case 2: return renderIntro2();
      case 3: return renderIntro3();
      case 4: return renderExplore();
      case 5: return renderFire();
      case 'deer': return renderDedicatedInspect('deer');
      case 'lake': return renderDedicatedInspect('lake');
      case 6: return renderSignalDiscovery();
      case 7: return renderTrace();
      case 9: return renderTraceComplete();
      case 10: return renderLocated();
      case 11: return renderCommunity();
    }
    renderLog();
  }

  function renderIntro1(){
    scanline.classList.add('active');
    later(()=>{glitchFx(); beep(360,.12,.025);}, 900);
    later(()=>setScene(2), 2500);
  }
  function renderIntro2(){
    scanline.classList.add('active');
    const chip=document.createElement('div'); chip.className='hint-pill'; chip.style.bottom='15%'; chip.textContent='SCAN 47%'; hud.appendChild(chip);
    [58,72,86,100].forEach((v,i)=>later(()=>{chip.textContent=`SCAN ${v}%`;beep(420+i*70,.05,.018);},650+i*380));
    later(()=>{glitchFx();setScene(3);}, 2250);
  }
  function renderIntro3(){
    const btn=document.createElement('button'); btn.className='next-zone'; btn.setAttribute('aria-label','미확인 신호 추적');
    btn.addEventListener('click',()=>{beep(720,.08,.03);glitchFx();later(()=>setScene(4),250)});
    interaction.appendChild(btn);
    const hint=document.createElement('div'); hint.className='hint-pill'; hint.style.bottom='4.2%'; hint.textContent='버튼을 눌러 첫 번째 좌표를 추적하세요'; hud.appendChild(hint);
  }

  function renderExplore(){
    if(!explorationIntroSeen){
      const next=document.createElement('button'); next.className='next-zone'; next.setAttribute('aria-label','대화 넘기기');
      next.addEventListener('click',()=>{explorationIntroSeen=true;beep(520,.045,.018);clearLayers();renderExplore();});
      interaction.appendChild(next);
      renderLog();
      return;
    }
    const defs=[
      {id:'fire',label:'불꽃',x:82,y:48,size:12,on:()=>setScene(5)},
      {id:'deer',label:'생명체',x:67,y:70,size:13,on:()=>setScene('deer')},
      {id:'lake',label:'호수',x:49,y:50,size:12,on:()=>setScene('lake')},
    ];
    defs.forEach(d=>{
      const b=document.createElement('button');
      b.className=`hotspot pulse ${state.explored[d.id]?'done':''}`;
      b.style.cssText=`left:${d.x}%;top:${d.y}%;width:${d.size}%;`;
      b.setAttribute('aria-label',`${d.label} 조사`);
      b.innerHTML='<span class="ring"></span>';
      b.addEventListener('click',()=>{beep(620,.045,.025);d.on();});
      interaction.appendChild(b);
    });
    const remaining=Object.values(state.explored).filter(v=>!v).length;
    const hint=document.createElement('div'); hint.className='hint-pill explore-status'; hint.textContent=remaining?`주변 조사 ${3-remaining}/3`:'분석 완료'; hud.appendChild(hint);
    if(remaining===0) later(showRestorationError, 550);
    renderLog();
  }

  function markExplored(id){
    if(id==='fire') log('FLAME','TEMP · 00.0°C');
    if(id==='deer') log('LIFEFORM','BODY TEMP · NOT DETECTED');
    if(id==='lake') log('LAKE','INNER LAYER · FROZEN');
    state.explored[id]=true;
  }

  function renderFire(){
    scanline.classList.add('active');
    const next=document.createElement('button'); next.className='next-zone'; next.setAttribute('aria-label','불꽃 조사 완료');
    next.onclick=()=>{ markExplored('fire'); beep(470,.05,.02); setScene(4); };
    interaction.appendChild(next);
    renderLog();
  }

  function renderDedicatedInspect(type){
    scanline.classList.add('active');
    const next=document.createElement('button'); next.className='next-zone'; next.setAttribute('aria-label','조사 완료');
    next.onclick=()=>{ markExplored(type); beep(470,.05,.02); setScene(4); };
    interaction.appendChild(next);
    renderLog();
  }

  function showRestorationError(){
    if(document.querySelector('.system-banner')) return;
    interaction.innerHTML=''; shade.classList.add('dim'); glitchFx(); beep(220,.14,.03);
    const b=document.createElement('div'); b.className='system-banner';
    b.innerHTML=`<div class="system">SYSTEM ANALYSIS</div><strong>RESTORATION ERROR DETECTED</strong><p>겉으로만 회복된 상태입니다.<br>온기가 별의 내부까지 전달되지 않습니다.</p>`;
    hud.appendChild(b);
    later(()=>setScene(6),2300);
  }

  function renderSignalDiscovery(){
    const next=document.createElement('button'); next.className='next-zone'; next.setAttribute('aria-label','SIGNAL TRACE 시작');
    next.onclick=()=>{beep(780,.09,.03);glitchFx();later(()=>setScene(7),220)};
    interaction.appendChild(next);
    const hint=document.createElement('div'); hint.className='hint-pill'; hint.style.bottom='4%'; hint.textContent='온기 오류 신호를 추적하세요'; hud.appendChild(hint);
    renderLog();
  }

  function renderTrace(){
    shade.classList.add('dim');
    const wrap=document.createElement('div'); wrap.className='trace-ui';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','trace-svg'); svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('preserveAspectRatio','none');
    const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
    line.setAttribute('points', traceNodes.slice(0,state.traceIndex).map(n=>`${n.x},${n.y}`).join(' '));
    svg.appendChild(line); wrap.appendChild(svg);
    decoys.forEach((n,idx)=>wrap.appendChild(makeTraceNode(n,`d${idx}`,false)));
    traceNodes.forEach((n,idx)=>wrap.appendChild(makeTraceNode(n,n.id,true,idx)));
    const p=Math.round((state.traceIndex/traceNodes.length)*100);
    const footer=document.createElement('div'); footer.className='trace-footer';
    footer.innerHTML=`<div class="trace-row"><span>추적 진행률</span><strong>${p}%</strong></div><div class="progress"><i style="width:${p}%"></i></div>`;
    wrap.appendChild(footer); interaction.appendChild(wrap);
    if(state.traceIndex===0) toastMsg('1.4°C부터 온기 파동을 순서대로 연결하세요');
    renderLog();
  }
  function makeTraceNode(n,id,isCorrect,idx=-1){
    const b=document.createElement('button'); b.className='trace-node'; b.style.left=`${n.x}%`; b.style.top=`${n.y}%`; b.setAttribute('aria-label',`${n.label} 선택`);
    b.innerHTML=`<span class="dot"></span><span class="temp">${n.label}</span>`;
    if(isCorrect && idx<state.traceIndex) b.classList.add('correct','active');
    if(isCorrect && idx===state.traceIndex) b.classList.add('target');
    b.onclick=()=>{
      if(!isCorrect || idx!==state.traceIndex){ beep(130,.12,.03); glitchFx(); toastMsg('SIGNAL LOST · 올바른 온기 순서를 찾으세요','error'); return; }
      state.traceIndex++; beep(600+state.traceIndex*120,.08,.025);
      if(state.traceIndex===traceNodes.length){ log('SIGNAL TRACE','100% · COORDINATE LOCKED',false); setScene(9); return; }
      clearLayers(); renderTrace();
    };
    return b;
  }

  function renderTraceComplete(){
    const c=document.createElement('div'); c.className='coord-card';
    c.innerHTML=`<small>TARGET LOCKED</small><div class="coords">82.214° N / 45.612° E</div><button class="primary-button">좌표로 이동 &gt;</button>`;
    c.querySelector('button').onclick=()=>{beep(760,.08,.03);glitchFx();later(()=>setScene(10),250)};
    hud.appendChild(c); later(()=>c.classList.add('show'),600);
    renderLog();
  }

  function renderLocated(){
    const pulse=document.createElement('div'); pulse.className='crystal-pulse'; hud.appendChild(pulse);
    const panel=document.createElement('div'); panel.className=`located-panel ${state.restorationAttempted?'failed':''}`;
    if(!state.restorationAttempted){
      panel.innerHTML=`<div class="status">SIGNAL ANALYZING... / IDENTITY CONFIRMED</div><h2>예준 신호 위치 확인</h2><div class="sub">YEJUN SIGNAL LOCATED</div><button class="primary-button">복원 시도</button>`;
      panel.querySelector('button').onclick=attemptRestore;
    } else {
      panel.innerHTML=`<div class="status">YEJUN SIGNAL LOCATED</div><h2>위치 데이터 확보</h2><div class="fail">RESTORATION FAILED · 복원 실패</div><button class="primary-button">탐사 결과 확인 &gt;</button>`;
      panel.querySelector('button').onclick=()=>{beep(690,.08,.025);setScene(11)};
    }
    hud.appendChild(panel);
    renderLog();
  }
  function attemptRestore(){
    state.restorationAttempted=true; log('RESTORATION','FAILED');
    beep(880,.22,.035); glitchFx(); shade.style.background='rgba(78,150,255,.23)';
    later(()=>{shade.style.background='rgba(0,0,0,.15)';beep(170,.22,.03);clearLayers();renderLocated();},1050);
  }

  function renderCommunity(){
    image.style.opacity='0';
    const c=document.createElement('div'); c.className='community';
    c.innerHTML=`
      <div class="eyebrow">공동 탐사</div>
      <h1>예준 신호</h1><div class="caption">공동 탐사 현황</div>
      <div class="ring-progress" style="--p:${state.community}"><span class="percent">${state.community}%</span></div>
      <div class="community-copy">모든 PLLI의 탐사 데이터가<br>집계되고 있습니다...</div>
      <div class="community-card"><div class="signal-row"><div class="flower-star"></div><div><strong>NEW SIGNAL DETECTED</strong><span>꽃의 별 좌표 발견</span></div></div></div>
      <button class="primary-button">프로토타입 완료</button>`;
    interaction.appendChild(c);
    const ring=c.querySelector('.ring-progress'), pct=c.querySelector('.percent'), card=c.querySelector('.community-card'), btn=c.querySelector('.primary-button');
    [89,92,95,97,99,100].forEach((v,i)=>later(()=>{state.community=v; ring.style.setProperty('--p',v); pct.textContent=`${v}%`; beep(400+i*70,.045,.016);},700+i*400));
    later(()=>{ toastMsg('YEJUN SIGNAL STABILIZED'); glitchFx(); beep(920,.14,.03); c.querySelector('.community-copy').innerHTML='예준의 신호가 안정되었습니다.<br>새로운 감각 데이터가 검출됩니다.'; }, 700 + 6*400);
    later(()=>{ card.classList.add('show'); btn.classList.add('ready'); btn.onclick=showPrototypeComplete; }, 700 + 6*400 + 900);
    renderLog();
  }
  function showPrototypeComplete(){
    shade.classList.add('dim');
    const b=document.createElement('div'); b.className='system-banner'; b.style.borderColor='rgba(155,108,255,.48)';
    b.innerHTML=`<div class="system">CHAPTER 01 COMPLETE</div><strong style="color:#a98cff">NEXT SIGNAL · FLOWER STAR</strong><p>예준의 탐사는 완료되었습니다.<br>다음 챕터는 노아의 꽃의 별로 이어집니다.</p><button class="primary-button">예준 챕터 다시 플레이</button>`;
    b.querySelector('button').onclick=resetGame; hud.appendChild(b);
  }

  function openDrawer(){ drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); drawerBackdrop.classList.add('show'); renderLog(); }
  function closeDrawer(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); drawerBackdrop.classList.remove('show'); }
  menuHit.addEventListener('click',openDrawer);
  document.querySelector('#drawer-close').onclick=closeDrawer;
  drawerBackdrop.onclick=closeDrawer;
  soundToggle.onclick=()=>{ state.sound=!state.sound; soundToggle.textContent=`SOUND · ${state.sound?'ON':'OFF'}`; if(state.sound)beep(600,.05,.02); };
  document.querySelector('#restart').onclick=()=>{ closeDrawer(); resetGame(); };

  function resetGame(){
    clearTimers(); closeDrawer();
    state.explored={fire:false,deer:false,lake:false}; state.log=[]; state.traceIndex=0; state.restorationAttempted=false; state.community=87;
    explorationIntroSeen=false; image.style.opacity='1'; renderLog(); setScene(1,{fade:false});
  }

  Object.values(sceneAssets).forEach(src=>{ const p=new Image(); p.src=src; });
  resetGame();
})();
