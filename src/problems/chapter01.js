(function(A){
 const R=A.Core.Registry, G=A.Core.Graders, U=A.Math.Utils;
 const placeNames=['ones','tens','hundreds','thousands','ten thousands'];
 const placeVals=[1,10,100,1000,10000];
 const steps=(...text)=>text.map(t=>({text:t}));
 R.register({id:'1.1.word-to-numeral',chapter:1,section:'1.1',title:'Word number → numeral',generate:({difficulty,Random})=>{
   const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999;
   const n=Random.int(101,max);
   const words=U.numberToWords(n);
   return {prompt:`Write this word number as a numeral: ${words}.`,answer:String(n),grader:G.numeric(n),animation:{type:'word-to-numeral',n,words},solution:steps(`Read the word number from the largest place value to the smallest.`,`Match each word group to its place value and place zeros where a place value is missing.`,`Write the digits together: ${U.formatNumber(n)}.`),answerPreview:'Enter digits only, spaces are optional.'};
 }});
 R.register({id:'1.1.numeral-to-word',chapter:1,section:'1.1',title:'Numeral → word number',generate:({difficulty,Random})=>{
   const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999,n=Random.int(101,max),w=U.numberToWords(n);
   return {prompt:`Write ${U.formatNumber(n)} as a word number.`,answer:w,grader:G.text(w),animation:{type:'numeral-to-word',n,words:w},solution:steps(`Separate the numeral into place-value groups.`,`Read each non-zero digit with its place value from left to right.`,`Combine the words without using “and” for a whole number.`,`Answer: ${w}.`),answerPreview:'Do not worry about capitalization.'};
 }});
 R.register({id:'1.1.place-value',chapter:1,section:'1.1',title:'Value of a digit',generate:({difficulty,Random})=>{
   const digits=difficulty==='easy'?3:difficulty==='medium'?4:5;
   let n=Random.int(10**(digits-1),10**digits-1),idx=Random.int(0,digits-1),pow=digits-1-idx,d=Number(String(n)[idx]),value=d*10**pow;
   if(d===0){idx=0;pow=digits-1;d=Number(String(n)[0]);value=d*10**pow;}
   return {prompt:`In the numeral ${U.formatNumber(n)}, what is the value of the digit ${d} in the ${placeNames[pow]} place?`,answer:String(value),grader:G.numeric(value),animation:{type:'place-value',n,targetIndex:idx,value},solution:steps(`Locate the digit ${d} in ${U.formatNumber(n)}.`,`It is in the ${placeNames[pow]} place, which has a value of ${U.formatNumber(10**pow)} for each unit.`,`Calculate ${d} × ${U.formatNumber(10**pow)} = ${U.formatNumber(value)}.`,`Answer: the value of the digit ${d} is ${U.formatNumber(value)}.`)};
 }});
 R.register({id:'1.1.expanded-form',chapter:1,section:'1.1',title:'Expanded form',generate:({difficulty,Random})=>{
   const digits=difficulty==='easy'?3:difficulty==='medium'?4:5,n=Random.int(10**(digits-1),10**digits-1);
   const vals=String(n).split('').map((d,i)=>Number(d)*10**(digits-1-i)).filter(Boolean),ans=vals.join(' + ');
   return {prompt:`Write ${U.formatNumber(n)} in expanded form.`,answer:ans,grader:(input)=>String(input).replace(/\s/g,'')===ans.replace(/\s/g,''),animation:{type:'expanded-form',n},solution:steps(`Look at each digit and identify its place value.`,`Convert each non-zero digit into its value: ${vals.join(', ')}.`,`Add those place values together: ${ans}.`,`So ${U.formatNumber(n)} = ${ans}.`),answerPreview:'Example format: 4000 + 300 + 20 + 1'};
 }});
 R.register({id:'1.2.compare-numbers',chapter:1,section:'1.2',title:'Compare whole numbers',generate:({difficulty,Random})=>{
   const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999; let a=Random.int(10,max),b=Random.int(10,max); if(Random.bool(.18))b=a; const sym=a===b?'=':a>b?'>':'<';
   return {promptHtml:`Choose &lt;, &gt;, or = : <span class="math-display">${U.formatNumber(a)} □ ${U.formatNumber(b)}</span>`,answer:sym,grader:G.symbol(sym),animation:{type:'compare-numbers',a,b},solution:steps(`Start with the highest place value and compare the digits.`,`If those digits are equal, move one place to the right until the first difference appears.`,`That comparison shows ${U.formatNumber(a)} ${sym} ${U.formatNumber(b)}.`,`Answer: ${sym}.`),answerPreview:'Type <, >, or ='};
 }});
 R.register({id:'1.2.order-numbers',chapter:1,section:'1.2',title:'Order whole numbers',generate:({difficulty,Random})=>{
   const count=difficulty==='easy'?4:5,max=difficulty==='easy'?999:difficulty==='medium'?9999:99999,nums=[];while(nums.length<count){const n=Random.int(10,max);if(!nums.includes(n))nums.push(n);}const ascending=Random.bool(),ans=[...nums].sort((a,b)=>ascending?a-b:b-a);
   return {prompt:`Order these numbers from ${ascending?'smallest to largest':'largest to smallest'}: ${nums.map(U.formatNumber).join(', ')}`,answer:ans.join(', '),grader:G.orderedList(ans),animation:{type:'order-numbers',nums:[...nums],ascending},solution:steps(`Compare the numbers beginning with the highest place value.`,`When two numbers have the same leading digit, compare the next digit to the right.`,`Continue until all numbers are placed in ${ascending?'ascending':'descending'} order.`,`Correct order: ${ans.map(U.formatNumber).join(', ')}.`),answerPreview:'Separate answers with spaces or commas.'};
 }});
 R.register({id:'1.3.rounding',chapter:1,section:'1.3',title:'Round whole numbers',generate:({difficulty,Random})=>{
   const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999,n=Random.int(11,max),places=difficulty==='easy'?[10,100]:[10,100,1000,10000].filter(p=>p<=max),place=Random.choice(places),ans=U.roundTo(n,place),name=place===10?'ten':place===100?'hundred':place===1000?'thousand':'ten thousand',rightDigit=Math.floor(n/(place/10))%10;
   return {prompt:`Round ${U.formatNumber(n)} to the nearest ${name}.`,answer:String(ans),grader:G.numeric(ans),animation:{type:'rounding',n,place,answer:ans},solution:steps(`Look at the digit immediately to the right of the ${name} place. It is ${rightDigit}.`,rightDigit>=5?'Because it is 5 or greater, round up.':'Because it is less than 5, keep the rounding digit the same.',`Replace all digits to the right with zero: ${U.formatNumber(ans)}.`)};
 }});
 R.register({id:'1.3.estimate-sum',chapter:1,section:'1.3',title:'Estimate a sum by rounding',generate:({difficulty,Random})=>{
   const place=difficulty==='easy'?10:100,a=Random.int(100,900),b=Random.int(100,900),ra=U.roundTo(a,place),rb=U.roundTo(b,place),ans=ra+rb;
   return {prompt:`Round ${a} and ${b} to the nearest ${place} and estimate their sum.`,answer:String(ans),grader:G.numeric(ans),animation:{type:'estimate-sum',a,b,place,ra,rb,answer:ans},solution:steps(`${a} rounds to ${ra}.`,`${b} rounds to ${rb}.`,`Estimated sum: ${ra} + ${rb} = ${ans}.`)};
 }});
})(MathApp);
