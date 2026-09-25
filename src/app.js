(function(A){
 const firstSection='1.1';
 const initialType=()=>A.Core.Registry.bySection(firstSection)[0]?.id;
 const state=A.State.app={view:'practice',sectionId:firstSection,typeId:null,difficulty:'mixed',problem:null,worksheetChapter:1,worksheetSection:'1.1',worksheetCount:12,rewardSession:null};
 let problemSeq=0;
 function newRewardSession({masteryEligible=false}={}){
   state.rewardSession={id:++problemSeq,solutionViewed:false,learningAwarded:false,correctCelebrated:false,masteryEligible,masteryAwarded:false,masteryDisqualified:false};
 }
 function ensureProblem(opts={}){
   const defs=A.Core.Registry.bySection(state.sectionId);
   if(!defs.length){state.typeId=null;state.problem={section:state.sectionId,title:'Coming soon',difficulty:state.difficulty,prompt:'No generator is registered for this section yet.',answer:'',grader:()=>null,solution:[]};newRewardSession();return;}
   if(!state.typeId||!defs.some(d=>d.id===state.typeId))state.typeId=defs[0].id;
   state.problem=A.Core.Registry.generate(state.typeId,state.difficulty);
   newRewardSession({masteryEligible:!!opts.masteryEligible});
 }
 function render(){
   const root=document.getElementById('app');
   document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
   if(state.view==='practice'){if(!state.problem)ensureProblem();root.innerHTML=A.UI.practice(state);bindPractice();}
   else if(state.view==='worksheet'){root.innerHTML=A.UI.worksheetBuilder(state);bindWorksheet();}
   else {root.innerHTML=A.UI.progress();bindProgress();}
 }
 function bindNavCommon(){
   document.querySelectorAll('[data-chapter]').forEach(btn=>btn.addEventListener('click',()=>{const wrap=btn.nextElementSibling;wrap.hidden=!wrap.hidden;}));
   document.querySelectorAll('[data-section]').forEach(btn=>btn.addEventListener('click',()=>{state.sectionId=btn.dataset.section;state.typeId=null;state.problem=null;render();}));
 }
 function rewardToast(kind,reward){
   document.querySelector('.reward-toast')?.remove();
   const toast=document.createElement('div');
   toast.className=`reward-toast ${kind}`;
   const big=kind==='mastery';
   toast.innerHTML=`<div class="reward-toast-icon">${reward.icon}</div><div><strong>${big?'Mastery Sticker!':'Learning Sticker!'}</strong><div>${big?'You studied an example and solved a similar problem.':'You used the solution to learn.'}</div></div>`;
   document.body.appendChild(toast);
   requestAnimationFrame(()=>toast.classList.add('show'));
   setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),350);},2600);
   updateRewardStrip();
 }
 function updateRewardStrip(){
   const r=A.Services.Storage.rewards?.();
   const pills=document.querySelectorAll('.reward-pill strong');
   if(pills[0])pills[0].textContent=r?.learning||0;
   if(pills[1])pills[1].textContent=r?.mastery||0;
 }
 function fireworks(){
   document.querySelector('.fireworks-layer')?.remove();
   const layer=document.createElement('div'); layer.className='fireworks-layer';
   const palettes=[
     ['#ffd54f','#ff8a65','#ff5252'],
     ['#80d8ff','#40c4ff','#536dfe'],
     ['#b9f6ca','#69f0ae','#00c853'],
     ['#ea80fc','#e040fb','#7c4dff'],
     ['#ff9e80','#ff6e40','#ff1744']
   ];
   const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   const rockets=reduceMotion?3:6;
   const launchDuration=reduceMotion?1.2:2.25;
   const spacingStart=12, spacingWidth=76;
   for(let r=0;r<rockets;r++){
     const x=spacingStart+r*(spacingWidth/Math.max(1,rockets-1))+(Math.random()*4-2);
     const targetTop=10+Math.random()*18;
     const delay=r*(reduceMotion?0.32:0.42);
     const burstTime=delay+launchDuration-0.02;
     const palette=palettes[r%palettes.length];
     const rocket=document.createElement('span');
     rocket.className='firework-rocket';
     rocket.style.left=x+'%';
     rocket.style.setProperty('--target-top',targetTop+'vh');
     rocket.style.setProperty('--rocket-color',palette[0]);
     rocket.style.animationDelay=delay+'s';
     rocket.style.animationDuration=launchDuration+'s';
     layer.appendChild(rocket);

     const burst=document.createElement('div');
     burst.className='firework-burst';
     burst.style.left=x+'%';
     burst.style.top=targetTop+'vh';
     burst.style.animationDelay=burstTime+'s';

     const flash=document.createElement('span');
     flash.className='firework-flash';
     flash.style.setProperty('--flash-color',palette[0]);
     flash.style.animationDelay=burstTime+'s';
     burst.appendChild(flash);

     const ring=document.createElement('span');
     ring.className='firework-ring';
     ring.style.setProperty('--ring-color',palette[1]);
     ring.style.animationDelay=(burstTime+0.02)+'s';
     burst.appendChild(ring);

     const particles=reduceMotion?20:46;
     for(let i=0;i<particles;i++){
       const ang=(Math.PI*2*i)/particles + (Math.random()-.5)*.07;
       const dist=(reduceMotion?74:120)+Math.random()*(reduceMotion?35:95);
       const localDelay=Math.random()*0.16;
       const particle=document.createElement('span');
       particle.className='firework-particle';
       particle.style.background=`linear-gradient(to bottom, #fff, ${palette[i%palette.length]})`;
       particle.style.color=palette[i%palette.length];
       particle.style.setProperty('--dx',Math.cos(ang)*dist+'px');
       particle.style.setProperty('--dy',Math.sin(ang)*dist+'px');
       particle.style.setProperty('--rot',(ang*180/Math.PI+90)+'deg');
       particle.style.setProperty('--spark-delay',localDelay+'s');
       particle.style.animationDelay=(burstTime+localDelay)+'s';
       burst.appendChild(particle);
       if(i%3===0){
         const spark=document.createElement('span');
         spark.className='firework-spark';
         spark.style.background=palette[(i+1)%palette.length];
         spark.style.setProperty('--sdx',Math.cos(ang)*(dist*.72)+'px');
         spark.style.setProperty('--sdy',Math.sin(ang)*(dist*.72)+'px');
         const sparkDelay=0.15+Math.random()*.22;
         spark.style.setProperty('--spark-delay',sparkDelay+'s');
         spark.style.animationDelay=(burstTime+sparkDelay)+'s';
         burst.appendChild(spark);
       }
     }
     layer.appendChild(burst);
   }
   const message=document.createElement('div');
   message.className='fireworks-message';
   message.innerHTML='<span class="correct-check">✓</span><span>Correct!</span><span class="correct-star">✨</span>';
   layer.appendChild(message);
   document.body.appendChild(layer);
   setTimeout(()=>layer.remove(),reduceMotion?5200:9000);
 }
 function markSolutionViewed(){
   const rs=state.rewardSession;if(!rs)return;
   rs.solutionViewed=true;
   if(rs.masteryEligible)rs.masteryDisqualified=true;
 }
 function bindPractice(){
   bindNavCommon();
   const type=document.getElementById('problemType'),diff=document.getElementById('difficulty');
   type?.addEventListener('change',()=>{state.typeId=type.value;state.problem=null;render();});
   diff?.addEventListener('change',()=>{state.difficulty=diff.value;state.problem=null;render();});
   document.getElementById('newProblem')?.addEventListener('click',()=>{
      const masteryEligible=!!state.rewardSession?.solutionViewed;
      ensureProblem({masteryEligible});render();
   });
   const input=document.getElementById('answerInput');
   input?.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('checkAnswer').click();});
   document.getElementById('checkAnswer')?.addEventListener('click',()=>{
      const fb=document.getElementById('feedback'); const raw=input.value; const result=state.problem.grader(raw);
      if(result===null){fb.className='feedback show info';fb.textContent='This is an open-response question. Compare your reasoning with the sample solution below.';const s=document.getElementById('solution');s.hidden=false;s.innerHTML=A.UI.solution(state.problem);markSolutionViewed();return;}
      A.Services.Storage.record(state.problem.typeId,result);
      fb.className='feedback show '+(result?'ok':'bad'); fb.textContent=result?'Correct! Great work!':'Not quite. Try again, or view the step-by-step solution.';
      if(result){
        const rs=state.rewardSession;
        if(rs&&!rs.correctCelebrated){rs.correctCelebrated=true;fireworks();}
        if(rs&&!rs.learningAwarded){
          rs.learningAwarded=true;
          rewardToast('learning',A.Services.Storage.awardLearning());
        }
        if(rs?.masteryEligible&&!rs.masteryDisqualified&&!rs.masteryAwarded){
          rs.masteryAwarded=true;
          const masteryReward=A.Services.Storage.awardMastery();
          setTimeout(()=>rewardToast('mastery',masteryReward),1200);
        }
      }
   });
   document.getElementById('showSolution')?.addEventListener('click',()=>{const s=document.getElementById('solution');s.hidden=!s.hidden;if(!s.hidden){s.innerHTML=A.UI.solution(state.problem);markSolutionViewed();}});
   document.getElementById('showAnimation')?.addEventListener('click',()=>{
      const s=document.getElementById('solution');s.hidden=false;s.innerHTML=A.UI.animation(state.problem);markSolutionViewed();
      const panel=document.getElementById('animationPanel');A.Renderers.AnimatedArithmetic?.createController(state.problem,panel);
   });
 }
 function bindWorksheet(){
   const ch=document.getElementById('wsChapter'),sec=document.getElementById('wsSection');
   ch?.addEventListener('change',()=>{state.worksheetChapter=Number(ch.value);state.worksheetSection=A.Data.chapters.find(c=>c.id===state.worksheetChapter).sections[0].id;render();});
   sec?.addEventListener('change',()=>{state.worksheetSection=sec.value;});
   document.getElementById('generateWorksheet')?.addEventListener('click',()=>{
      state.worksheetCount=Math.max(1,Math.min(50,Number(document.getElementById('wsCount').value)||12));
      state.worksheetSection=document.getElementById('wsSection').value;
      const difficulty=document.getElementById('wsDifficulty').value;
      const problems=A.Services.Worksheet.generate({sectionId:state.worksheetSection,count:state.worksheetCount,difficulty});
      document.getElementById('worksheetOutput').innerHTML=A.UI.worksheet(problems,document.getElementById('includeAnswers').checked);
   });
 }
 function bindProgress(){document.getElementById('resetProgress')?.addEventListener('click',()=>{if(confirm('Reset all locally stored progress and stickers?')){A.Services.Storage.reset();state.problem=null;render();}});}
 document.addEventListener('DOMContentLoaded',()=>{
   state.typeId=initialType();
   document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;render();}));
   render();
 });
})(MathApp);
