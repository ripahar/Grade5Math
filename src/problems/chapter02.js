(function(A){
 const R=A.Core.Registry,G=A.Core.Graders,U=A.Math.Utils,F=A.Math.Fraction,MR=A.Renderers.Math;
 const S=(...x)=>x.map(text=>({text}));
 const placeNames=['ones','tens','hundreds','thousands','ten-thousands','hundred-thousands'];
 const choose=(Random,items)=>Random.choice(items);
 const expandParts=n=>{const out=[];let place=1,x=n;while(x>0){const d=x%10;if(d)out.unshift(d*place);x=Math.floor(x/10);place*=10;}return out;};
 const additionSteps=(a,b)=>{
   const steps=[{html:`<div><strong>Set up the addition by place value:</strong><br>${MR.vertical(a,b,'+','')}</div>`}];
   let x=a,y=b,carry=0,pos=0;
   while(x>0 || y>0 || carry>0){
     const da=x%10, db=y%10, incoming=carry, total=da+db+incoming;
     const digit=total%10, nextCarry=Math.floor(total/10);
     const place=placeNames[pos]||`10^${pos} place`;
     let calc=`${da} + ${db}`+(incoming?` + ${incoming} (carried)`:'')+` = ${total}. `;
     calc += nextCarry ? `Write ${digit} in the ${place} place and carry ${nextCarry} to the next column.` : `Write ${digit} in the ${place} place.`;
     steps.push({text:`${place[0].toUpperCase()+place.slice(1)}: ${calc}`});
     carry=nextCarry; x=Math.floor(x/10); y=Math.floor(y/10); pos++;
   }
   steps.push({html:`<div><strong>Completed calculation:</strong><br>${MR.vertical(a,b,'+',a+b)}</div>`});
   steps.push({text:`Therefore, ${U.formatNumber(a)} + ${U.formatNumber(b)} = ${U.formatNumber(a+b)}.`});
   return steps;
 };
 const subtractionSteps=(a,b)=>{
   const steps=[{html:`<div><strong>Set up the subtraction by place value:</strong><br>${MR.vertical(a,b,'−','')}</div>`}];
   const top=String(a).split('').reverse().map(Number);
   const bot=String(b).split('').reverse().map(Number);
   while(bot.length<top.length) bot.push(0);
   for(let i=0;i<top.length;i++){
     const place=placeNames[i]||`10^${i} place`;
     let topDigit=top[i], bottomDigit=bot[i]||0;
     if(topDigit<bottomDigit){
       let j=i+1;
       while(j<top.length && top[j]===0) j++;
       const lenderPlace=placeNames[j]||`10^${j} place`;
       top[j]-=1;
       for(let k=j-1;k>i;k--) top[k]+=9;
       top[i]+=10;
       const crossed=[];
       for(let k=j-1;k>i;k--) crossed.push(placeNames[k]||`10^${k} place`);
       let borrow=`Because ${topDigit} is less than ${bottomDigit}, regroup 1 ${lenderPlace.slice(0,-1)||lenderPlace} from the ${lenderPlace} column. `;
       if(crossed.length) borrow+=`The ${crossed.join(' and ')} column${crossed.length>1?'s':''} become${crossed.length===1?'s':''} 9, and the ${place} value becomes ${top[i]}. `;
       else borrow+=`The ${place} value becomes ${top[i]}. `;
       borrow+=`Now calculate ${top[i]} − ${bottomDigit} = ${top[i]-bottomDigit}.`;
       steps.push({text:`${place[0].toUpperCase()+place.slice(1)}: ${borrow}`});
     } else {
       steps.push({text:`${place[0].toUpperCase()+place.slice(1)}: ${topDigit} − ${bottomDigit} = ${topDigit-bottomDigit}. Write ${topDigit-bottomDigit} in the ${place} place.`});
     }
   }
   steps.push({html:`<div><strong>Completed calculation:</strong><br>${MR.vertical(a,b,'−',a-b)}</div>`});
   steps.push({text:`Therefore, ${U.formatNumber(a)} − ${U.formatNumber(b)} = ${U.formatNumber(a-b)}.`});
   return steps;
 };

 R.register({id:'2.1.addition',chapter:2,section:'2.1',title:'Add whole numbers',generate:({difficulty,Random})=>{const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999,a=Random.int(100,max),b=Random.int(100,max),ans=a+b;return {promptHtml:`Find the sum:<br>${MR.vertical(U.formatNumber(a),U.formatNumber(b),'+','?')}`,answer:String(ans),grader:G.numeric(ans),solution:additionSteps(a,b),animation:{type:'column-addition',a,b}};}});
 R.register({id:'2.1.subtraction',chapter:2,section:'2.1',title:'Subtract whole numbers',generate:({difficulty,Random})=>{const max=difficulty==='easy'?999:difficulty==='medium'?9999:99999,a=Random.int(200,max),b=Random.int(100,a),ans=a-b;return {promptHtml:`Find the difference:<br>${MR.vertical(U.formatNumber(a),U.formatNumber(b),'−','?')}`,answer:String(ans),grader:G.numeric(ans),solution:subtractionSteps(a,b),animation:{type:'column-subtraction',a,b}};}});
 R.register({id:'2.1.missing-addend',chapter:2,section:'2.1',title:'Missing addend',generate:({difficulty,Random})=>{const a=Random.int(100,5000),b=Random.int(100,5000),total=a+b;const prompt=choose(Random,[`Two numbers add to ${U.formatNumber(total)}. One number is ${U.formatNumber(a)}. What is the other number?`,`A school collected ${U.formatNumber(total)} cans. One class collected ${U.formatNumber(a)} of them. How many cans were collected by the other class?`,`A library has ${U.formatNumber(total)} books on two shelves. One shelf holds ${U.formatNumber(a)} books. How many books are on the other shelf?`,`Two teams scored ${U.formatNumber(total)} points altogether. One team scored ${U.formatNumber(a)} points. How many points did the other team score?`]);return {prompt,answer:String(b),grader:G.numeric(b),solution:[{text:`The unknown part plus ${U.formatNumber(a)} makes the total ${U.formatNumber(total)}, so subtract.`},{html:MR.equationLines([`${total} - ${a} = ${b}`],'Subtract the known part from the total')},{text:`The missing amount is ${U.formatNumber(b)}.`},{html:`<div><strong>Check:</strong><br>${MR.vertical(a,b,'+',total)}</div>`}]};}});
 R.register({id:'2.2.times-table',chapter:2,section:'2.2',title:'Times-table fact',generate:({difficulty,Random})=>{const max=difficulty==='easy'?8:12,a=Random.int(2,max),b=Random.int(2,max),ans=a*b;return {promptHtml:`Calculate: <span class="math-display">${a} × ${b} = ?</span>`,answer:String(ans),grader:G.numeric(ans),solution:[{html:MR.equationLines([`${a} × ${b} = ${ans}`],'Use the multiplication fact')} ,{text:`Answer: ${ans}.`}]};}});
 R.register({id:'2.2.distributive',chapter:2,section:'2.2',title:'Mental multiplication using distributive property',generate:({difficulty,Random})=>{const a=Random.int(3,9),b=Random.int(12,difficulty==='easy'?49:99),t=Math.floor(b/10)*10,o=b%10,ans=a*b;return {prompt:`Use the distributive property to find ${a} × ${b}.`,answer:String(ans),grader:G.numeric(ans),solution:[{html:MR.equationLines([`${a} × ${b} = ${a} × (${t} + ${o})`,`= (${a} × ${t}) + (${a} × ${o})`,`= ${a*t} + ${a*o}`,`= ${ans}`],'Break apart the second factor')} ,{text:`Answer: ${ans}.`}]};}});
 R.register({id:'2.3.two-digit-multiply',chapter:2,section:'2.3',title:'Multiply whole numbers',generate:({difficulty,Random})=>{let a,b;if(difficulty==='challenge'){a=Random.int(100,999);b=Random.int(10,99);}else if(difficulty==='medium'){a=Random.int(40,99);b=Random.int(20,99);}else{a=Random.int(11,49);b=Random.int(11,39);}const ans=a*b,ap=expandParts(a),bp=expandParts(b),partials=[];for(const x of ap)for(const y of bp)partials.push(x*y);return {promptHtml:`Find the product: <span class="math-display">${a} × ${b}</span>`,answer:String(ans),grader:G.numeric(ans),solution:[{html:MR.longMultiplication(a,b)},{html:MR.equationLines([`${a} = ${ap.join(' + ')}`,`${b} = ${bp.join(' + ')}`,`Partial products: ${partials.join(' + ')}`,`${partials.join(' + ')} = ${ans}`],'Check using place-value partial products')},{text:`Therefore, ${a} × ${b} = ${ans}.`}],animation:{type:'column-multiplication',a,b}};}});
 R.register({id:'2.3.word-product',chapter:2,section:'2.3',title:'Multiplication word problem',generate:({difficulty,Random})=>{const count=difficulty==='challenge'?Random.int(100,350):Random.int(8,difficulty==='easy'?20:60),each=Random.int(9,difficulty==='easy'?30:85),ans=count*each;const scenarios=[{key:'sticker-packs',groupLabel:'packs',itemLabel:'stickers',unit:'stickers',prompt:`A teacher orders ${count} packs of stickers with ${each} stickers in each pack. How many stickers are ordered altogether?`},{key:'rows-of-chairs',groupLabel:'rows',itemLabel:'chairs',unit:'chairs',prompt:`A theatre has ${count} rows with ${each} chairs in each row. How many chairs are there altogether?`},{key:'boxes',groupLabel:'boxes',itemLabel:'cans',unit:'cans',prompt:`A warehouse stacks ${count} boxes with ${each} cans in each box. How many cans are there altogether?`},{key:'bags',groupLabel:'bags',itemLabel:'apples',unit:'apples',prompt:`A market packs ${count} bags with ${each} apples in each bag. How many apples are packed altogether?`},{key:'trays',groupLabel:'trays',itemLabel:'cookies',unit:'cookies',prompt:`A cafeteria prepares ${count} trays with ${each} cookies on each tray. How many cookies are there altogether?`},{key:'teams',groupLabel:'teams',itemLabel:'players',unit:'players',prompt:`A sports tournament has ${count} teams with ${each} players on each team. How many players are there altogether?`}];const sc=choose(Random,scenarios);return {prompt:sc.prompt,answer:String(ans),grader:G.numeric(ans),solution:[{text:`The problem gives ${count} equal groups of ${each}, so use multiplication.`},{html:MR.equationLines([`${count} × ${each} = ${ans}`],'Number sentence')},{text:`Therefore, there are ${U.formatNumber(ans)} ${sc.unit} altogether.`}],animation:{type:'word-product-clipart',contextType:sc.key,groupLabel:sc.groupLabel,itemLabel:sc.itemLabel,unit:sc.unit,count,each,answer:ans}};}});
 R.register({id:'2.4.exact-division',chapter:2,section:'2.4',title:'Exact division',generate:({difficulty,Random})=>{const divisor=Random.int(2,difficulty==='easy'?9:20),q=Random.int(3,difficulty==='easy'?12:50),dividend=divisor*q;return {promptHtml:`Divide: <span class="math-display">${dividend} ÷ ${divisor}</span>`,answer:String(q),grader:G.numeric(q),animation:{type:'long-division',dividend,divisor},solution:[{html:MR.longDivisionWork(dividend,divisor)},{html:MR.equationLines([`${divisor} × ${q} = ${dividend}`,`${dividend} ÷ ${divisor} = ${q}`],'Related multiplication fact')} ,{text:`Answer: ${q}.`}]};}});
 R.register({id:'2.4.division-remainder',chapter:2,section:'2.4',title:'Division with remainder',generate:({difficulty,Random})=>{const divisor=Random.int(3,difficulty==='easy'?9:24),q=Random.int(3,difficulty==='easy'?12:40),rem=Random.int(1,divisor-1),dividend=divisor*q+rem,ans=`${q} R${rem}`;return {prompt:`Divide ${dividend} by ${divisor}. Give the quotient and remainder.`,answer:ans,grader:(input)=>String(input).toUpperCase().replace(/\s+/g,'')===ans.replace(/\s+/g,''),animation:{type:'long-division',dividend,divisor},solution:[{html:MR.longDivisionWork(dividend,divisor)},{html:MR.equationLines([`${divisor} × ${q} = ${divisor*q}`,`${dividend} - ${divisor*q} = ${rem}`,`${dividend} ÷ ${divisor} = ${q} remainder ${rem}`],'Interpret the long division')} ,{text:`Answer: ${q} R${rem}.`}]};}});
 R.register({id:'2.5.simplify-ratio',chapter:2,section:'2.5',title:'Simplify a ratio',generate:({difficulty,Random})=>{let a=Random.int(1,8),b=Random.int(1,8);while(a===b)b=Random.int(1,8);const k=Random.int(2,difficulty==='easy'?5:10),A0=a*k,B0=b*k,g=U.gcd(A0,B0),sa=A0/g,sb=B0/g;return {prompt:`Write the ratio ${A0}:${B0} in simplest form.`,answer:`${sa}:${sb}`,grader:G.ratio(A0,B0),solution:[{html:MR.equationLines([`${A0}:${B0}`,`= (${A0} ÷ ${g}) : (${B0} ÷ ${g})`,`= ${sa}:${sb}`],'Divide both terms by the greatest common factor')} ,{text:`Answer: ${sa}:${sb}.`}],answerPreview:'Use a colon, for example 3:4'};}});
 R.register({id:'2.6.unit-rate',chapter:2,section:'2.6',title:'Find a unit rate',generate:({difficulty,Random})=>{const units=Random.int(2,difficulty==='easy'?6:12),rate=Random.int(2,20),total=units*rate;const scenarios=[{prompt:`A cyclist travels ${total} km in ${units} hours at a constant rate. How many kilometres per hour is that?`,label:'km/h'},{prompt:`A student reads ${total} pages in ${units} days at a constant rate. How many pages per day is that?`,label:'pages per day'},{prompt:`A machine fills ${total} bottles in ${units} minutes at a constant rate. How many bottles per minute is that?`,label:'bottles per minute'},{prompt:`A car uses ${units} L of fuel to travel ${total} km. How many kilometres does it travel per litre?`,label:'km/L'},{prompt:`A worker earns $${total} for ${units} hours of work. How many dollars per hour is that?`,label:'dollars per hour'}];const sc=choose(Random,scenarios);return {prompt:sc.prompt,answer:String(rate),grader:G.numeric(rate),solution:[{text:`A unit rate tells the amount for exactly 1 unit.`},{html:MR.equationLines([`${total} ÷ ${units} = ${rate}`],'Divide the total by the number of units')},{text:`The unit rate is ${rate} ${sc.label}.`}]};}});
})(MathApp);
