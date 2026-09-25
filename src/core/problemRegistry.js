(function(A){
 class ProblemRegistry{
   constructor(){this.map=new Map();}
   register(def){if(!def.id)throw new Error('Problem definition needs id');this.map.set(def.id,def);}
   get(id){return this.map.get(id);}
   bySection(sectionId){return [...this.map.values()].filter(x=>x.section===sectionId);}
   all(){return [...this.map.values()];}
   generate(id,difficulty='mixed'){
     const def=this.get(id); if(!def)throw new Error('Unknown problem type: '+id);
     const generated=def.generate({difficulty,Random:A.Core.Random,Math:A.Math});
     const problem={...generated,typeId:id,chapter:def.chapter,section:def.section,title:def.title,difficulty};
     if(!problem.animation && def.chapter>=3 && def.chapter<=11 && problem.solution?.length){
       problem.animation={type:'guided-solution'};
     }
     return problem;
   }
 }
 A.Core.Registry=new ProblemRegistry();
})(MathApp);
