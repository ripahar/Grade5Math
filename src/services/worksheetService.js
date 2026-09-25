(function(A){
 const W=A.Services.Worksheet={};
 W.generate=({sectionId,typeIds,count=10,difficulty='mixed'})=>{
   let ids=typeIds?.length?typeIds:A.Core.Registry.bySection(sectionId).map(x=>x.id);
   if(!ids.length)return [];
   return Array.from({length:count},(_,i)=>A.Core.Registry.generate(A.Core.Random.choice(ids),difficulty));
 };
})(MathApp);
