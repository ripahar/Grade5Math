(function(A){
 const KEY='grade5MathProgress.v1';
 const S=A.Services.Storage={};
 const defaults=()=>({attempts:0,correct:0,byType:{},rewards:{learning:0,mastery:0,learningStickers:[],masteryStickers:[]}});
 const normalize=p=>{
   p=p&&typeof p==='object'?p:defaults();
   p.attempts=Number(p.attempts)||0; p.correct=Number(p.correct)||0; p.byType=p.byType||{};
   p.rewards=p.rewards||{};
   p.rewards.learning=Number(p.rewards.learning)||0;
   p.rewards.mastery=Number(p.rewards.mastery)||0;
   p.rewards.learningStickers=Array.isArray(p.rewards.learningStickers)?p.rewards.learningStickers:[];
   p.rewards.masteryStickers=Array.isArray(p.rewards.masteryStickers)?p.rewards.masteryStickers:[];
   return p;
 };
 S.load=()=>{try{return normalize(JSON.parse(localStorage.getItem(KEY)));}catch{return defaults();}};
 S.save=data=>{try{localStorage.setItem(KEY,JSON.stringify(normalize(data)));}catch{}};
 S.record=(typeId,isCorrect)=>{
   if(isCorrect===null||typeof isCorrect==='undefined')return;
   const p=S.load(); p.attempts++; if(isCorrect)p.correct++;
   p.byType[typeId]??={attempts:0,correct:0}; p.byType[typeId].attempts++; if(isCorrect)p.byType[typeId].correct++;
   S.save(p);
 };
 const learningIcons=['⭐','💡','📘','✏️','🐸'];
 const masteryIcons=['🏆','👑','🚀','🌈','🐸'];
 S.awardLearning=()=>{
   const p=S.load(), icon=learningIcons[p.rewards.learning%learningIcons.length];
   p.rewards.learning++; p.rewards.learningStickers.push(icon); S.save(p);
   return {icon,count:p.rewards.learning};
 };
 S.awardMastery=()=>{
   const p=S.load(), icon=masteryIcons[p.rewards.mastery%masteryIcons.length];
   p.rewards.mastery++; p.rewards.masteryStickers.push(icon); S.save(p);
   return {icon,count:p.rewards.mastery};
 };
 S.rewards=()=>S.load().rewards;
 S.reset=()=>{try{localStorage.removeItem(KEY);}catch{}};
})(MathApp);
