(function(A){
  const AR=A.Renderers.AnimatedArithmetic={};
  const esc=A.Renderers.Math.escape;

  function digitsOf(n,width){
    return String(Math.abs(Number(n))).padStart(width,' ').split('');
  }

  function placeName(pos){
    const names=['ones','tens','hundreds','thousands','ten-thousands','hundred-thousands'];
    return names[pos]||`10^${pos}`;
  }

  AR.buildAdditionFrames=(a,b)=>{
    a=Number(a); b=Number(b);
    const result=a+b;
    const inputWidth=Math.max(String(a).length,String(b).length);
    const width=Math.max(inputWidth,String(result).length);
    const frames=[{
      mode:'addition',
      title:'Set up the problem',
      text:'Line up the numbers by place value. We will begin with the ones column on the right.',
      activeFromRight:null,
      resultDigits:[],
      carries:{},
      completed:false
    }];

    let carry=0;
    const resultDigits=[];
    const carries={};
    for(let pos=0;pos<inputWidth;pos++){
      const place=Math.pow(10,pos);
      const da=Math.floor(a/place)%10;
      const db=Math.floor(b/place)%10;
      const incoming=carry;
      const total=da+db+incoming;
      const digit=total%10;
      const nextCarry=Math.floor(total/10);
      resultDigits[pos]=digit;
      if(incoming) carries[pos]=incoming;
      if(nextCarry) carries[pos+1]=nextCarry;
      else delete carries[pos+1];
      const name=placeName(pos);
      frames.push({
        mode:'addition',
        title:`Add the ${name}`,
        text:`${da} + ${db}${incoming?` + ${incoming} carried`:''} = ${total}. Write ${digit} in the ${name} place${nextCarry?` and carry ${nextCarry} to the next column`:''}.`,
        activeFromRight:pos,
        resultDigits:[...resultDigits],
        carries:{...carries},
        completed:false
      });
      carry=nextCarry;
    }

    if(carry){
      resultDigits[inputWidth]=carry;
      delete carries[inputWidth];
      frames.push({
        mode:'addition',
        title:'Write the final carry',
        text:`There are no more digits to add. Write the carried ${carry} in the next place to the left.`,
        activeFromRight:inputWidth,
        resultDigits:[...resultDigits],
        carries:{...carries},
        completed:false
      });
    }

    frames.push({
      mode:'addition',
      title:'Complete the addition',
      text:`The final sum is ${result}.`,
      activeFromRight:null,
      resultDigits:String(result).split('').reverse().map(Number),
      carries:{},
      completed:true
    });
    return {type:'column-addition',a,b,result,width,frames};
  };

  AR.buildSubtractionFrames=(a,b)=>{
    a=Number(a); b=Number(b);
    if(b>a)[a,b]=[b,a];
    const result=a-b;
    const width=Math.max(String(a).length,String(b).length);
    const originalTop=digitsOf(a,width).map(d=>d.trim()===''?null:Number(d));
    const bottom=digitsOf(b,width).map(d=>d.trim()===''?null:Number(d));
    const work=String(a).padStart(width,'0').split('').reverse().map(Number);
    const bot=String(b).padStart(width,'0').split('').reverse().map(Number);
    const resultDigits=[];
    const frames=[{
      mode:'subtraction',
      title:'Set up the problem',
      text:'Line up the numbers by place value. Start subtracting in the ones column on the right.',
      activeFromRight:null,
      resultDigits:[],
      workingTop:[...work],
      changedFromRight:[],
      originalTop,
      bottom,
      completed:false
    }];

    for(let pos=0;pos<width;pos++){
      const name=placeName(pos);
      const bottomDigit=bot[pos];
      if(work[pos] < bottomDigit){
        const before=[...work];
        let lender=pos+1;
        while(lender<width && work[lender]===0) lender++;
        if(lender<width){
          work[lender]-=1;
          for(let k=lender-1;k>pos;k--) work[k]=9;
          work[pos]+=10;
          const changed=[];
          for(let k=pos;k<=lender;k++) if(before[k]!==work[k]) changed.push(k);
          const crossed=lender-pos-1;
          const lenderName=placeName(lender);
          let text=`${before[pos]} is smaller than ${bottomDigit}, so regroup from the ${lenderName} column. `;
          if(crossed>0){
            text+=`The ${crossed===1?'zero between the columns becomes 9':'zeros between the columns become 9s'}, and the ${name} value becomes ${work[pos]}. `;
          } else {
            text+=`The ${name} value becomes ${work[pos]}. `;
          }
          text+=`Now the ${name} column is ready to subtract.`;
          frames.push({
            mode:'subtraction',
            title:`Regroup for the ${name}`,
            text,
            activeFromRight:pos,
            resultDigits:[...resultDigits],
            workingTop:[...work],
            changedFromRight:changed,
            originalTop,
            bottom,
            completed:false,
            regroup:true
          });
        }
      }

      const topDigit=work[pos];
      const digit=topDigit-bottomDigit;
      resultDigits[pos]=digit;
      frames.push({
        mode:'subtraction',
        title:`Subtract the ${name}`,
        text:`${topDigit} − ${bottomDigit} = ${digit}. Write ${digit} in the ${name} place.`,
        activeFromRight:pos,
        resultDigits:[...resultDigits],
        workingTop:[...work],
        changedFromRight:[],
        originalTop,
        bottom,
        completed:false
      });
    }

    frames.push({
      mode:'subtraction',
      title:'Complete the subtraction',
      text:`The final difference is ${result}.`,
      activeFromRight:null,
      resultDigits:String(result).split('').reverse().map(Number),
      workingTop:[...work],
      changedFromRight:[],
      originalTop,
      bottom,
      completed:true
    });
    return {type:'column-subtraction',a,b,result,width,frames};
  };

  AR.renderAddition=(model,index=0)=>{
    const frame=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const width=model.width;
    const top=digitsOf(model.a,width);
    const bottom=digitsOf(model.b,width);
    const cols=Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      const active=frame.activeFromRight===fromRight;
      const carry=frame.carries[fromRight] ?? '';
      const answer=frame.resultDigits[fromRight] ?? '';
      return `<div class="anim-column ${active?'active':''}">
        <div class="anim-carry ${carry!==''?'visible':''}">${carry!==''?esc(carry):'&nbsp;'}</div>
        <div class="anim-top">${top[leftIndex].trim()?esc(top[leftIndex]):'&nbsp;'}</div>
        <div class="anim-bottom">${bottom[leftIndex].trim()?esc(bottom[leftIndex]):'&nbsp;'}</div>
        <div class="anim-answer ${answer!==''?'visible':''}">${answer!==''?esc(answer):'&nbsp;'}</div>
      </div>`;
    }).join('');

    return `<div class="addition-animation" data-frame="${index}">
      <div class="animation-workspace" aria-label="Animated column addition">
        <div class="anim-operator">+</div>
        <div class="anim-columns">${cols}</div>
      </div>
      <div class="animation-explanation">
        <strong>${esc(frame.title)}</strong>
        <div>${esc(frame.text)}</div>
      </div>
      <div class="animation-progress">Step ${index+1} of ${model.frames.length}</div>
    </div>`;
  };

  AR.renderSubtraction=(model,index=0)=>{
    const frame=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const width=model.width;
    const originalTop=digitsOf(model.a,width);
    const bottom=digitsOf(model.b,width);
    const changed=new Set(frame.changedFromRight||[]);
    const cols=Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      const active=frame.activeFromRight===fromRight;
      const answer=frame.resultDigits[fromRight] ?? '';
      const working=frame.workingTop[fromRight];
      const original=originalTop[leftIndex].trim()===''?'':Number(originalTop[leftIndex]);
      const isChanged=changed.has(fromRight);
      const topHtml=isChanged
        ? `<span class="borrow-old">${esc(original)}</span><span class="borrow-new">${esc(working)}</span>`
        : (working!==undefined?esc(working):'&nbsp;');
      return `<div class="anim-column ${active?'active':''} ${isChanged?'regrouped':''}">
        <div class="anim-carry borrow-note ${isChanged?'visible':''}">${isChanged?'regroup':'&nbsp;'}</div>
        <div class="anim-top borrow-top">${topHtml}</div>
        <div class="anim-bottom">${bottom[leftIndex].trim()?esc(bottom[leftIndex]):'&nbsp;'}</div>
        <div class="anim-answer ${answer!==''?'visible':''}">${answer!==''?esc(answer):'&nbsp;'}</div>
      </div>`;
    }).join('');

    return `<div class="subtraction-animation" data-frame="${index}">
      <div class="animation-workspace" aria-label="Animated column subtraction">
        <div class="anim-operator">−</div>
        <div class="anim-columns">${cols}</div>
      </div>
      <div class="animation-explanation">
        <strong>${esc(frame.title)}</strong>
        <div>${esc(frame.text)}</div>
      </div>
      <div class="animation-progress">Step ${index+1} of ${model.frames.length}</div>
    </div>`;
  };


  AR.buildMultiplicationFrames=(a,b)=>{
    a=Number(a); b=Number(b);
    const result=a*b;
    const aDigits=String(a).split('').reverse().map(Number);
    const multiplierDigits=String(b).split('').reverse().map(Number);
    const partials=multiplierDigits.map((digit,pos)=>({
      digit,
      pos,
      base:a*digit,
      shifted:a*digit*Math.pow(10,pos)
    }));
    const width=Math.max(String(result).length,String(a).length+multiplierDigits.length-1,String(b).length+1);
    const completedRows=partials.map(p=>{
      const arr=[];
      String(p.shifted).split('').reverse().forEach((d,i)=>arr[i]=Number(d));
      return arr;
    });

    const frames=[{
      mode:'multiplication',
      title:'Set up the multiplication',
      text:'Line up the factors by place value. Start with the ones digit of the bottom number and multiply from right to left across the top number.',
      activeMultiplierPos:null,
      activeMultiplicandPos:null,
      rowDigits:partials.map(()=>[]),
      currentRow:null,
      carryUsedAt:null,
      carryUsedValue:null,
      carryNextAt:null,
      carryNextValue:null,
      showSum:false,
      completed:false
    }];

    partials.forEach((part,rowIndex)=>{
      const workingRows=completedRows.map((row,i)=>i<rowIndex?[...row]:[]);
      const current=[];
      // A tens/hundreds multiplier shifts the partial product left. Show the
      // placeholder zero(s) before beginning the digit-by-digit multiplication.
      for(let z=0;z<part.pos;z++) current[z]=0;
      workingRows[rowIndex]=[...current];
      const name=placeName(part.pos);
      if(part.pos>0){
        frames.push({
          mode:'multiplication',
          title:`Set the ${name} place`,
          text:`The bottom digit ${part.digit} is in the ${name} place, so this partial product is shifted ${part.pos} place${part.pos===1?'':'s'} to the left. Put ${part.pos===1?'a zero':'zeros'} in the empty place${part.pos===1?'':'s'} first.`,
          activeMultiplierPos:part.pos,
          activeMultiplicandPos:null,
          rowDigits:workingRows.map(r=>[...r]),
          currentRow:rowIndex,
          carryUsedAt:null,
          carryUsedValue:null,
          carryNextAt:null,
          carryNextValue:null,
          showSum:false,
          completed:false
        });
      }

      let carry=0;
      for(let aPos=0;aPos<aDigits.length;aPos++){
        const topDigit=aDigits[aPos];
        const incoming=carry;
        const total=topDigit*part.digit+incoming;
        const writeDigit=total%10;
        const nextCarry=Math.floor(total/10);
        current[aPos+part.pos]=writeDigit;
        workingRows[rowIndex]=[...current];
        const topPlace=placeName(aPos);
        const carryPhrase=incoming?` + ${incoming} carried`:'';
        const carryAction=nextCarry
          ? (aPos+1<aDigits.length
              ? ` Write ${writeDigit} in the partial product and carry ${nextCarry} above the next top digit.`
              : ` Write ${writeDigit} in the partial product and carry ${nextCarry} to the next place on the left.`)
          : ` Write ${writeDigit} in the partial product.`;
        frames.push({
          mode:'multiplication',
          title:`Multiply the ${topPlace}`,
          text:`${topDigit} × ${part.digit}${carryPhrase} = ${total}.${carryAction}`,
          activeMultiplierPos:part.pos,
          activeMultiplicandPos:aPos,
          rowDigits:workingRows.map(r=>[...r]),
          currentRow:rowIndex,
          carryUsedAt:incoming?aPos:null,
          carryUsedValue:incoming||null,
          carryNextAt:nextCarry ? aPos+1 : null,
          carryNextValue:nextCarry || null,
          pendingFinalCarry:nextCarry && aPos===aDigits.length-1 ? nextCarry : null,
          showSum:false,
          completed:false
        });
        carry=nextCarry;
      }

      if(carry){
        current[aDigits.length+part.pos]=carry;
        workingRows[rowIndex]=[...current];
        frames.push({
          mode:'multiplication',
          title:'Write the final carry',
          text:`There are no more top digits to multiply in this row, so write the carried ${carry} at the left of the partial product.`,
          activeMultiplierPos:part.pos,
          activeMultiplicandPos:null,
          rowDigits:workingRows.map(r=>[...r]),
          currentRow:rowIndex,
          carryUsedAt:null,
          carryUsedValue:null,
          carryNextAt:null,
          carryNextValue:null,
          showSum:false,
          completed:false
        });
      }
    });

    frames.push({
      mode:'multiplication',
      title:'Add the partial products',
      text:`Add ${partials.map(p=>p.shifted).join(' + ')} = ${result}.`,
      activeMultiplierPos:null,
      activeMultiplicandPos:null,
      rowDigits:completedRows.map(r=>[...r]),
      currentRow:null,
      carryUsedAt:null,
      carryUsedValue:null,
      carryNextAt:null,
      carryNextValue:null,
      showSum:true,
      completed:false
    });

    frames.push({
      mode:'multiplication',
      title:'Complete the multiplication',
      text:`The final product is ${result}.`,
      activeMultiplierPos:null,
      activeMultiplicandPos:null,
      rowDigits:completedRows.map(r=>[...r]),
      currentRow:null,
      carryUsedAt:null,
      carryUsedValue:null,
      carryNextAt:null,
      carryNextValue:null,
      showSum:true,
      completed:true
    });

    return {type:'column-multiplication',a,b,result,width,partials,frames};
  };

  AR.renderMultiplication=(model,index=0)=>{
    const frame=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const width=model.width;
    const topDigits=String(model.a).split('').reverse().map(Number);
    const bottomDigits=String(model.b).split('').reverse().map(Number);
    const cells=(values,cellClass='')=>Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      const value=values?.[fromRight];
      return `<span class="mult-cell ${cellClass}">${value===undefined||value===null?'&nbsp;':esc(value)}</span>`;
    }).join('');

    const carryCells=Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      let value='', cls='';
      if(frame.carryUsedAt===fromRight){value=frame.carryUsedValue;cls='used';}
      if(frame.carryNextAt===fromRight){value=frame.carryNextValue;cls='next';}
      return `<span class="mult-carry-cell ${cls}">${value!==''&&value!==null?esc(value):'&nbsp;'}</span>`;
    }).join('');

    const topCells=Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      const value=topDigits[fromRight];
      const active=frame.activeMultiplicandPos===fromRight;
      return `<span class="mult-cell top-digit ${active?'active-top-digit':''}">${value===undefined?'&nbsp;':esc(value)}</span>`;
    }).join('');

    const bottomCells=Array.from({length:width},(_,leftIndex)=>{
      const fromRight=width-1-leftIndex;
      const value=bottomDigits[fromRight];
      const active=frame.activeMultiplierPos===fromRight;
      return `<span class="mult-cell bottom-digit ${active?'active-digit':''}">${value===undefined?'&nbsp;':esc(value)}</span>`;
    }).join('');

    const partialRows=model.partials.map((part,rowIndex)=>{
      const row=frame.rowDigits?.[rowIndex]||[];
      const rowCells=Array.from({length:width},(_,leftIndex)=>{
        const fromRight=width-1-leftIndex;
        const value=row[fromRight];
        const isActive=frame.currentRow===rowIndex && frame.activeMultiplicandPos!==null && fromRight===frame.activeMultiplicandPos+part.pos;
        return `<span class="mult-cell partial-digit ${isActive?'active-partial-digit':''}">${value===undefined?'&nbsp;':esc(value)}</span>`;
      }).join('');
      const visible=row.some(v=>v!==undefined);
      return `<div class="mult-grid-row partial-row ${visible?'visible':''} ${frame.currentRow===rowIndex?'current':''}"><span class="mult-op-space">&nbsp;</span><div class="mult-grid">${rowCells}</div></div>`;
    }).join('');

    const resultDigits=String(model.result).split('').reverse().map(Number);
    return `<div class="multiplication-animation" data-frame="${index}">
      <div class="multiplication-workspace" aria-label="Animated long multiplication with carrying">
        <div class="mult-grid-row carry-row"><span class="mult-op-space">&nbsp;</span><div class="mult-grid">${carryCells}</div></div>
        <div class="mult-grid-row"><span class="mult-op-space">&nbsp;</span><div class="mult-grid">${topCells}</div></div>
        <div class="mult-grid-row factor-row"><span class="mult-op">×</span><div class="mult-grid">${bottomCells}</div></div>
        <div class="mult-rule"></div>
        ${partialRows}
        ${frame.showSum?`<div class="mult-rule light"></div><div class="mult-grid-row total-row"><span class="mult-op-space">&nbsp;</span><div class="mult-grid">${cells(resultDigits,'total-digit')}</div></div>`:''}
      </div>
      <div class="animation-explanation">
        <strong>${esc(frame.title)}</strong>
        <div>${esc(frame.text)}</div>
      </div>
      <div class="animation-progress">Step ${index+1} of ${model.frames.length}</div>
    </div>`;
  };



  AR.buildDivisionFrames=(dividend,divisor)=>{
    dividend=Number(dividend); divisor=Number(divisor);
    const digits=String(dividend).split('').map(Number);
    const entries=[];
    const quotientCells={};
    let current=0, started=false, remainder=0;

    for(let i=0;i<digits.length;i++){
      current = remainder*10 + digits[i];
      if(!started && current<divisor){
        remainder=current;
        continue;
      }
      started=true;
      const qdigit=Math.floor(current/divisor);
      const product=qdigit*divisor;
      const rem=current-product;
      const startIndex=Math.max(0,i-String(current).length+1);
      entries.push({index:entries.length,endIndex:i,startIndex,current,qdigit,product,remainder:rem,nextDigit:i<digits.length-1?digits[i+1]:null});
      quotientCells[i]=qdigit;
      remainder=rem;
    }

    const quotient=Math.floor(dividend/divisor), finalRemainder=dividend%divisor;
    const frames=[{
      mode:'division', stage:'setup', entryIndex:-1,
      title:'Set up the long division',
      text:`Write ${dividend} inside the division bracket and ${divisor} outside. Start at the left and find the first part that ${divisor} can divide.`,
      completed:false
    }];

    entries.forEach((e,idx)=>{
      frames.push({
        mode:'division',stage:'divide',entryIndex:idx,
        title:'Divide',
        text:`How many times does ${divisor} fit into ${e.current}? It fits ${e.qdigit} time${e.qdigit===1?'':'s'}. Write ${e.qdigit} above the ${placeName(digits.length-1-e.endIndex)} place.`,
        completed:false
      });
      frames.push({
        mode:'division',stage:'multiply',entryIndex:idx,
        title:'Multiply',
        text:`Multiply the quotient digit by the divisor: ${e.qdigit} × ${divisor} = ${e.product}. Write ${e.product} underneath ${e.current}.`,
        completed:false
      });
      frames.push({
        mode:'division',stage:'subtract',entryIndex:idx,
        title:'Subtract',
        text:`Subtract: ${e.current} − ${e.product} = ${e.remainder}.`,
        completed:false
      });
      if(e.nextDigit!==null){
        const nextCurrent=e.remainder*10+e.nextDigit;
        frames.push({
          mode:'division',stage:'bring',entryIndex:idx,
          title:'Bring down the next digit',
          text:`Bring down the next digit, ${e.nextDigit}. The new partial dividend is ${nextCurrent}.`,
          completed:false
        });
      }
    });

    frames.push({
      mode:'division',stage:'complete',entryIndex:entries.length-1,
      title:'Complete the division',
      text:finalRemainder?`The quotient is ${quotient} with remainder ${finalRemainder}.`:`The quotient is ${quotient} with no remainder.`,
      completed:true
    });

    return {type:'long-division',dividend,divisor,quotient,remainder:finalRemainder,digits,entries,quotientCells,frames};
  };

  AR.renderDivision=(model,index=0)=>{
    const frame=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const width=model.digits.length;
    const currentEntry=frame.entryIndex>=0?model.entries[frame.entryIndex]:null;
    const visibleThrough=frame.entryIndex;
    const qCells=Array.from({length:width},(_,i)=>{
      const entryIndex=model.entries.findIndex(e=>e.endIndex===i);
      const visible=entryIndex>=0 && (entryIndex<visibleThrough || entryIndex===visibleThrough || frame.completed);
      const active=currentEntry?.endIndex===i && frame.stage==='divide';
      const val=visible?model.quotientCells[i]:'';
      return `<span class="div-cell quotient ${active?'active':''}">${val!==''?esc(val):'&nbsp;'}</span>`;
    }).join('');

    const dividendCells=model.digits.map((d,i)=>{
      const inCurrent=currentEntry && i>=currentEntry.startIndex && i<=currentEntry.endIndex;
      const bringActive=currentEntry && frame.stage==='bring' && i===currentEntry.endIndex+1;
      return `<span class="div-cell dividend ${inCurrent?'active-partial':''} ${bringActive?'bring-active':''}">${esc(d)}</span>`;
    }).join('');

    const renderPaperNumber=(value,endIndex,{sign='',cls='',highlightLast=false,padZeroesTo=0}={})=>{
      const raw=String(value);
      const str=(padZeroesTo && raw==='0')?raw.padStart(padZeroesTo,'0'):raw;
      const start=Math.max(0,endIndex-str.length+1);
      const cells=Array.from({length:width},(_,i)=>{
        const pos=i-start;
        const ch=(i>=start && i<start+str.length)?str[pos]:'&nbsp;';
        const active=highlightLast && i===endIndex;
        return `<span class="paper-digit ${active?'bring-digit':''}">${ch==='&nbsp;'?ch:esc(ch)}</span>`;
      }).join('');
      return `<div class="division-paper-row ${cls}"><span class="paper-sign">${sign?esc(sign):'&nbsp;'}</span><div class="division-grid paper-grid">${cells}</div></div>`;
    };

    const renderUnderline=(fromIndex,toIndex,cls='')=>{
      const cells=Array.from({length:width},(_,i)=>`<span class="paper-digit underline-digit ${(i>=fromIndex && i<=toIndex)?'on':''}">&nbsp;</span>`).join('');
      return `<div class="division-paper-row underline-row ${cls}"><span class="paper-sign">&nbsp;</span><div class="division-grid paper-grid">${cells}</div></div>`;
    };

    const paperRows=[];
    model.entries.forEach((e,idx)=>{
      if(idx>visibleThrough && !frame.completed) return;
      const isCurrent=idx===visibleThrough;
      const stage=isCurrent?frame.stage:'done';
      const showProduct=frame.completed || idx<visibleThrough || (isCurrent && ['multiply','subtract','bring'].includes(frame.stage));
      const showSubtract=frame.completed || idx<visibleThrough || (isCurrent && ['subtract','bring','complete'].includes(frame.stage));
      const nextEntry=model.entries[idx+1]||null;
      const productStart=Math.max(0,e.endIndex-String(e.product).length+1);
      if(showProduct){
        paperRows.push(renderPaperNumber(e.product,e.endIndex,{sign:'−',cls:isCurrent&&stage==='multiply'?'current-work':''}));
        paperRows.push(renderUnderline(productStart,e.endIndex,isCurrent&&stage==='multiply'?'current-underline':''));
      }
      if(showSubtract){
        if(nextEntry && (frame.completed || idx<visibleThrough || stage==='bring')){
          paperRows.push(renderPaperNumber(nextEntry.current,nextEntry.endIndex,{cls:isCurrent&&stage==='bring'?'current-work bring-row':'',highlightLast:isCurrent&&stage==='bring'}));
        } else {
          const padZeroesTo=(e.remainder===0 && String(e.current).length>1)?String(e.current).length:0;
          paperRows.push(renderPaperNumber(e.remainder,e.endIndex,{cls:isCurrent&&stage==='subtract'?'current-work':'' ,padZeroesTo}));
        }
      }
    });

    const stageBadge=frame.stage==='setup'?'START':frame.stage==='divide'?'DIVIDE':frame.stage==='multiply'?'MULTIPLY':frame.stage==='subtract'?'SUBTRACT':frame.stage==='bring'?'BRING DOWN':'DONE';
    return `<div class="division-animation" data-frame="${index}">
      <div class="division-workspace paper-style" aria-label="Animated long division">
        <div class="division-stage-badge">${esc(stageBadge)}</div>
        <div class="division-top-row"><span class="division-spacer"></span><div class="division-grid">${qCells}</div></div>
        <div class="division-main-row"><span class="division-divisor">${esc(model.divisor)}</span><div class="division-bracket"><div class="division-grid">${dividendCells}</div></div></div>
        <div class="division-paper">${paperRows.join('')||'<div class="division-placeholder">Work will appear here one step at a time.</div>'}</div>
        ${frame.completed?`<div class="division-final">${model.dividend} ÷ ${model.divisor} = ${model.quotient}${model.remainder?` R${model.remainder}`:''}</div>`:''}
      </div>
      <div class="animation-explanation">
        <strong>${esc(frame.title)}</strong>
        <div>${esc(frame.text)}</div>
      </div>
      <div class="animation-progress">Step ${index+1} of ${model.frames.length}</div>
    </div>`;
  };


  // Chapter 1: place value, comparison, ordering, and rounding animations.
  const chapter1PlaceNames=['ones','tens','hundreds','thousands','ten thousands','hundred thousands'];
  const chapter1PlaceLabel=pos=>chapter1PlaceNames[pos]||`10^${pos}`;
  const chapter1PlaceValue=pos=>10**pos;

  AR.buildWordToNumeralFrames=(n,words)=>{
    const digits=String(n).split('').map(Number), width=digits.length;
    const frames=[{stage:'setup',title:'Start with a place-value chart',text:`Read “${words}” from the largest place value to the smallest.`,visible:0,active:null}];
    digits.forEach((d,i)=>{
      const pos=width-1-i;
      frames.push({stage:'reveal',title:`Fill the ${chapter1PlaceLabel(pos)} place`,text:`The digit in the ${chapter1PlaceLabel(pos)} place is ${d}.`,visible:i+1,active:i});
    });
    frames.push({stage:'complete',title:'Write the numeral',text:`Reading the digits from left to right gives ${A.Math.Utils.formatNumber(n)}.`,visible:width,active:null,completed:true});
    return {type:'word-to-numeral',n,words,digits,width,frames};
  };

  AR.buildNumeralToWordFrames=(n,words)=>{
    const digits=String(n).split('').map(Number), width=digits.length;
    const thousands=Math.floor(n/1000), remainder=n%1000;
    const frames=[{stage:'setup',title:'Read the numeral by place value',text:`Start with ${A.Math.Utils.formatNumber(n)} and separate it into place-value groups.`,activeRange:null,built:''}];
    let built='';
    if(thousands){
      built=`${A.Math.Utils.numberToWords(thousands)} thousand`;
      frames.push({stage:'group',title:'Read the thousands group',text:`The thousands group is ${thousands}, so say “${A.Math.Utils.numberToWords(thousands)} thousand.”`,activeRange:[0,Math.max(0,width-4)],built});
    }
    if(remainder){
      const remWords=A.Math.Utils.numberToWords(remainder);
      built=(built?built+' ':'')+remWords;
      frames.push({stage:'group',title:'Read the remaining group',text:`The remaining digits make ${remainder}, which is read as “${remWords}.”`,activeRange:[Math.max(0,width-3),width-1],built});
    }
    frames.push({stage:'complete',title:'Combine the words',text:`The complete word number is “${words}.”`,activeRange:null,built:words,completed:true});
    return {type:'numeral-to-word',n,words,digits,width,frames};
  };

  AR.buildPlaceValueFrames=(n,targetIndex,value)=>{
    const digits=String(n).split('').map(Number), width=digits.length;
    const pos=width-1-targetIndex, digit=digits[targetIndex], place=chapter1PlaceValue(pos);
    const frames=[
      {stage:'setup',title:'Find the digit',text:`Place ${A.Math.Utils.formatNumber(n)} into a place-value chart.`,active:null},
      {stage:'highlight',title:`Locate the ${chapter1PlaceLabel(pos)} place`,text:`The digit ${digit} is in the ${chapter1PlaceLabel(pos)} place.`,active:targetIndex},
      {stage:'calculate',title:'Find the value of the digit',text:`${digit} × ${A.Math.Utils.formatNumber(place)} = ${A.Math.Utils.formatNumber(value)}.`,active:targetIndex,calculation:true},
      {stage:'complete',title:'State the value',text:`The value of the digit ${digit} is ${A.Math.Utils.formatNumber(value)}.`,active:targetIndex,calculation:true,completed:true}
    ];
    return {type:'place-value',n,digits,width,targetIndex,pos,digit,place,value,frames};
  };

  AR.buildExpandedFormFrames=(n)=>{
    const digits=String(n).split('').map(Number), width=digits.length;
    const terms=[];
    digits.forEach((d,i)=>{const pos=width-1-i;if(d)terms.push({index:i,digit:d,pos,value:d*chapter1PlaceValue(pos)});});
    const frames=[{stage:'setup',title:'Look at each place value',text:`Start with ${A.Math.Utils.formatNumber(n)}. Each non-zero digit contributes one term.`,visibleTerms:0,active:null}];
    terms.forEach((t,i)=>frames.push({stage:'term',title:`Convert the ${chapter1PlaceLabel(t.pos)} digit`,text:`${t.digit} × ${A.Math.Utils.formatNumber(chapter1PlaceValue(t.pos))} = ${A.Math.Utils.formatNumber(t.value)}.`,visibleTerms:i+1,active:t.index}));
    frames.push({stage:'complete',title:'Combine the place values',text:`${A.Math.Utils.formatNumber(n)} = ${terms.map(t=>A.Math.Utils.formatNumber(t.value)).join(' + ')}.`,visibleTerms:terms.length,active:null,completed:true});
    return {type:'expanded-form',n,digits,width,terms,frames};
  };

  AR.buildCompareFrames=(a,b)=>{
    const width=Math.max(String(a).length,String(b).length);
    const ad=String(a).padStart(width,'0').split('').map(Number), bd=String(b).padStart(width,'0').split('').map(Number);
    const frames=[{stage:'setup',title:'Compare from the left',text:'Start with the greatest place value and move right until the digits are different.',active:null,symbol:''}];
    let found=false,symbol=a===b?'=':a>b?'>':'<';
    for(let i=0;i<width;i++){
      const pos=width-1-i;
      if(ad[i]===bd[i]){
        frames.push({stage:'compare',title:`Compare the ${chapter1PlaceLabel(pos)} digits`,text:`${ad[i]} and ${bd[i]} are equal, so move one place to the right.`,active:i,symbol:''});
      } else {
        frames.push({stage:'compare',title:`Compare the ${chapter1PlaceLabel(pos)} digits`,text:`${ad[i]} ${ad[i]>bd[i]?'>':'<'} ${bd[i]}. This is the first place where the numbers differ, so it decides the comparison.`,active:i,symbol});
        found=true; break;
      }
    }
    if(!found) frames.push({stage:'compare',title:'All digits match',text:'Every place-value digit is the same, so the numbers are equal.',active:null,symbol:'='});
    frames.push({stage:'complete',title:'Write the comparison',text:`${A.Math.Utils.formatNumber(a)} ${symbol} ${A.Math.Utils.formatNumber(b)}.`,active:null,symbol,completed:true});
    return {type:'compare-numbers',a,b,width,ad,bd,symbol,frames};
  };

  AR.buildOrderFrames=(nums,ascending)=>{
    const ordered=[...nums].sort((a,b)=>ascending?a-b:b-a);
    const frames=[{stage:'setup',title:`Order from ${ascending?'smallest to largest':'largest to smallest'}`,text:'Compare the numbers by their greatest place values first.',placed:[]}];
    ordered.forEach((n,i)=>frames.push({stage:'place',title:`Choose number ${i+1}`,text:`${A.Math.Utils.formatNumber(n)} is the ${ascending?'next smallest':'next largest'} number, so place it next in the order.`,placed:ordered.slice(0,i+1),active:n}));
    frames.push({stage:'complete',title:'Complete the order',text:`Correct order: ${ordered.map(A.Math.Utils.formatNumber).join(', ')}.`,placed:ordered,active:null,completed:true});
    return {type:'order-numbers',nums,ordered,ascending,frames};
  };

  AR.buildRoundingFrames=(n,place,answer)=>{
    const digits=String(n).split('').map(Number), width=digits.length;
    const pos=Math.round(Math.log10(place));
    const targetIndex=width-1-pos;
    const rightIndex=targetIndex+1;
    const rightDigit=rightIndex<width?digits[rightIndex]:0;
    const frames=[
      {stage:'setup',title:`Round to the nearest ${chapter1PlaceLabel(pos)}`,text:`Start with ${A.Math.Utils.formatNumber(n)} and find the ${chapter1PlaceLabel(pos)} digit.`,target:targetIndex,right:null,result:null},
      {stage:'target',title:'Find the rounding digit',text:`The rounding digit is ${digits[targetIndex]} in the ${chapter1PlaceLabel(pos)} place.`,target:targetIndex,right:null,result:null},
      {stage:'inspect',title:'Look one place to the right',text:`The digit to the right is ${rightDigit}. ${rightDigit>=5?'It is 5 or greater, so round up.':'It is less than 5, so keep the rounding digit the same.'}`,target:targetIndex,right:rightIndex,result:null},
      {stage:'complete',title:'Write the rounded number',text:`Replace the digits to the right with zero${rightDigit>=5?' after increasing the rounding digit by 1':''}. The result is ${A.Math.Utils.formatNumber(answer)}.`,target:targetIndex,right:rightIndex,result:answer,completed:true}
    ];
    return {type:'rounding',n,place,answer,digits,width,pos,targetIndex,rightIndex,rightDigit,frames};
  };

  AR.buildEstimateFrames=(a,b,place,ra,rb,answer)=>{
    const frames=[
      {stage:'setup',title:'Estimate by rounding',text:`Round both numbers to the nearest ${chapter1PlaceLabel(Math.round(Math.log10(place)))} before adding.`,showA:false,showB:false,showSum:false},
      {stage:'round-a',title:`Round ${a}`,text:`${a} rounds to ${ra}.`,showA:true,showB:false,showSum:false},
      {stage:'round-b',title:`Round ${b}`,text:`${b} rounds to ${rb}.`,showA:true,showB:true,showSum:false},
      {stage:'complete',title:'Add the rounded numbers',text:`${ra} + ${rb} = ${answer}. The estimated sum is ${answer}.`,showA:true,showB:true,showSum:true,completed:true}
    ];
    return {type:'estimate-sum',a,b,place,ra,rb,answer,frames};
  };

  function renderPlaceChart(digits,{active=null,visible=null,target=null,right=null}={}){
    const width=digits.length;
    const heads=digits.map((_,i)=>`<div class="pv-head">${esc(chapter1PlaceLabel(width-1-i))}</div>`).join('');
    const cells=digits.map((d,i)=>{
      const isVisible=visible===null || i<visible;
      const classes=['pv-cell'];
      if(i===active)classes.push('active');
      if(i===target)classes.push('target');
      if(i===right)classes.push('right-check');
      return `<div class="${classes.join(' ')}">${isVisible?esc(d):'?'}</div>`;
    }).join('');
    return `<div class="pv-chart"><div class="pv-row pv-head-row">${heads}</div><div class="pv-row">${cells}</div></div>`;
  }

  AR.renderWordToNumeral=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="chapter1-animation"><div class="c1-source-word">${esc(model.words)}</div>${renderPlaceChart(model.digits,{active:f.active,visible:f.visible})}${f.completed?`<div class="c1-result">${esc(A.Math.Utils.formatNumber(model.n))}</div>`:''}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderNumeralToWord=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const range=f.activeRange;
    const cells=model.digits.map((d,i)=>`<div class="pv-cell ${range&&i>=range[0]&&i<=range[1]?'active':''}">${esc(d)}</div>`).join('');
    const heads=model.digits.map((_,i)=>`<div class="pv-head">${esc(chapter1PlaceLabel(model.width-1-i))}</div>`).join('');
    return `<div class="chapter1-animation"><div class="pv-chart"><div class="pv-row pv-head-row">${heads}</div><div class="pv-row">${cells}</div></div><div class="c1-word-build">${f.built?esc(f.built):'Words will appear here.'}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderPlaceValue=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="chapter1-animation">${renderPlaceChart(model.digits,{active:f.active})}${f.calculation?`<div class="c1-equation">${model.digit} × ${A.Math.Utils.formatNumber(model.place)} = <strong>${A.Math.Utils.formatNumber(model.value)}</strong></div>`:''}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderExpandedForm=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const visible=model.terms.slice(0,f.visibleTerms||0);
    return `<div class="chapter1-animation">${renderPlaceChart(model.digits,{active:f.active})}<div class="expanded-term-row">${visible.length?visible.map(t=>`<span class="expanded-chip">${A.Math.Utils.formatNumber(t.value)}</span>`).join('<span class="expanded-plus">+</span>'):'Place-value terms will appear here.'}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderCompare=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const row=(digits)=>digits.map((d,i)=>`<span class="compare-digit ${i===f.active?'active':''}">${esc(d)}</span>`).join('');
    return `<div class="chapter1-animation"><div class="compare-board"><div>${row(model.ad)}</div><div class="compare-symbol">${f.symbol?esc(f.symbol):'□'}</div><div>${row(model.bd)}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderOrder=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const original=model.nums.map(n=>`<span class="number-card ${f.active===n?'active':''}">${esc(A.Math.Utils.formatNumber(n))}</span>`).join('');
    const placed=f.placed.map(n=>`<span class="number-card placed">${esc(A.Math.Utils.formatNumber(n))}</span>`).join('<span class="order-arrow">→</span>');
    return `<div class="chapter1-animation"><div class="order-label">Original numbers</div><div class="number-card-row">${original}</div><div class="order-label">${model.ascending?'Smallest → largest':'Largest → smallest'}</div><div class="number-card-row ordered-row">${placed||'<span class="order-placeholder">Numbers will move here one at a time.</span>'}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderRounding=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="chapter1-animation">${renderPlaceChart(model.digits,{target:f.target,right:f.right})}${f.result!==null?`<div class="rounding-result"><span>${esc(A.Math.Utils.formatNumber(model.n))}</span><span class="round-arrow">→</span><strong>${esc(A.Math.Utils.formatNumber(f.result))}</strong></div>`:''}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.renderEstimate=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="chapter1-animation"><div class="estimate-board"><div class="estimate-row"><span>${model.a}</span><span>→</span><strong>${f.showA?model.ra:'?'}</strong></div><div class="estimate-row"><span>${model.b}</span><span>→</span><strong>${f.showB?model.rb:'?'}</strong></div>${f.showSum?`<div class="estimate-sum">${model.ra} + ${model.rb} = <strong>${model.answer}</strong></div>`:''}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function fractionStripHtml(num,den,opts={}){
    const subdiv=opts.subdivide||1;
    const total=den*subdiv;
    const shaded=num*subdiv;
    const cells=Array.from({length:total},(_,i)=>{
      const major=((i+1)%subdiv===0);
      return `<span class="fraction-cell ${i<shaded?'shaded':''} ${major?'major':''}"></span>`;
    }).join('');
    return `<div class="fraction-strip-wrap"><div class="fraction-strip" style="grid-template-columns:repeat(${total}, minmax(0,1fr));">${cells}</div>${opts.label?`<div class="fraction-strip-label">${opts.label}</div>`:''}</div>`;
  }

  function hundredGridHtml(shaded,label='',opts={}){
    const previous=opts.previous??0;
    const cells=Array.from({length:100},(_,i)=>{
      const isShaded=i<shaded;
      const isNew=isShaded && i>=previous;
      return `<span class="grid100-cell ${isShaded?'shaded':''} ${isNew?'new-shade':''}"></span>`;
    }).join('');
    return `<div class="grid100-wrap"><div class="grid100">${cells}</div>${label?`<div class="grid100-label">${label}</div>`:''}</div>`;
  }

  function decimalLineHtml(left,right,value,opts={}){
    const pct=Math.max(0,Math.min(100,((value-left)/(right-left))*100));
    const precision=opts.precision??(Math.abs(right-left)<1?2:1);
    const ticks=Array.from({length:11},(_,i)=>{
      const v=left+(right-left)*(i/10);
      const label=(i%2===0)?Number(v.toFixed(precision)).toFixed(precision):'';
      return `<span class="round-tick ${opts.showTicks?'visible':''}" style="left:${i*10}%"><i></i>${label?`<b>${label}</b>`:''}</span>`;
    }).join('');
    const midpoint=(left+right)/2;
    const winner=opts.highlight==='left'?'left':opts.highlight==='right'?'right':'';
    return `<div class="number-line-wrap"><div class="number-line detailed">${ticks}<span class="line-end left ${winner==='left'?'winner':''}"></span><span class="line-end right ${winner==='right'?'winner':''}"></span>${opts.showPoint?`<span class="line-point animated" style="left:${pct}%"></span>`:''}${opts.showMidpoint?`<span class="midpoint-marker" style="left:50%"><i></i><b>${Number(midpoint.toFixed(precision)).toFixed(precision)}</b></span>`:''}</div><div class="number-line-labels detailed"><span>${Number(left.toFixed(precision)).toFixed(precision)}</span>${opts.showPoint?`<span class="current-number">${value.toFixed(2)}</span>`:'<span></span>'}<span>${Number(right.toFixed(precision)).toFixed(precision)}</span></div></div>`;
  }

  function progressValues(target,chunk=10){
    const vals=[0];
    for(let v=chunk;v<target;v+=chunk) vals.push(v);
    if(target>0) vals.push(target);
    return [...new Set(vals)];
  }

  AR.buildFractionOfWholeFrames=(n,d)=>({type:'fraction-of-whole',n,d,frames:[
    {title:'See the whole',text:`The bar is divided into ${d} equal parts.`,stage:'whole'},
    {title:'Shade the parts',text:`${n} of the ${d} equal parts are shaded.`,stage:'shaded'},
    {title:'Name the fraction',text:`Shaded parts over total parts gives the fraction ${n}/${d}.`,stage:'fraction'},
    {title:'Final answer',text:`The shaded fraction is ${n}/${d}.`,stage:'final'}
  ]});

  AR.renderFractionOfWhole=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const shown=(f.stage==='whole')?0:model.n;
    const bar=fractionStripHtml(shown,model.d,{label:`${shown}/${model.d} parts shaded`});
    const frac=(f.stage==='fraction'||f.stage==='final')?`<div class="fraction-visual-answer">${model.n}/${model.d}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${bar}${frac}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildEquivalentFractionFrames=(n,d,k,targetN,targetD)=>({type:'equivalent-fraction',n,d,k,targetN,targetD,frames:[
    {title:'Start with the original fraction',text:`Show ${n}/${d} as a fraction bar.`,stage:'original'},
    {title:'Find the scale factor',text:`${d} × ${k} = ${targetD}. The denominator was multiplied by ${k}.`,stage:'denominator'},
    {title:'Multiply the numerator too',text:`${n} × ${k} = ${targetN}. Multiply the numerator by the same number.`,stage:'numerator'},
    {title:'Split each part',text:`Each original part is now split into ${k} smaller equal parts.`,stage:'split'},
    {title:'Final answer',text:`${n}/${d} = ${targetN}/${targetD}.`,stage:'final'}
  ]});

  AR.renderEquivalentFraction=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const original=fractionStripHtml(model.n,model.d,{label:`${model.n}/${model.d}`});
    const showSplit=['split','final'].includes(f.stage);
    const split=fractionStripHtml(model.n,model.d,{subdivide:model.k,label:`${model.targetN}/${model.targetD}`});
    const right=showSplit?split:fractionStripHtml(0,model.d,{label:'same whole'});
    let callout='';
    if(f.stage==='denominator') callout=`<div class="fraction-calc-card"><strong>Denominator</strong><span>${model.d} × ${model.k} = ${model.targetD}</span></div>`;
    if(f.stage==='numerator') callout=`<div class="fraction-calc-card"><strong>Numerator</strong><span>${model.n} × ${model.k} = ${model.targetN}</span></div>`;
    if(f.stage==='split'||f.stage==='final') callout=`<div class="fraction-calc-row"><span>${model.d} × ${model.k} = ${model.targetD}</span><span>${model.n} × ${model.k} = ${model.targetN}</span></div>`;
    const equation=f.stage==='final'?`<div class="fraction-equation-big">${model.n}/${model.d} = ${model.targetN}/${model.targetD}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board"><div class="fraction-stage-pair">${original}<div class="fraction-arrow ${f.stage==='original'?'hidden':''}">→</div>${right}</div>${callout}${equation}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildFractionCompareFrames=(n1,d1,n2,d2,sym,lcm)=>{
    const f1=lcm/d1, f2=lcm/d2;
    const frames=[{title:'Show both fractions',text:'Start by seeing both fractions as bars.',stage:'original'}];
    if(d1!==d2){
      frames.push({title:'Convert the first fraction',text:`Multiply ${n1} × ${f1} = ${n1*f1} and ${d1} × ${f1} = ${lcm}.`,stage:'first'});
      frames.push({title:'Convert the second fraction',text:`Multiply ${n2} × ${f2} = ${n2*f2} and ${d2} × ${f2} = ${lcm}.`,stage:'second'});
    }
    frames.push({title:'Compare equal-sized pieces',text:`Now compare ${n1*f1}/${lcm} and ${n2*f2}/${lcm}.`,stage:'compare'});
    frames.push({title:'Final answer',text:`${n1}/${d1} ${sym} ${n2}/${d2}.`,stage:'final'});
    return {type:'fraction-compare',n1,d1,n2,d2,sym,lcm,f1,f2,frames};
  };

  AR.renderFractionCompare=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const convA=model.n1*model.f1, convB=model.n2*model.f2;
    const origA=fractionStripHtml(model.n1,model.d1,{label:`${model.n1}/${model.d1}`});
    const origB=fractionStripHtml(model.n2,model.d2,{label:`${model.n2}/${model.d2}`});
    const commonA=fractionStripHtml(convA,model.lcm,{label:`${convA}/${model.lcm}`});
    const commonB=fractionStripHtml(convB,model.lcm,{label:`${convB}/${model.lcm}`});
    const firstConverted=['first','second','compare','final'].includes(f.stage) && model.d1!==model.d2;
    const secondConverted=['second','compare','final'].includes(f.stage) && model.d1!==model.d2;
    let calc='';
    if(f.stage==='first') calc=`<div class="fraction-calc-card"><strong>First fraction</strong><span>${model.n1} × ${model.f1} = ${convA}</span><span>${model.d1} × ${model.f1} = ${model.lcm}</span></div>`;
    if(f.stage==='second') calc=`<div class="fraction-calc-card"><strong>Second fraction</strong><span>${model.n2} × ${model.f2} = ${convB}</span><span>${model.d2} × ${model.f2} = ${model.lcm}</span></div>`;
    if(['compare','final'].includes(f.stage) && model.d1!==model.d2) calc=`<div class="fraction-calc-row"><span>${model.n1} × ${model.f1} = ${convA}; ${model.d1} × ${model.f1} = ${model.lcm}</span><span>${model.n2} × ${model.f2} = ${convB}; ${model.d2} × ${model.f2} = ${model.lcm}</span></div>`;
    const answer=['compare','final'].includes(f.stage)?`<div class="fraction-compare-result">${model.n1}/${model.d1} <span>${model.sym}</span> ${model.n2}/${model.d2}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board"><div class="compare-bars"><div>${firstConverted?commonA:origA}</div><div>${secondConverted?commonB:origB}</div></div>${calc}${answer}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildDecimalRoundingFrames=(n,place,ans)=>{
    const unit=place===1?1:0.1;
    const precision=place===1?1:2;
    const left=Math.floor(n/unit)*unit;
    const right=Number((left+unit).toFixed(place===1?0:1));
    const midpoint=(left+right)/2;
    return {type:'decimal-rounding',n,place,ans,left:Number(left.toFixed(place===1?0:1)),right,midpoint,precision,frames:[
      {title:'Build the number line',text:`Divide the interval from ${left.toFixed(place===1?0:1)} to ${right.toFixed(place===1?0:1)} into 10 equal parts.`,stage:'ticks'},
      {title:'Place the decimal',text:`Put ${n.toFixed(2)} at its exact position on the number line.`,stage:'point'},
      {title:'Find the halfway point',text:`The halfway point is ${midpoint.toFixed(2)}.`,stage:'midpoint'},
      {title:'Choose the nearest value',text:`${n.toFixed(2)} is closer to ${ans}.`,stage:'decide'},
      {title:'Final answer',text:`Rounded answer: ${ans}.`,stage:'final'}
    ]};
  };

  AR.renderDecimalRounding=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const showPoint=['point','midpoint','decide','final'].includes(f.stage);
    const showMidpoint=['midpoint','decide','final'].includes(f.stage);
    const highlight=['decide','final'].includes(f.stage)?(model.ans===model.left?'left':'right'):'';
    const line=decimalLineHtml(model.left,model.right,model.n,{showTicks:true,showPoint,showMidpoint,highlight,precision:model.precision});
    const answer=f.stage==='final'?`<div class="fraction-visual-answer">${model.n.toFixed(2)} → ${model.ans}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${line}${answer}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildDecimalToFractionVisualFrames=(dec,hundredths,simpN,simpD)=>{
    const fills=progressValues(hundredths,10);
    const frames=[{title:'Start with an empty hundred grid',text:'The grid has 100 equal squares.',stage:'grid',filled:0,previous:0}];
    fills.slice(1).forEach((filled,i)=>frames.push({title:'Shade the hundredths',text:`Shade ${filled} of the 100 squares.`,stage:'grid',filled,previous:fills[i]}));
    frames.push({title:'Write the fraction',text:`${dec.toFixed(2)} = ${hundredths}/100.`,stage:'fraction',filled:hundredths,previous:hundredths});
    frames.push({title:'Simplify',text:`${hundredths}/100 = ${simpN}/${simpD}.`,stage:'simplify',filled:hundredths,previous:hundredths});
    frames.push({title:'Final answer',text:`Answer: ${simpN}/${simpD}.`,stage:'final',filled:hundredths,previous:hundredths});
    return {type:'decimal-to-fraction-visual',dec,hundredths,simpN,simpD,frames};
  };

  AR.renderDecimalToFractionVisual=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const grid=hundredGridHtml(f.filled,`${f.filled}/100 shaded`,{previous:f.previous});
    const frac=['fraction','simplify','final'].includes(f.stage)?`<div class="fraction-equation-big">${model.dec.toFixed(2)} = ${model.hundredths}/100</div>`:'';
    const simp=['simplify','final'].includes(f.stage)?`<div class="fraction-visual-answer">${model.simpN}/${model.simpD}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${grid}${frac}${simp}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildFractionToDecimalVisualFrames=(n,d,ans)=>{
    const hundredths=Math.round((n/d)*100);
    const fills=progressValues(hundredths,10);
    const frames=[{title:'Start with the fraction',text:`Show ${n}/${d} first.`,stage:'fraction',filled:0,previous:0}];
    fills.slice(1).forEach((filled,i)=>frames.push({title:'Build the equivalent hundred grid',text:`Shade ${filled} hundredths.`,stage:'grid',filled,previous:fills[i]}));
    frames.push({title:'Read the decimal',text:`${hundredths}/100 = ${ans}.`,stage:'decimal',filled:hundredths,previous:hundredths});
    frames.push({title:'Final answer',text:`Answer: ${ans}.`,stage:'final',filled:hundredths,previous:hundredths});
    return {type:'fraction-to-decimal-visual',n,d,ans,hundredths,frames};
  };

  AR.renderFractionToDecimalVisual=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const top=fractionStripHtml(model.n,model.d,{label:`${model.n}/${model.d}`});
    const grid=hundredGridHtml(f.filled,`${f.filled}/100 shaded`,{previous:f.previous});
    const dec=['decimal','final'].includes(f.stage)?`<div class="fraction-equation-big">${model.n}/${model.d} = ${model.ans}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${top}${grid}${dec}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildDecimalPercentVisualFrames=(mode,p,dec)=>{
    const fills=progressValues(p,10);
    const frames=[{title:'Start with a hundred grid',text:'The grid has 100 equal squares.',stage:'grid',filled:0,previous:0}];
    fills.slice(1).forEach((filled,i)=>frames.push({title:'Shade the percent',text:`Shade ${filled} of the 100 squares.`,stage:'grid',filled,previous:fills[i]}));
    frames.push({title:'Connect percent and fraction',text:`${p}% = ${p}/100.`,stage:'fraction',filled:p,previous:p});
    frames.push({title:'Connect the decimal',text:`${p}/100 = ${dec}.`,stage:'decimal',filled:p,previous:p});
    frames.push({title:'Final answer',text:mode==='decimal-to-percent'?`Answer: ${p}%`:`Answer: ${dec}.`,stage:'final',filled:p,previous:p});
    return {type:'decimal-percent-visual',mode,p,dec,frames};
  };

  AR.renderDecimalPercentVisual=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const grid=hundredGridHtml(f.filled,`${f.filled}% shaded`,{previous:f.previous});
    const showFrac=['fraction','decimal','final'].includes(f.stage);
    const showDec=['decimal','final'].includes(f.stage);
    const forms=showFrac?`<div class="percent-link-row"><span>${model.p}%</span><span>=</span><span>${model.p}/100</span>${showDec?`<span>=</span><span>${model.dec}</span>`:''}</div>`:'';
    const answer=f.stage==='final'?`<div class="fraction-visual-answer">${model.mode==='decimal-to-percent'?model.p+'%':String(model.dec)}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${grid}${forms}${answer}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  function decimalPlaceName(pos){ return ['hundredths','tenths','ones','tens','hundreds'][pos]||`10^${pos-2}`; }

  AR.buildDecimalAdditionFrames=(a,b)=>{
    const A0=Math.round(Number(a)*100), B0=Math.round(Number(b)*100), result=A0+B0;
    const width=Math.max(String(A0).length,String(B0).length,String(result).length,3);
    const frames=[{title:'Line up the decimal points',text:'Keep ones under ones, tenths under tenths, and hundredths under hundredths.',active:null,resultDigits:[],carries:{},completed:false}];
    let carry=0; const resultDigits=[]; const carries={};
    for(let pos=0;pos<width;pos++){
      const da=Math.floor(A0/10**pos)%10, db=Math.floor(B0/10**pos)%10, incoming=carry;
      const total=da+db+incoming, digit=total%10, nextCarry=Math.floor(total/10);
      resultDigits[pos]=digit; if(incoming)carries[pos]=incoming; if(nextCarry)carries[pos+1]=nextCarry; else delete carries[pos+1];
      frames.push({title:`Add the ${decimalPlaceName(pos)}`,text:`${da} + ${db}${incoming?` + ${incoming} carried`:''} = ${total}. Write ${digit}${nextCarry?` and carry ${nextCarry}`:''}.`,active:pos,resultDigits:[...resultDigits],carries:{...carries},completed:false});
      carry=nextCarry;
    }
    if(carry){resultDigits[width]=carry;frames.push({title:'Write the final carry',text:`Write the carried ${carry} to the left.`,active:width,resultDigits:[...resultDigits],carries:{},completed:false});}
    frames.push({title:'Final answer',text:`${Number(a).toFixed(2)} + ${Number(b).toFixed(2)} = ${(result/100).toFixed(2)}.`,active:null,resultDigits:String(result).split('').reverse().map(Number),carries:{},completed:true});
    return {type:'decimal-addition',a:Number(a),b:Number(b),result:result/100,width:Math.max(width,String(result).length),A0,B0,frames};
  };

  AR.buildDecimalSubtractionFrames=(a,b)=>{
    let A0=Math.round(Number(a)*100), B0=Math.round(Number(b)*100); if(B0>A0)[A0,B0]=[B0,A0];
    const result=A0-B0, width=Math.max(String(A0).length,String(B0).length,3);
    const work=String(A0).padStart(width,'0').split('').reverse().map(Number), bot=String(B0).padStart(width,'0').split('').reverse().map(Number), resultDigits=[];
    const frames=[{title:'Line up the decimal points',text:'Keep every place-value column lined up.',active:null,resultDigits:[],workingTop:[...work],changed:[],completed:false}];
    for(let pos=0;pos<width;pos++){
      if(work[pos]<bot[pos]){
        const before=[...work]; let lender=pos+1; while(lender<width&&work[lender]===0)lender++;
        if(lender<width){work[lender]-=1;for(let k=lender-1;k>pos;k--)work[k]=9;work[pos]+=10;const changed=[];for(let k=pos;k<=lender;k++)if(before[k]!==work[k])changed.push(k);frames.push({title:`Regroup the ${decimalPlaceName(pos)}`,text:`Regroup so ${work[pos]} can subtract ${bot[pos]}.`,active:pos,resultDigits:[...resultDigits],workingTop:[...work],oldTop:before,changed,completed:false});}
      }
      const digit=work[pos]-bot[pos];resultDigits[pos]=digit;
      frames.push({title:`Subtract the ${decimalPlaceName(pos)}`,text:`${work[pos]} − ${bot[pos]} = ${digit}.`,active:pos,resultDigits:[...resultDigits],workingTop:[...work],changed:[],completed:false});
    }
    frames.push({title:'Final answer',text:`${(A0/100).toFixed(2)} − ${(B0/100).toFixed(2)} = ${(result/100).toFixed(2)}.`,active:null,resultDigits:String(result).split('').reverse().map(Number),workingTop:[...work],changed:[],completed:true});
    return {type:'decimal-subtraction',a:A0/100,b:B0/100,result:result/100,width,A0,B0,frames};
  };

  function renderDecimalColumns(model,frame,op,subtraction=false){
    const width=model.width;
    const topInt=subtraction?(frame.workingTop||String(model.A0).split('').reverse().map(Number)):String(model.A0).padStart(width,'0').split('').reverse().map(Number);
    const botInt=String(model.B0).padStart(width,'0').split('').reverse().map(Number);
    const changed=new Set(frame.changed||[]);
    const cells=[];
    for(let left=width-1;left>=0;left--){
      const active=frame.active===left, carry=frame.carries?.[left]??'', answer=frame.resultDigits?.[left]??'';
      const top=topInt[left]??0, bot=botInt[left]??0;
      const oldTop=frame.oldTop?.[left];
      const topHtml=changed.has(left)?`<span class="borrow-old">${oldTop}</span><span class="borrow-new">${top}</span>`:top;
      cells.push(`<div class="anim-column ${active?'active':''}"><div class="anim-carry ${carry!==''?'visible':''}">${carry!==''?carry:'&nbsp;'}</div><div class="anim-top">${topHtml}</div><div class="anim-bottom">${bot}</div><div class="anim-answer ${answer!==''?'visible':''}">${answer!==''?answer:'&nbsp;'}</div></div>`);
      if(left===2) cells.push(`<div class="decimal-column"><div></div><div>.</div><div>.</div><div>.</div></div>`);
    }
    return `<div class="animation-workspace decimal-workspace"><div class="anim-operator">${op}</div><div class="anim-columns">${cells.join('')}</div></div>`;
  }

  AR.renderDecimalAddition=(model,index=0)=>{const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];return `<div class="addition-animation">${renderDecimalColumns(model,f,'+',false)}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;};
  AR.renderDecimalSubtraction=(model,index=0)=>{const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];return `<div class="subtraction-animation">${renderDecimalColumns(model,f,'−',true)}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;};


  const currency=x=>`$${Number(x).toFixed(2)}`;


  function renderCountMoneySummaryTable(items, state={}){
    const currentMult = Number.isInteger(state.currentMult) ? state.currentMult : -1;
    const includedThrough = Number.isInteger(state.includedThrough) ? state.includedThrough : -1;
    const currentAdd = Number.isInteger(state.currentAdd) ? state.currentAdd : -1;
    const showAllValues = !!state.showAllValues;
    const rows = items.map((item,idx)=>{
      const revealed = showAllValues || idx<=currentMult || idx<=includedThrough || idx===currentAdd;
      const rowCls = [
        idx===currentMult?'current-mult':'',
        idx<=includedThrough?'included-row':'',
        idx===currentAdd?'current-add':'',
      ].filter(Boolean).join(' ');
      return `<tr class="${rowCls}"><td>${idx+1}</td><td>${esc(item.label)}</td><td>${revealed?currency(item.subtotal):'—'}</td></tr>`;
    }).join('');
    return `<div class="count-money-table-wrap"><table class="count-money-table"><thead><tr><th>#</th><th>Multiplication</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="count-money-legend"><span class="legend-chip current-mult">Current multiplication</span><span class="legend-chip included-row">Already in running total</span><span class="legend-chip current-add">Being added now</span></div></div>`;
  }

  AR.buildMoneyChainAdditionFrames=(values,labels=[],finalLabel='Total')=>{
    const frames=[];
    if(!values?.length) return {type:'money-chain-add',frames:[{title:'No amounts',text:'There are no amounts to add.',kind:'note'}]};
    if(values.length===1){
      frames.push({title:'Only one amount',text:`The total is ${currency(values[0])}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big">${labels[0]||currency(values[0])}</div><div class="financial-big answer">${currency(values[0])}</div></div>`});
      return {type:'money-chain-add',frames};
    }
    let subtotal=Number(values[0]);
    frames.push({title:'Start with the first amount',text:`Begin with ${labels[0]||currency(subtotal)}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big">${labels[0]||currency(subtotal)}</div><div class="financial-sub">Running total: ${currency(subtotal)}</div></div>`});
    for(let i=1;i<values.length;i++){
      const next=Number(values[i]);
      const local=AR.buildDecimalAdditionFrames(subtotal,next);
      local.frames.forEach((f,idx)=>{
        frames.push({...f,kind:'decimal-add-step',a:subtotal,b:next,A0:local.A0,B0:local.B0,width:local.width,label:labels[i]||currency(next),pairIndex:i+1,stepIndex:idx,localCount:local.frames.length,completed:f.completed});
      });
      subtotal=Number((subtotal+next).toFixed(2));
    }
    frames.push({title:'Final total',text:`${finalLabel}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big answer">${finalLabel}</div></div>`});
    return {type:'money-chain-add',frames,finalTotal:subtotal};
  };

  AR.renderMoneyChainAddition=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    if(f.kind==='note') return `<div class="guided-animation"><div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    const temp={A0:f.A0,B0:f.B0,width:f.width};
    return `<div class="addition-animation"><div class="money-step-label">Running total + ${esc(f.label)}</div>${renderDecimalColumns(temp,f,'+',false)}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };



  function decimalPlaces(n){
    const s=String(Number(n));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }


  function clipIconSvg(type){
    const map={
      'boxes':`<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="20" y="20" width="60" height="36" rx="4" fill="#d9a35f" stroke="#8a5b2b" stroke-width="3"/><path d="M20 20 L50 6 L80 20" fill="#efc184" stroke="#8a5b2b" stroke-width="3"/><path d="M50 6 V56" stroke="#8a5b2b" stroke-width="3"/><path d="M35 28 h12" stroke="#8a5b2b" stroke-width="3"/></svg>`,
      'sticker-packs':`<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="24" y="10" width="52" height="50" rx="8" fill="#9fd5ff" stroke="#336699" stroke-width="3"/><path d="M24 18 Q50 30 76 18" fill="none" stroke="#336699" stroke-width="3"/><circle cx="40" cy="36" r="7" fill="#ffd25f"/><circle cx="60" cy="36" r="7" fill="#ff7aa2"/><circle cx="50" cy="46" r="7" fill="#8ed18e"/></svg>`,
      'rows-of-chairs':`<svg viewBox="0 0 100 70" aria-hidden="true"><g fill="#86b8ff" stroke="#2f5d90" stroke-width="2.5"><rect x="12" y="18" width="14" height="14" rx="2"/><rect x="16" y="32" width="6" height="14"/><path d="M12 46 h14"/><rect x="32" y="18" width="14" height="14" rx="2"/><rect x="36" y="32" width="6" height="14"/><path d="M32 46 h14"/><rect x="52" y="18" width="14" height="14" rx="2"/><rect x="56" y="32" width="6" height="14"/><path d="M52 46 h14"/><rect x="72" y="18" width="14" height="14" rx="2"/><rect x="76" y="32" width="6" height="14"/><path d="M72 46 h14"/></g></svg>`,
      'bags':`<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M28 22 h44 l-4 34 H32 Z" fill="#f6c57a" stroke="#8e5f24" stroke-width="3"/><path d="M38 22 c0-10 6-14 12-14 s12 4 12 14" fill="none" stroke="#8e5f24" stroke-width="3"/><circle cx="41" cy="41" r="5" fill="#f05d5d"/><circle cx="50" cy="35" r="5" fill="#7ecb6f"/><circle cx="59" cy="41" r="5" fill="#f2c94c"/></svg>`,
      'trays':`<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="18" y="24" width="64" height="24" rx="6" fill="#cfd8e6" stroke="#4f6785" stroke-width="3"/><rect x="22" y="20" width="56" height="8" rx="4" fill="#e8eef8" stroke="#4f6785" stroke-width="2"/><circle cx="34" cy="36" r="6" fill="#f1b36d"/><circle cx="50" cy="36" r="6" fill="#f1b36d"/><circle cx="66" cy="36" r="6" fill="#f1b36d"/></svg>`,
      'teams':`<svg viewBox="0 0 100 70" aria-hidden="true"><g fill="#8fc0ff" stroke="#325b87" stroke-width="2.5"><circle cx="28" cy="24" r="7"/><circle cx="50" cy="20" r="7"/><circle cx="72" cy="24" r="7"/><circle cx="50" cy="40" r="7"/><path d="M21 35 q7-5 14 0 v10 h-14z"/><path d="M43 31 q7-5 14 0 v10 h-14z"/><path d="M65 35 q7-5 14 0 v10 h-14z"/><path d="M43 51 q7-5 14 0 v10 h-14z"/></g></svg>`
    };
    return map[type]||map['boxes'];
  }

  function demoGroupCard(type,label='4 items'){
    return `<div class="clip-group-card"><div class="clip-icon">${clipIconSvg(type)}</div><div class="clip-group-label">${esc(label)}</div></div>`;
  }

  function actualGroupCard(type,each,itemLabel,groupLabel,count){
    return `<div class="actual-group-card"><div class="clip-icon large">${clipIconSvg(type)}</div><div class="actual-card-meta"><div><strong>${each}</strong> ${esc(itemLabel)} in each ${esc(groupLabel.slice(-1)==='s'?groupLabel.slice(0,-1):groupLabel)}</div><div class="actual-count-chip">${count} ${esc(groupLabel)}</div></div></div>`;
  }

  function conceptEquation(line1,line2=''){
    return `<div class="concept-equation"><div>${line1}</div>${line2?`<div class="subline">${line2}</div>`:''}</div>`;
  }

  AR.buildWordProductClipFrames=(contextType,groupLabel,itemLabel,unit,count,each,answer)=>{
    const conceptFrames=[
      {kind:'concept',title:'See equal groups',text:`Here is a small example using 3 ${groupLabel} with 4 ${itemLabel} in each one.`,conceptStage:'groups'},
      {kind:'concept',title:'Add the groups',text:`Repeated addition adds the same amount again and again.`,conceptStage:'addition'},
      {kind:'concept',title:'Multiply the groups',text:`Multiplication is a faster way to show repeated addition.`,conceptStage:'multiplication'},
      {kind:'concept',title:'Apply the same idea',text:`Your problem has ${count} ${groupLabel} with ${each} ${itemLabel} in each one.`,conceptStage:'apply'},
      {kind:'concept',title:'Write the multiplication sentence',text:`Use multiplication: ${each} × ${count}.`,conceptStage:'equation'}
    ];
    const mult=AR.buildMultiplicationFrames(each,count);
    const workFrames=mult.frames.map((f,idx)=>({kind:'work',title:f.title,text:f.text,multIndex:idx}));
    const final=[{kind:'concept',title:'Interpret the answer',text:`So there are ${A.Math.Utils.formatNumber(answer)} ${unit} altogether.`,conceptStage:'answer'}];
    return {type:'word-product-clipart',contextType,groupLabel,itemLabel,unit,count,each,answer,multModel:mult,frames:[...conceptFrames,...workFrames,...final]};
  };

  AR.renderWordProductClip=(model,index=0)=>{
    const frame=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const demoCards=`<div class="clip-demo-row">${demoGroupCard(model.contextType,'4 '+model.itemLabel)}${demoGroupCard(model.contextType,'4 '+model.itemLabel)}${demoGroupCard(model.contextType,'4 '+model.itemLabel)}</div>`;
    const actualCard=actualGroupCard(model.contextType,model.each,model.itemLabel,model.groupLabel,model.count);
    if(frame.kind==='work'){
      const intro=`<div class="word-problem-intro"><div class="word-problem-heading">Apply the same principle to the real problem</div>${actualCard}<div class="concept-equation compact"><div>${model.each} × ${model.count} = ?</div></div></div>`;
      return `<div class="word-product-animation">${intro}${AR.renderMultiplication(model.multModel,frame.multIndex)}<div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    }
    let board='';
    if(frame.conceptStage==='groups'){
      board=`<div class="word-problem-board">${demoCards}</div>`;
    } else if(frame.conceptStage==='addition'){
      board=`<div class="word-problem-board">${demoCards}${conceptEquation('4 + 4 + 4 = 12','Repeated addition')}</div>`;
    } else if(frame.conceptStage==='multiplication'){
      board=`<div class="word-problem-board">${demoCards}${conceptEquation('3 × 4 = 12','Same total, written as multiplication')}</div>`;
    } else if(frame.conceptStage==='apply'){
      board=`<div class="word-problem-board">${actualCard}<div class="concept-equation compact"><div>${model.count} groups of ${model.each}</div><div class="subline">${model.count} ${esc(model.groupLabel)} • ${model.each} ${esc(model.itemLabel)} each</div></div></div>`;
    } else if(frame.conceptStage==='equation'){
      board=`<div class="word-problem-board">${actualCard}${conceptEquation(`${model.each} × ${model.count} = ?`,'Now use long multiplication to solve it.')}</div>`;
    } else if(frame.conceptStage==='answer'){
      board=`<div class="word-problem-board">${actualCard}${conceptEquation(`${model.each} × ${model.count} = ${model.answer}`,`So there are ${A.Math.Utils.formatNumber(model.answer)} ${esc(model.unit)} altogether.`)}</div>`;
    }
    return `<div class="word-product-animation"><div class="guided-current"><div class="guided-current-label">${esc(frame.title)}</div><div class="guided-current-content">${board}</div></div><div class="animation-explanation"><strong>${esc(frame.title)}</strong><div>${esc(frame.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function patternTermCard(value,{active=false,revealed=true,kind='number'}={}){
    const dots = kind==='multiply' ? `<div class="pattern-dots">${Array.from({length:Math.min(12,Math.max(1,Math.abs(Number(value))))},()=>'<span></span>').join('')}${Math.abs(Number(value))>12?`<b>+${Math.abs(Number(value))-12}</b>`:''}</div>` : '';
    return `<div class="pattern-term-card ${active?'active':''} ${revealed?'':'hidden-term'}"><div class="pattern-term-value">${revealed?esc(value):'?'}</div>${dots}</div>`;
  }

  function patternArrow(label,{active=false}={}){
    return `<div class="pattern-arrow ${active?'active':''}"><div class="pattern-rule-chip">${esc(label)}</div><div class="pattern-arrow-line">→</div></div>`;
  }

  AR.buildPatternArrowFrames=(mode,terms,delta,factor,answer)=>{
    const ruleLabel=mode==='multiply'?`×${factor}`:(delta>=0?`+${delta}`:`−${Math.abs(delta)}`);
    const frames=[{title:'Look at the pattern',text:'Read the terms from left to right.',revealedArrows:0,showAnswer:false,activeArrow:-1,activeTerm:0}];
    for(let i=0;i<terms.length-1;i++){
      const calc=mode==='multiply'?`${terms[i]} × ${factor} = ${terms[i+1]}`:`${terms[i]} ${delta>=0?'+':'−'} ${Math.abs(delta)} = ${terms[i+1]}`;
      frames.push({title:'Find the change',text:calc,revealedArrows:i+1,showAnswer:false,activeArrow:i,activeTerm:i+1});
    }
    frames.push({title:'Same rule again',text:`The rule ${ruleLabel} repeats each time.`,revealedArrows:terms.length-1,showAnswer:false,activeArrow:-1,activeTerm:terms.length-1});
    const finalCalc=mode==='multiply'?`${terms[terms.length-1]} × ${factor} = ${answer}`:`${terms[terms.length-1]} ${delta>=0?'+':'−'} ${Math.abs(delta)} = ${answer}`;
    frames.push({title:'Find the next term',text:finalCalc,revealedArrows:terms.length,showAnswer:true,activeArrow:terms.length-1,activeTerm:terms.length});
    return {type:'pattern-arrows',mode,terms,delta,factor,answer,ruleLabel,frames};
  };

  AR.renderPatternArrows=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const values=[...model.terms,model.answer];
    const parts=[];
    values.forEach((v,i)=>{
      const revealed=i<model.terms.length || f.showAnswer;
      parts.push(patternTermCard(v,{active:f.activeTerm===i,revealed,kind:model.mode==='multiply'?'multiply':'number'}));
      if(i<values.length-1){
        const visible=i<f.revealedArrows;
        parts.push(visible?patternArrow(model.ruleLabel,{active:f.activeArrow===i}):`<div class="pattern-arrow placeholder"><div class="pattern-rule-chip">?</div><div class="pattern-arrow-line">→</div></div>`);
      }
    });
    return `<div class="pattern-animation"><div class="pattern-board">${parts.join('')}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildPatternRuleDiscoveryFrames=(terms,delta)=>{
    const frames=[{title:'Look at the terms',text:'Compare each pair of neighbouring terms.',shown:0,active:-1,showRule:false}];
    for(let i=0;i<terms.length-1;i++){
      frames.push({title:'Measure the difference',text:`${terms[i+1]} − ${terms[i]} = ${delta}.`,shown:i+1,active:i,showRule:false});
    }
    frames.push({title:'The change is constant',text:`Every gap is +${delta}.`,shown:terms.length-1,active:-1,showRule:true});
    return {type:'pattern-rule-discovery',terms,delta,frames};
  };

  AR.renderPatternRuleDiscovery=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const parts=[];
    model.terms.forEach((v,i)=>{
      parts.push(patternTermCard(v,{active:false,revealed:true}));
      if(i<model.terms.length-1){
        parts.push(i<f.shown?patternArrow(`+${model.delta}`,{active:f.active===i}):`<div class="pattern-arrow placeholder"><div class="pattern-rule-chip">?</div><div class="pattern-arrow-line">→</div></div>`);
      }
    });
    const rule=f.showRule?`<div class="pattern-rule-final">Rule: add ${model.delta}</div>`:'';
    return `<div class="pattern-animation"><div class="pattern-board">${parts.join('')}</div>${rule}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildRuleMachineFrames=(rate,pairs,x,answer)=>{
    const frames=[{title:'Find the relationship',text:'Watch each input pass through the same rule machine.',row:-1,showRule:false,final:false}];
    pairs.forEach((pair,i)=>frames.push({title:`Try input ${pair[0]}`,text:`${pair[0]} × ${rate} = ${pair[1]}.`,row:i,showRule:true,final:false}));
    frames.push({title:'Use the rule for the new input',text:`${x} × ${rate} = ${answer}.`,row:pairs.length,showRule:true,final:true});
    return {type:'rule-machine',rate,pairs,x,answer,frames};
  };

  AR.renderRuleMachine=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const rows=[...model.pairs,[model.x,model.answer]];
    const table=rows.map((r,i)=>{
      const active=f.row===i;
      const revealed=i<model.pairs.length || f.final;
      return `<div class="rule-machine-row ${active?'active':''}"><div class="machine-input">${r[0]}</div><div class="machine-arrow">→</div><div class="rule-machine-box ${f.showRule?'revealed':''}">${f.showRule?`× ${model.rate}`:'?'}</div><div class="machine-arrow">→</div><div class="machine-output">${revealed?r[1]:'?'}</div></div>`;
    }).join('');
    const final=f.final?`<div class="pattern-rule-final">${model.x} × ${model.rate} = ${model.answer}</div>`:'';
    return `<div class="rule-machine-animation"><div class="rule-machine-board">${table}</div>${final}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildMoneyMultiplicationFrames=(a,b,{currencyResult=true,label='Multiply'}={})=>{
    const aPlaces=decimalPlaces(a), bPlaces=decimalPlaces(b), totalPlaces=aPlaces+bPlaces;
    const scaleA=10**aPlaces, scaleB=10**bPlaces;
    const wholeA=Math.round(Number(a)*scaleA), wholeB=Math.round(Number(b)*scaleB);
    const wholeModel=AR.buildMultiplicationFrames(wholeA,wholeB);
    const exact=Number(a)*Number(b);
    const moneyRounded=Number(exact.toFixed(2));
    const frames=[{
      title:'Set up the multiplication',
      text:`Write ${a} × ${b}. For the long multiplication, first multiply the digits without the decimal points.`,
      kind:'money-mult-note',
      note:`<div class="financial-note"><div class="financial-big">${a} × ${b}</div><div class="financial-sub">Ignore the decimal points temporarily: ${wholeA} × ${wholeB}</div></div>`
    }];
    wholeModel.frames.forEach((f,i)=>frames.push({...f,kind:'money-mult-work',wholeA,wholeB,wholeModel,sourceA:a,sourceB:b}));
    if(totalPlaces>0){
      frames.push({
        title:'Put the decimal point back',
        text:`There are ${totalPlaces} decimal place${totalPlaces===1?'':'s'} altogether in the factors, so count ${totalPlaces} place${totalPlaces===1?'':'s'} from the right in the product.`,
        kind:'money-mult-note',
        note:`<div class="financial-note"><div class="financial-big">${wholeA} × ${wholeB} = ${wholeA*wholeB}</div><div class="financial-sub">${totalPlaces} decimal place${totalPlaces===1?'':'s'} → ${exact}</div></div>`
      });
    }
    if(currencyResult){
      frames.push({
        title:'Write the money amount',
        text:`Money is written to the nearest cent.`,
        kind:'money-mult-note',
        note:`<div class="financial-note"><div class="financial-big answer">${currency(moneyRounded)}</div></div>`
      });
    }
    return {type:'money-multiplication',a:Number(a),b:Number(b),wholeA,wholeB,totalPlaces,exact,moneyRounded,wholeModel,frames,label};
  };

  AR.renderMoneyMultiplication=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    if(f.kind==='money-mult-note'){
      return `<div class="guided-animation"><div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    }
    const localIndex=model.wholeModel.frames.findIndex(x=>x===f);
    // The copied frame cannot be located by identity, so match its position among multiplication-work frames.
    const workFrames=model.frames.filter(x=>x.kind==='money-mult-work');
    const wi=workFrames.indexOf(f);
    const rendered=AR.renderMultiplication(model.wholeModel,Math.max(0,wi));
    return `<div class="money-multiplication-wrap"><div class="money-step-label">${esc(model.label)}</div>${rendered}</div>`;
  };

  AR.buildCountMoneyDetailedFrames=(items,finalLabel='Total')=>{
    const frames=[];
    const values=[];
    const labels=[];
    items.forEach((item,idx)=>{
      values.push(item.subtotal);
      labels.push(item.label);
      const mult=AR.buildMoneyMultiplicationFrames(item.denom,item.count,{currencyResult:true,label:`Group ${idx+1}: ${item.label}`});
      mult.frames.forEach(f=>frames.push({...f,kind:f.kind==='money-mult-work'?'count-money-mult-work':'count-money-mult-note',moneyMultModel:mult,currentItemIndex:idx}));
    });
    const addModel=AR.buildMoneyChainAdditionFrames(values,labels,finalLabel);
    addModel.frames.forEach(f=>{
      if(f.kind==='decimal-add-step'){
        const currentAddIndex=(f.pairIndex||2)-1;
        frames.push({...f,kind:'count-money-add-work',addModel,currentAddIndex,includedThrough:currentAddIndex-1});
      } else if(f.title==='Start with the first amount'){
        frames.push({...f,kind:'count-money-add-note',addModel,currentAddIndex:-1,includedThrough:0});
      } else if(f.title==='Final total'){
        frames.push({...f,kind:'count-money-add-note',addModel,currentAddIndex:-1,includedThrough:items.length-1,showAllValues:true});
      } else {
        frames.push({...f,kind:'count-money-add-note',addModel,currentAddIndex:-1,includedThrough:-1,showAllValues:true});
      }
    });
    return {type:'count-money-detailed',frames,items,finalLabel};
  };

  AR.renderCountMoneyDetailed=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    if(f.kind==='count-money-mult-note' || f.kind==='count-money-mult-work'){
      const mm=f.moneyMultModel;
      const table=renderCountMoneySummaryTable(model.items,{currentMult:f.currentItemIndex});
      if(f.kind==='count-money-mult-note'){
        return `<div class="guided-animation count-money-layout">${table}<div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
      }
      const localFrames=mm.frames.filter(x=>x.kind==='money-mult-work');
      const sourceIndex=localFrames.findIndex(x=>x.title===f.title && x.text===f.text && JSON.stringify(x.rowDigits||[])===JSON.stringify(f.rowDigits||[]));
      return `<div class="money-multiplication-wrap count-money-layout">${table}<div><div class="money-step-label">${esc(mm.label)}</div>${AR.renderMultiplication(mm.wholeModel,Math.max(0,sourceIndex))}</div></div>`;
    }
    if(f.kind==='count-money-add-note'){
      const table=renderCountMoneySummaryTable(model.items,{includedThrough:f.includedThrough,currentAdd:f.currentAddIndex,showAllValues:!!f.showAllValues});
      return `<div class="guided-animation count-money-layout">${table}<div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    }
    if(f.kind==='count-money-add-work'){
      const temp={A0:f.A0,B0:f.B0,width:f.width};
      const table=renderCountMoneySummaryTable(model.items,{includedThrough:f.includedThrough,currentAdd:f.currentAddIndex,showAllValues:true});
      return `<div class="addition-animation count-money-layout">${table}<div><div class="money-step-label">Running total + ${esc(f.label)}</div>${renderDecimalColumns(temp,f,'+',false)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    }
    return '';
  };

  AR.buildBudgetBalanceFrames=(income,expenses,spent,answer)=>{
    const frames=[{title:'List the expenses',text:'First add the expenses to find how much was spent.',kind:'note',note:`<div class="financial-note"><div>${expenses.map(currency).join(' + ')}</div><div class="financial-sub">Income: ${currency(income)}</div></div>`}];
    if(expenses.length){
      let subtotal=Number(expenses[0]);
      frames.push({title:'Start with the first expense',text:`Begin with ${currency(subtotal)}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big">${currency(subtotal)}</div><div class="financial-sub">Expense subtotal: ${currency(subtotal)}</div></div>`});
      for(let i=1;i<expenses.length;i++){
        const next=Number(expenses[i]);
        const local=AR.buildDecimalAdditionFrames(subtotal,next);
        local.frames.forEach(f=>frames.push({...f,kind:'decimal-add-step',a:subtotal,b:next,A0:local.A0,B0:local.B0,width:local.width,label:`expense ${currency(next)}`}));
        subtotal=Number((subtotal+next).toFixed(2));
      }
    }
    frames.push({title:'Total expenses',text:`The expenses add up to ${currency(spent)}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big">Expenses = ${currency(spent)}</div></div>`});
    const sub=AR.buildDecimalSubtractionFrames(income,spent);
    sub.frames.forEach(f=>frames.push({...f,kind:'decimal-sub-step',a:income,b:spent,A0:sub.A0,B0:sub.B0,width:sub.width}));
    frames.push({title:'Final balance',text:`Money remaining: ${currency(answer)}.`,kind:'note',note:`<div class="financial-note"><div class="financial-big answer">${currency(answer)} remains</div></div>`});
    return {type:'budget-balance',frames};
  };

  AR.renderBudgetBalance=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    if(f.kind==='note') return `<div class="guided-animation"><div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    const temp={A0:f.A0,B0:f.B0,width:f.width};
    const op=f.kind==='decimal-sub-step'?'−':'+';
    const top=f.kind==='decimal-sub-step'?`Income − total expenses`:`Expense subtotal + ${esc(f.label)}`;
    return `<div class="addition-animation"><div class="money-step-label">${top}</div>${renderDecimalColumns(temp,f,op,f.kind==='decimal-sub-step')}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildUnitPriceCompareFrames=(q1,p1,u1,q2,p2,u2,best)=>({type:'unit-price-compare',frames:[
    {title:'Find unit price for option A',text:`Divide ${currency(p1)} by ${q1}.`,html:`<div class="financial-note"><div class="financial-big">A: ${currency(p1)} ÷ ${q1} = ${currency(u1)} per item</div></div>`},
    {title:'Find unit price for option B',text:`Divide ${currency(p2)} by ${q2}.`,html:`<div class="financial-note"><div class="financial-big">B: ${currency(p2)} ÷ ${q2} = ${currency(u2)} per item</div></div>`},
    {title:'Compare the unit prices',text:`Choose the smaller unit price.`,html:`<div class="financial-note"><div class="financial-big">${currency(u1)} ${u1<u2?'<':'>'} ${currency(u2)}</div><div class="financial-big answer">Better buy: ${best}</div></div>`}
  ]});

  AR.renderUnitPriceCompare=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="guided-animation"><div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.html}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildHSTFrames=(price,tax,total)=>{
    const frames=[{title:'Change the percent to a decimal',text:'13% means 13 out of 100, or 0.13.',kind:'hst-note',note:`<div class="financial-note"><div class="financial-big">13% = 0.13</div></div>`}];
    const mult=AR.buildMoneyMultiplicationFrames(price,0.13,{currencyResult:true,label:'Price × 13%'});
    mult.frames.forEach(f=>frames.push({...f,kind:f.kind==='money-mult-work'?'hst-mult-work':'hst-mult-note',moneyMultModel:mult}));
    frames.push({title:'Add tax to the price',text:'Add the tax to the original price to find the total after tax.',kind:'hst-note',note:`<div class="financial-note"><div class="financial-sub">Now add ${currency(price)} + ${currency(tax)}</div></div>`});
    const add=AR.buildDecimalAdditionFrames(price,tax);
    add.frames.forEach(f=>frames.push({...f,kind:'hst-add-work',A0:add.A0,B0:add.B0,width:add.width}));
    frames.push({title:'Final amounts',text:`The HST is ${currency(tax)} and the total with tax is ${currency(total)}.`,kind:'hst-note',note:`<div class="financial-note"><div class="financial-big">HST = ${currency(tax)}</div><div class="financial-big answer">Total = ${currency(total)}</div></div>`});
    return {type:'hst-calc',frames};
  };

  AR.renderHSTCalc=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    if(f.kind==='hst-note' || f.kind==='hst-mult-note'){
      return `<div class="guided-animation"><div class="guided-current"><div class="guided-current-label">${esc(f.title)}</div><div class="guided-current-content">${f.note}</div></div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
    }
    if(f.kind==='hst-mult-work'){
      const mm=f.moneyMultModel;
      const localFrames=mm.frames.filter(x=>x.kind==='money-mult-work');
      const sourceIndex=localFrames.findIndex(x=>x.title===f.title && x.text===f.text && JSON.stringify(x.rowDigits||[])===JSON.stringify(f.rowDigits||[]));
      return `<div class="money-multiplication-wrap"><div class="money-step-label">Price × 0.13</div>${AR.renderMultiplication(mm.wholeModel,Math.max(0,sourceIndex))}</div>`;
    }
    const temp={A0:f.A0,B0:f.B0,width:f.width};
    return `<div class="addition-animation"><div class="money-step-label">Price + tax</div>${renderDecimalColumns(temp,f,'+',false)}<div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function placeholderBox(value,cls=''){
    return `<span class="placeholder-box ${cls}">${value===null||value===undefined?'□':esc(value)}</span>`;
  }

  function miniDots(count,limit=12){
    const n=Math.min(Number(count)||0,limit);
    const dots=Array.from({length:n},()=>'<span class="mini-dot"></span>').join('');
    return `<span class="mini-dot-row">${dots}${count>limit?`<span class="mini-dot-more">+${count-limit}</span>`:''}</span>`;
  }


  function rectangleVariableFigure(length, sideLabel, area, solvedWidth=null){
    const safeL=Math.max(3, Number(length)||3);
    const safeW=Math.max(2, Number(solvedWidth)||5);
    const ratio=safeL/safeW;
    const maxRw=220,maxRh=120,minRw=120,minRh=62;
    let rw=maxRw, rh=maxRh;
    if(ratio>=1){ rh=Math.max(minRh, Math.min(maxRh, maxRw/ratio)); }
    else { rw=Math.max(minRw, Math.min(maxRw, maxRh*ratio)); }
    const x=42, y=34, W=340, H=220;
    let partitions='';
    if(solvedWidth!==null && Number.isFinite(Number(length)) && safeL<=15){
      const cell=rw/safeL;
      for(let i=1;i<safeL;i++) partitions+=`<line x1="${x+i*cell}" y1="${y}" x2="${x+i*cell}" y2="${y+rh}" class="rect-partition"/>`;
    }
    return `<div class="svg-wrap"><svg class="math-diagram rectangle-variable-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rectangle with area ${esc(area)} square centimetres"><rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>${partitions}<text x="${x+rw/2}" y="24" text-anchor="middle" font-size="16">${esc(String(length))} cm</text><text x="${x+rw+16}" y="${y+rh/2}" font-size="16" dominant-baseline="middle">${esc(String(sideLabel))}</text><text x="${x+rw/2}" y="${y+rh/2}" text-anchor="middle" font-size="16" font-weight="700">${esc(String(area))} cm²</text></svg></div>`;
  }

  AR.buildMissingSideAreaFrames=(length,width,area)=>({
    type:'rectangle-missing-side', length,width,area,
    frames:[
      {stage:'setup',title:'Draw the rectangle',text:`The rectangle has area ${area} cm², length ${length} cm, and unknown width x.`},
      {stage:'equation',title:'Write an equation',text:`Use the area formula. Let the missing width be x.`},
      {stage:'solve',title:'Solve for x',text:`${area} ÷ ${length} = ${width}, so x = ${width}.`},
      {stage:'check',title:'Check the answer',text:`Check by multiplying: ${length} × ${width} = ${area}.`}
    ]
  });

  AR.renderMissingSideArea=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    let visual='';
    if(f.stage==='setup'){
      visual=`<div class="missing-side-layout"><div class="missing-side-figure">${rectangleVariableFigure(model.length,'x cm',model.area)}</div><div class="concept-equation compact"><div>A = l × w</div><div class="subline">Let the missing width be x.</div></div></div>`;
    } else if(f.stage==='equation'){
      visual=`<div class="missing-side-layout"><div class="missing-side-figure">${rectangleVariableFigure(model.length,'x cm',model.area)}</div><div class="equation-stack"><div class="concept-equation compact"><div>A = l × w</div></div><div class="concept-equation compact"><div>${model.area} = ${model.length} × x</div></div></div></div>`;
    } else if(f.stage==='solve'){
      const cols=Array.from({length:model.length},(_,i)=>`<div class="equal-group-card"><div class="equal-group-label">Part ${i+1}</div>${miniDots(model.width)}<div class="equal-group-value">x</div></div>`).join('');
      visual=`<div class="missing-side-layout"><div class="missing-side-figure">${rectangleVariableFigure(model.length,'x cm',model.area)}</div><div class="equation-stack"><div class="concept-equation compact"><div>${model.area} = ${model.length} × x</div></div><div class="equal-groups-board"><div class="groups-total">Total area: ${model.area} cm²</div><div class="equal-groups-grid">${cols}</div><div class="concept-equation">${model.area} ÷ ${model.length} = x</div><div class="single-box-solve"><div class="single-box-label">The missing width is</div>${placeholderBox(model.width+' cm','reveal')}</div></div></div></div>`;
    } else if(f.stage==='check'){
      visual=`<div class="missing-side-layout"><div class="missing-side-figure">${rectangleVariableFigure(model.length,model.width+' cm',model.area,model.width)}</div><div class="equation-stack"><div class="concept-equation compact"><div>${model.area} = ${model.length} × x</div></div><div class="concept-equation compact"><div>${model.area} = ${model.length} × ${model.width}</div><div class="subline">So x = ${model.width} cm</div></div></div></div>`;
    }
    return `<div class="placeholder-animation"><div class="placeholder-visual-board">${visual}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildPlaceholderVisualFrames=(a)=>{
    const mode=a.mode;
    let frames=[];
    if(mode==='add'){
      frames=[
        {stage:'setup',title:'See the equation',text:`The box plus ${a.k} has the same value as ${a.total}.`},
        {stage:'remove',title:`Undo +${a.k}`,text:`Subtract ${a.k} from both sides.`},
        {stage:'solve',title:'Reveal the missing number',text:`${a.total} − ${a.k} = ${a.x}.`},
        {stage:'check',title:'Check the answer',text:`${a.x} + ${a.k} = ${a.total}.`}
      ];
    } else if(mode==='subtract'){
      frames=[
        {stage:'setup',title:'See the whole and the remaining part',text:`Start with ${a.whole}. After the missing part is removed, ${a.remain} remains.`},
        {stage:'parts',title:'Find the missing part',text:`The missing part is the difference between ${a.whole} and ${a.remain}.`},
        {stage:'solve',title:'Reveal the missing number',text:`${a.whole} − ${a.remain} = ${a.x}.`},
        {stage:'check',title:'Check the answer',text:`${a.whole} − ${a.x} = ${a.remain}.`}
      ];
    } else if(mode==='multiply'){
      frames=[
        {stage:'setup',title:'See equal groups',text:`There are ${a.groups} equal groups with a total of ${a.total}.`},
        {stage:'split',title:'Split the total equally',text:`Share ${a.total} equally among ${a.groups} groups.`},
        {stage:'solve',title:'Reveal the missing number',text:`${a.total} ÷ ${a.groups} = ${a.x}, so each group has ${a.x}.`},
        {stage:'check',title:'Check the answer',text:`${a.groups} × ${a.x} = ${a.total}.`}
      ];
    } else {
      frames=[
        {stage:'setup',title:'Read the division sentence',text:`A missing total divided into groups of ${a.divisor} gives ${a.quotient} groups.`},
        {stage:'build',title:'Build the total',text:`Make ${a.quotient} groups with ${a.divisor} in each group.`},
        {stage:'solve',title:'Reveal the missing number',text:`${a.quotient} × ${a.divisor} = ${a.x}.`},
        {stage:'check',title:'Check the answer',text:`${a.x} ÷ ${a.divisor} = ${a.quotient}.`}
      ];
    }
    return {type:'placeholder-visual',...a,frames};
  };

  AR.renderPlaceholderVisual=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    let visual='';
    if(model.mode==='add'){
      const leftVal=f.stage==='solve'||f.stage==='check'?model.x:null;
      const showRemove=['remove'].includes(f.stage);
      if(f.stage==='solve'){
        visual=`<div class="single-box-solve"><div class="single-box-label">The missing number is</div>${placeholderBox(leftVal,'reveal')}</div>`;
      } else if(f.stage==='check'){
        visual=`<div class="balance-board"><div class="balance-side">${placeholderBox(leftVal,'reveal')}<span class="math-op">+</span>${placeholderBox(model.k,'known')}</div><div class="balance-equals">=</div><div class="balance-side">${placeholderBox(model.total,'known')}</div></div><div class="concept-equation">${model.x} + ${model.k} = ${model.total}</div>`;
      } else {
        visual=`<div class="balance-board"><div class="balance-side">${placeholderBox(leftVal,'')}<span class="math-op">+</span>${placeholderBox(model.k,'known')}${showRemove?`<div class="balance-action">− ${model.k}</div>`:''}</div><div class="balance-equals">=</div><div class="balance-side">${placeholderBox(model.total,'known')}${showRemove?`<div class="balance-action">− ${model.k}</div>`:''}${showRemove?`<div class="balance-result">${model.total-model.k}</div>`:''}</div></div>`;
      }
    } else if(model.mode==='subtract'){
      const pct=(model.remain/model.whole)*100;
      const missingPct=100-pct;
      visual=`<div class="part-whole-board"><div class="part-whole-title">Whole = ${model.whole}</div><div class="part-whole-bar"><div class="bar-missing" style="width:${missingPct}%">${['solve','check'].includes(f.stage)?model.x:'?'}</div><div class="bar-known" style="width:${pct}%">${model.remain}</div></div><div class="part-whole-labels"><span>missing part</span><span>remaining part</span></div>${['parts','solve','check'].includes(f.stage)?`<div class="concept-equation">${model.whole} − ${model.remain} = ${['solve','check'].includes(f.stage)?model.x:'?'}</div>`:''}</div>`;
    } else if(model.mode==='multiply'){
      const reveal=['solve','check'].includes(f.stage);
      const groups=Array.from({length:model.groups},(_,i)=>`<div class="equal-group-card"><div class="equal-group-label">Group ${i+1}</div>${reveal?miniDots(model.x):'<div class="group-question">?</div>'}<div class="equal-group-value">${reveal?model.x:'□'}</div></div>`).join('');
      visual=`<div class="equal-groups-board"><div class="groups-total">Total: ${model.total}</div><div class="equal-groups-grid">${groups}</div>${['split','solve','check'].includes(f.stage)?`<div class="concept-equation">${model.total} ÷ ${model.groups} = ${reveal?model.x:'?'}</div>`:''}</div>`;
    } else {
      const showGroups=['build','solve','check'].includes(f.stage);
      const groups=showGroups?Array.from({length:model.quotient},(_,i)=>`<div class="equal-group-card"><div class="equal-group-label">Group ${i+1}</div>${miniDots(model.divisor)}<div class="equal-group-value">${model.divisor}</div></div>`).join(''):'';
      visual=`<div class="equal-groups-board">${f.stage==='setup'?`<div class="concept-equation">□ ÷ ${model.divisor} = ${model.quotient}</div>`:''}${showGroups?`<div class="equal-groups-grid">${groups}</div>`:''}${['solve','check'].includes(f.stage)?`<div class="concept-equation">${model.quotient} × ${model.divisor} = ${model.x}</div>`:''}</div>`;
    }
    return `<div class="placeholder-animation"><div class="placeholder-visual-board">${visual}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function lineRelationshipSvg(type,stage){
    const W=360,H=210;
    let lines='', extras='';
    if(type==='parallel'){
      lines=`<line x1="70" y1="70" x2="290" y2="70" class="line-rel main"/><line x1="70" y1="140" x2="290" y2="140" class="line-rel main"/>`;
      if(stage!=='draw') extras=`<line x1="180" y1="76" x2="180" y2="134" class="distance-guide"/><path d="M174 84 l6 -8 l6 8 M174 126 l6 8 l6 -8" class="distance-arrow"/><text x="192" y="108" font-size="14">same distance</text>`;
    } else if(type==='perpendicular'){
      lines=`<line x1="65" y1="105" x2="295" y2="105" class="line-rel main"/><line x1="180" y1="35" x2="180" y2="175" class="line-rel main"/>`;
      if(stage!=='draw') extras=`<path d="M180 105 h28 v-28 h-28" class="right-angle-mark"/><text x="214" y="72" font-size="14">90°</text>`;
    } else {
      lines=`<line x1="70" y1="155" x2="285" y2="55" class="line-rel main"/><line x1="95" y1="45" x2="270" y2="165" class="line-rel main"/>`;
      if(stage!=='draw') extras=`<circle cx="183" cy="102" r="6" class="intersection-dot"/><path d="M183 102 A40 40 0 0 1 214 82" class="angle-arc"/><text x="218" y="84" font-size="14">not 90°</text>`;
    }
    const label=stage==='answer'?`<text x="180" y="198" text-anchor="middle" font-size="20" font-weight="700">${esc(type)}</text>`:'';
    return `<div class="line-rel-wrap"><svg class="line-relationship-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(type)} lines">${lines}${extras}${label}</svg></div>`;
  }

  AR.buildLineRelationshipFrames=(relationship)=>{
    const explain={
      parallel:'The lines point in the same direction and stay the same distance apart, so they never meet.',
      perpendicular:'The lines meet and form a square corner: a 90° right angle.',
      intersecting:'The lines cross at one point, but the angle is not 90°.'
    };
    const cue={parallel:'Look for lines that never meet.',perpendicular:'Look for a right-angle corner.',intersecting:'Look for lines that cross without making a right angle.'};
    return {type:'line-relationship-visual',relationship,frames:[
      {stage:'draw',title:'Draw the lines',text:'First, look at the shape made by the two lines.'},
      {stage:'notice',title:'Notice the key feature',text:cue[relationship]},
      {stage:'answer',title:'Name the relationship',text:explain[relationship]}
    ]};
  };

  AR.renderLineRelationship=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${lineRelationshipSvg(model.relationship,f.stage)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function solidPropertiesSvg(solid, ask, counts, stage){
    const W=360, H=250;
    const wantFace=ask==='faces', wantEdge=ask==='edges', wantVertex=ask==='vertices';
    const faceFill=(active)=>active?'rgba(134,184,255,.55)':'rgba(215,228,248,.65)';
    const edgeClass=(active)=>active?'solid-edge active':'solid-edge';
    const vertexClass=(active)=>active?'solid-vertex active':'solid-vertex';
    let body='';
    if(solid==='cube' || solid==='rectangular prism'){
      const ox=solid==='cube'?75:55, oy=85, fw=solid==='cube'?110:150, fh=95, dx=38, dy=-28;
      const A=[ox,oy], B=[ox+fw,oy], C=[ox+fw,oy+fh], D=[ox,oy+fh];
      const E=[ox+dx,oy+dy], F=[ox+fw+dx,oy+dy], G=[ox+fw+dx,oy+fh+dy], Hh=[ox+dx,oy+fh+dy];
      const faceActive=stage!=='draw' && wantFace;
      body += `<polygon points="${A} ${B} ${C} ${D}" fill="${faceFill(faceActive)}" class="solid-face"/>`;
      body += `<polygon points="${B} ${F} ${G} ${C}" fill="${faceFill(faceActive)}" class="solid-face side"/>`;
      body += `<polygon points="${D} ${C} ${G} ${Hh}" fill="${faceFill(false)}" class="solid-face bottom"/>`;
      body += `<polygon points="${E} ${F} ${G} ${Hh}" fill="${faceFill(faceActive)}" class="solid-face top"/>`;
      const edges=[[A,B],[B,C],[C,D],[D,A],[E,F],[F,G],[G,Hh],[Hh,E],[A,E],[B,F],[C,G],[D,Hh]];
      body += edges.map(e=>`<line x1="${e[0][0]}" y1="${e[0][1]}" x2="${e[1][0]}" y2="${e[1][1]}" class="${edgeClass(stage!=='draw' && wantEdge)}"/>`).join('');
      const verts=[A,B,C,D,E,F,G,Hh];
      body += verts.map(v=>`<circle cx="${v[0]}" cy="${v[1]}" r="4.5" class="${vertexClass(stage!=='draw' && wantVertex)}"/>`).join('');
    } else if(solid==='cylinder'){
      const x=180, topY=70, botY=170, rx=62, ry=18;
      body += `<ellipse cx="${x}" cy="${topY}" rx="${rx}" ry="${ry}" fill="${faceFill(stage!=='draw' && wantFace)}" class="solid-face"/>`;
      body += `<path d="M ${x-rx} ${topY} L ${x-rx} ${botY} A ${rx} ${ry} 0 0 0 ${x+rx} ${botY} L ${x+rx} ${topY} A ${rx} ${ry} 0 0 0 ${x-rx} ${topY}" fill="rgba(215,228,248,.55)" class="solid-face side"/>`;
      body += `<ellipse cx="${x}" cy="${botY}" rx="${rx}" ry="${ry}" fill="${faceFill(stage!=='draw' && wantFace)}" class="solid-face"/>`;
      body += `<ellipse cx="${x}" cy="${topY}" rx="${rx}" ry="${ry}" class="${edgeClass(stage!=='draw' && wantEdge)}" fill="none"/>`;
      body += `<path d="M ${x-rx} ${botY} A ${rx} ${ry} 0 0 0 ${x+rx} ${botY}" class="${edgeClass(stage!=='draw' && wantEdge)}" fill="none"/>`;
      body += `<line x1="${x-rx}" y1="${topY}" x2="${x-rx}" y2="${botY}" class="solid-edge"/><line x1="${x+rx}" y1="${topY}" x2="${x+rx}" y2="${botY}" class="solid-edge"/>`;
    } else if(solid==='square pyramid'){
      const A=[110,175], B=[250,175], C=[285,140], D=[145,140], P=[195,58];
      const faceActive=stage!=='draw' && wantFace;
      body += `<polygon points="${A} ${B} ${P}" fill="${faceFill(faceActive)}" class="solid-face"/>`;
      body += `<polygon points="${B} ${C} ${P}" fill="${faceFill(false)}" class="solid-face side"/>`;
      body += `<polygon points="${D} ${A} ${P}" fill="${faceFill(false)}" class="solid-face side"/>`;
      body += `<polygon points="${A} ${B} ${C} ${D}" fill="rgba(215,228,248,.4)" class="solid-face base"/>`;
      const edges=[[A,B],[B,C],[C,D],[D,A],[A,P],[B,P],[C,P],[D,P]];
      body += edges.map(e=>`<line x1="${e[0][0]}" y1="${e[0][1]}" x2="${e[1][0]}" y2="${e[1][1]}" class="${edgeClass(stage!=='draw' && wantEdge)}"/>`).join('');
      const verts=[A,B,C,D,P];
      body += verts.map(v=>`<circle cx="${v[0]}" cy="${v[1]}" r="4.5" class="${vertexClass(stage!=='draw' && wantVertex)}"/>`).join('');
    }
    const caption = stage==='answer' ? `<text x="180" y="230" text-anchor="middle" font-size="18" font-weight="700">${counts[ask]} ${ask}</text>` : '';
    const legend = stage==='notice' ? `<text x="180" y="230" text-anchor="middle" font-size="14">Highlighted: ${ask}</text>` : '';
    return `<div class="solid-props-wrap"><svg class="solid-properties-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(solid)} showing ${esc(ask)}">${body}${caption}${legend}</svg></div>`;
  }

  AR.buildSolidPropertiesFrames=(solid, ask, counts)=>({
    type:'solid-properties-visual', solid, ask, counts,
    frames:[
      {stage:'draw',title:'Draw the solid',text:`Look at the ${solid}.`},
      {stage:'notice',title:'Notice the ${ask}',text:`Focus on the ${ask} of the ${solid}.`},
      {stage:'answer',title:'Count the ${ask}',text:`The ${solid} has ${counts[ask]} ${ask}.`}
    ]
  });

  AR.renderSolidProperties=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${solidPropertiesSvg(model.solid,f.stage==='answer'?model.ask:model.ask,model.counts,f.stage)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function coordinateReadSvg(point,label='A',stage='point'){
    const size=360,pad=48,step=38,max=7;
    const gridEnd=pad+max*step;
    let lines='';
    for(let i=0;i<=max;i++){
      const x=pad+i*step,y=pad+(max-i)*step;
      lines+=`<line x1="${x}" y1="${pad}" x2="${x}" y2="${gridEnd}" class="grid-line"/><line x1="${pad}" y1="${pad+i*step}" x2="${gridEnd}" y2="${pad+i*step}" class="grid-line"/><text x="${x}" y="${gridEnd+22}" text-anchor="middle" font-size="12">${i}</text><text x="${pad-20}" y="${y+4}" text-anchor="middle" font-size="12">${i}</text>`;
    }
    const px=pad+point[0]*step, py=pad+(max-point[1])*step;
    const guideX = stage==='x' || stage==='y' || stage==='answer';
    const guideY = stage==='y' || stage==='answer';
    const xDrop = `<line x1="${px}" y1="${py}" x2="${px}" y2="${gridEnd}" class="coord-guide x-guide"/>`;
    const yAcross = `<line x1="${pad}" y1="${py}" x2="${px}" y2="${py}" class="coord-guide y-guide"/>`;
    const xMarker = `<circle cx="${px}" cy="${gridEnd}" r="14" class="coord-badge x"/><text x="${px}" y="${gridEnd+5}" text-anchor="middle" font-size="14" font-weight="700">${point[0]}</text>`;
    const yMarker = `<circle cx="${pad-26}" cy="${py}" r="14" class="coord-badge y"/><text x="${pad-26}" y="${py+5}" text-anchor="middle" font-size="14" font-weight="700">${point[1]}</text>`;
    const pointDot = `<circle cx="${px}" cy="${py}" r="6" class="point-primary"/><text x="${px+12}" y="${py-12}" font-size="14" font-weight="700">${esc(label)}</text>`;
    const coordLabel = stage==='answer' ? `<text x="${size/2}" y="26" text-anchor="middle" font-size="18" font-weight="700">${esc(label)} = (${point[0]}, ${point[1]})</text>` : '';
    return `<div class="svg-wrap"><svg class="math-diagram coordinate-diagram animated-coordinate-diagram" viewBox="0 0 ${size} ${size}" role="img" aria-label="Coordinate grid for point ${esc(label)}"><g>${lines}</g><line x1="${pad}" y1="${gridEnd}" x2="${gridEnd+8}" y2="${gridEnd}" class="axis-line"/><line x1="${pad}" y1="${gridEnd}" x2="${pad}" y2="${pad-8}" class="axis-line"/><text x="${gridEnd+16}" y="${gridEnd+5}" font-size="13" font-weight="700">x</text><text x="${pad-5}" y="${pad-18}" font-size="13" font-weight="700">y</text>${guideX?xDrop:''}${guideY?yAcross:''}${pointDot}${guideX?xMarker:''}${guideY?yMarker:''}${coordLabel}</svg></div>`;
  }

  AR.buildCoordinateReadFrames=(point,label='A')=>({
    type:'coordinate-read-visual', point,label,
    frames:[
      {stage:'point',title:'Locate the point',text:`Find point ${label} on the graph.`},
      {stage:'x',title:'Read the x-coordinate',text:`Move straight down to the x-axis. The x-coordinate is ${point[0]}.`},
      {stage:'y',title:'Read the y-coordinate',text:`Move across to the y-axis. The y-coordinate is ${point[1]}.`},
      {stage:'answer',title:'Write the coordinates',text:`Write the coordinates in order: (${point[0]}, ${point[1]}).`}
    ]
  });

  AR.renderCoordinateRead=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${coordinateReadSvg(model.point,model.label,f.stage)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function coordinateTranslateSvg(point, translated, dx, dy, label='A', stage='start'){
    const size=360,pad=48,step=38,max=7;
    const gridEnd=pad+max*step;
    let lines='';
    for(let i=0;i<=max;i++){
      const x=pad+i*step,y=pad+(max-i)*step;
      lines+=`<line x1="${x}" y1="${pad}" x2="${x}" y2="${gridEnd}" class="grid-line"/><line x1="${pad}" y1="${pad+i*step}" x2="${gridEnd}" y2="${pad+i*step}" class="grid-line"/><text x="${x}" y="${gridEnd+22}" text-anchor="middle" font-size="12">${i}</text><text x="${pad-20}" y="${y+4}" text-anchor="middle" font-size="12">${i}</text>`;
    }
    const sx=pad+point[0]*step, sy=pad+(max-point[1])*step;
    const mx=pad+translated[0]*step, my=sy;
    const fx=pad+translated[0]*step, fy=pad+(max-translated[1])*step;
    const startDot=`<circle cx="${sx}" cy="${sy}" r="6" class="point-primary"/><text x="${sx+12}" y="${sy-12}" font-size="14" font-weight="700">${esc(label)}</text>`;
    const interDot=(stage==='vertical' || stage==='answer') ? `<circle cx="${mx}" cy="${my}" r="5" class="point-intermediate"/>` : '';
    const finalDot=(stage==='answer') ? `<circle cx="${fx}" cy="${fy}" r="6" class="point-secondary"/><text x="${fx+12}" y="${fy-12}" font-size="14" font-weight="700">${esc(label)}′</text>` : '';
    const horiz=(stage==='horizontal' || stage==='vertical' || stage==='answer') ? `<line x1="${sx}" y1="${sy}" x2="${mx}" y2="${my}" class="coord-guide translate-h" marker-end="url(#arrow-h)"/>` : '';
    const vert=(stage==='vertical' || stage==='answer') ? `<line x1="${mx}" y1="${my}" x2="${fx}" y2="${fy}" class="coord-guide translate-v" marker-end="url(#arrow-v)"/>` : '';
    const horizLabel=(stage==='horizontal' || stage==='vertical' || stage==='answer') ? `<text x="${(sx+mx)/2}" y="${sy-12}" text-anchor="middle" font-size="14" font-weight="700" fill="#ef6c00">${dx>0?'+':''}${dx}</text>` : '';
    const vertLabel=(stage==='vertical' || stage==='answer') ? `<text x="${mx+16}" y="${(my+fy)/2}" text-anchor="start" font-size="14" font-weight="700" fill="#2e7d32">${dy>0?'+':''}${dy}</text>` : '';
    const finalText = stage==='answer' ? `<text x="${size/2}" y="26" text-anchor="middle" font-size="18" font-weight="700">A′ = (${translated[0]}, ${translated[1]})</text>` : '';
    return `<div class="svg-wrap"><svg class="math-diagram coordinate-diagram animated-coordinate-diagram" viewBox="0 0 ${size} ${size}" role="img" aria-label="Coordinate translation"><defs><marker id="arrow-h" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ef6c00"/></marker><marker id="arrow-v" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#2e7d32"/></marker></defs><g>${lines}</g><line x1="${pad}" y1="${gridEnd}" x2="${gridEnd+8}" y2="${gridEnd}" class="axis-line"/><line x1="${pad}" y1="${gridEnd}" x2="${pad}" y2="${pad-8}" class="axis-line"/><text x="${gridEnd+16}" y="${gridEnd+5}" font-size="13" font-weight="700">x</text><text x="${pad-5}" y="${pad-18}" font-size="13" font-weight="700">y</text>${horiz}${vert}${horizLabel}${vertLabel}${startDot}${interDot}${finalDot}${finalText}</svg></div>`;
  }

  AR.buildCoordinateTranslateFrames=(point,translated,dx,dy,label='A')=>({
    type:'coordinate-translate-visual', point, translated, dx, dy, label,
    frames:[
      {stage:'start',title:'Plot the starting point',text:`Point ${label} starts at (${point[0]}, ${point[1]}).`},
      {stage:'horizontal',title:'Translate horizontally',text:`Move ${Math.abs(dx)} unit${Math.abs(dx)!==1?'s':''} ${dx>0?'right':'left'} to change the x-coordinate.`},
      {stage:'vertical',title:'Translate vertically',text:`Then move ${Math.abs(dy)} unit${Math.abs(dy)!==1?'s':''} ${dy>0?'up':'down'} to change the y-coordinate.`},
      {stage:'answer',title:'Read the new coordinates',text:`The translated point is (${translated[0]}, ${translated[1]}).`}
    ]
  });

  AR.renderCoordinateTranslate=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${coordinateTranslateSvg(model.point,model.translated,model.dx,model.dy,model.label,f.stage)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function pointsToSvg(points,pad,step,max){
    return points.map(([x,y])=>`${pad+x*step},${pad+(max-y)*step}`).join(' ');
  }

  function transformationSvg(kind, base, transformed, stage, opts={}){
    const size=360,pad=48,step=38,max=7;
    const gridEnd=pad+max*step;
    let lines='';
    for(let i=0;i<=max;i++){
      const x=pad+i*step,y=pad+(max-i)*step;
      lines+=`<line x1="${x}" y1="${pad}" x2="${x}" y2="${gridEnd}" class="grid-line"/><line x1="${pad}" y1="${pad+i*step}" x2="${gridEnd}" y2="${pad+i*step}" class="grid-line"/><text x="${x}" y="${gridEnd+22}" text-anchor="middle" font-size="12">${i}</text><text x="${pad-20}" y="${y+4}" text-anchor="middle" font-size="12">${i}</text>`;
    }
    const basePoly=pointsToSvg(base,pad,step,max);
    const transPoly=pointsToSvg(transformed,pad,step,max);
    const labels=(pts,txt,color)=>{
      const [x,y]=pts[0];
      return `<text x="${pad+x*step+10}" y="${pad+(max-y)*step-10}" font-size="13" font-weight="700" fill="${color}">${txt}</text>`;
    };
    let extra='';
    if(kind==='translation'){
      const dx=opts.dx||0, dy=opts.dy||0;
      const arrowStart=base[0], arrowEnd=transformed[0];
      const ax1=pad+arrowStart[0]*step, ay1=pad+(max-arrowStart[1])*step;
      const ax2=pad+arrowEnd[0]*step, ay2=pad+(max-arrowEnd[1])*step;
      if(stage!=='draw') extra += `<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" class="transform-arrow translate" marker-end="url(#transform-arrow)"/><text x="${(ax1+ax2)/2}" y="${(ay1+ay2)/2-10}" text-anchor="middle" font-size="13" font-weight="700" fill="#ef6c00">(${dx>0?'+':''}${dx}, ${dy>0?'+':''}${dy})</text>`;
    } else if(kind==='rotation'){
      const [cx,cy]=opts.center||[4,4];
      const pcx=pad+cx*step, pcy=pad+(max-cy)*step;
      extra += `<circle cx="${pcx}" cy="${pcy}" r="5" class="rotation-center"/><text x="${pcx+10}" y="${pcy-10}" font-size="13" font-weight="700">Center</text>`;
      if(stage!=='draw') extra += `<path d="M ${pcx+26} ${pcy} A 26 26 0 0 1 ${pcx} ${pcy-26}" class="transform-arc" marker-end="url(#transform-arrow-blue)"/><text x="${pcx+36}" y="${pcy-18}" font-size="13" font-weight="700" fill="#1565c0">90°</text>`;
    } else if(kind==='reflection'){
      const mirror=opts.mirror||{axis:'vertical',value:4};
      if(mirror.axis==='vertical'){
        const mx=pad+mirror.value*step;
        extra += `<line x1="${mx}" y1="${pad}" x2="${mx}" y2="${gridEnd}" class="mirror-line"/><text x="${mx+10}" y="${pad+18}" font-size="13" font-weight="700" fill="#6a1b9a">Mirror line</text>`;
        if(stage!=='draw'){
          const [x1,y1]=base[1],[x2,y2]=transformed[1];
          extra += `<line x1="${pad+x1*step}" y1="${pad+(max-y1)*step}" x2="${pad+x2*step}" y2="${pad+(max-y2)*step}" class="reflect-guide"/>`;
        }
      }
    }
    const transformedShape=(stage==='transform' || stage==='answer') ? `<polygon points="${transPoly}" class="shape-transformed"/>${labels(transformed,"A′",'#ef6c00')}` : '';
    const answerLabel = stage==='answer' ? `<text x="${size/2}" y="26" text-anchor="middle" font-size="18" font-weight="700">${esc(kind)}</text>` : '';
    return `<div class="svg-wrap"><svg class="math-diagram coordinate-diagram animated-coordinate-diagram" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(kind)} on a graph"><defs><marker id="transform-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ef6c00"/></marker><marker id="transform-arrow-blue" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#1565c0"/></marker></defs><g>${lines}</g><line x1="${pad}" y1="${gridEnd}" x2="${gridEnd+8}" y2="${gridEnd}" class="axis-line"/><line x1="${pad}" y1="${gridEnd}" x2="${pad}" y2="${pad-8}" class="axis-line"/><text x="${gridEnd+16}" y="${gridEnd+5}" font-size="13" font-weight="700">x</text><text x="${pad-5}" y="${pad-18}" font-size="13" font-weight="700">y</text><polygon points="${basePoly}" class="shape-original"/>${labels(base,'A','#244a81')}${transformedShape}${extra}${answerLabel}</svg></div>`;
  }

  AR.buildTransformationFrames=(animation)=>{
    const kind=animation.kind;
    const titles={translation:['Plot the original shape','Slide the shape','Identify the transformation'],rotation:['Plot the original shape','Turn the shape around a point','Identify the transformation'],reflection:['Plot the original shape','Flip the shape across the line','Identify the transformation']};
    const texts={translation:['Look at the original shape on the graph.','The shape slides without turning or flipping.','This movement is a translation.'],rotation:['Look at the original shape on the graph.','The shape turns around a fixed point.','This movement is a rotation.'],reflection:['Look at the original shape on the graph.','The shape flips across a mirror line.','This movement is a reflection.']};
    return {type:'transformation-visual',...animation,frames:[{stage:'draw',title:titles[kind][0],text:texts[kind][0]},{stage:'transform',title:titles[kind][1],text:texts[kind][1]},{stage:'answer',title:titles[kind][2],text:texts[kind][2]}]};
  };

  AR.renderTransformation=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${transformationSvg(model.kind,model.base,model.transformed,f.stage,{dx:model.dx,dy:model.dy,center:model.center,mirror:model.mirror})}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };


  function samplePopulationSvg(isSample, stage){
    const total=20, asked=isSample?6:20;
    const cells=[];
    for(let i=0;i<total;i++){
      const x=28+(i%5)*56,y=34+Math.floor(i/5)*46;
      const highlight=stage!=='group' && i<asked;
      const dim=stage==='answer' && isSample && i>=asked;
      cells.push(`<g class="survey-person ${highlight?'asked':''} ${dim?'dim':''}"><circle cx="${x+12}" cy="${y+10}" r="7"/><rect x="${x+5}" y="${y+20}" width="14" height="18" rx="4"/></g>`);
    }
    const label=stage==='answer'?`<text x="150" y="228" text-anchor="middle" font-size="18" font-weight="700">${isSample?'Sample':'Population'}</text>`:'';
    return `<div class="svg-wrap"><svg class="math-diagram survey-diagram" viewBox="0 0 300 240" role="img" aria-label="sample or population">${cells.join('')}${label}</svg></div>`;
  }

  AR.buildSamplePopulationFrames=(isSample,scenario)=>({type:'sample-population-visual',isSample,scenario,frames:[
    {stage:'group',title:'Look at the whole group',text:'Start with the full group of people.'},
    {stage:'asked',title:isSample?'Highlight only some people':'Highlight everyone',text:isSample?'Only part of the group was surveyed.':'Every person in the group was surveyed.'},
    {stage:'answer',title:'Name the type of data set',text:isSample?'Because only some people were asked, this is a sample.':'Because everyone was asked, this is a population.'}
  ]});
  AR.renderSamplePopulation=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${samplePopulationSvg(model.isSample,f.stage)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };

  function simpleBarChartSvg(labels,vals,{title='',highlight=[],showValues=false,compare=null,showDiff=false}={}){
    const W=360,H=260,padL=44,padB=36,padT=36,padR=16,maxV=Math.max(...vals,10),chartH=H-padT-padB,chartW=W-padL-padR,barW=Math.min(46, chartW/(vals.length*1.5)), gap=(chartW-barW*vals.length)/(vals.length+1);
    let g='';
    for(let t=0;t<=maxV;t+=Math.max(1,Math.ceil(maxV/5))){ const y=H-padB-(t/maxV)*chartH; g+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" class="grid-line"/><text x="${padL-12}" y="${y+4}" text-anchor="end" font-size="11">${t}</text>`; }
    vals.forEach((v,i)=>{ const x=padL+gap+i*(barW+gap), h=(v/maxV)*chartH, y=H-padB-h; const active=highlight.includes(i); g+=`<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" class="chart-bar ${active?'active':''} ${compare&&compare.includes(i)?'compare':''}"/>`; g+=`<text x="${x+barW/2}" y="${H-14}" text-anchor="middle" font-size="12">${esc(labels[i])}</text>`; if(showValues || active) g+=`<text x="${x+barW/2}" y="${y-8}" text-anchor="middle" font-size="13" font-weight="700">${v}</text>`; });
    if(showDiff && compare){ const [a,b]=compare; const xa=padL+gap+a*(barW+gap)+barW/2, xb=padL+gap+b*(barW+gap)+barW/2; const y=Math.min(H-padB-(vals[a]/maxV)*chartH,H-padB-(vals[b]/maxV)*chartH)-24; g+=`<line x1="${xa}" y1="${y}" x2="${xb}" y2="${y}" class="diff-line"/><text x="${(xa+xb)/2}" y="${y-8}" text-anchor="middle" font-size="13" font-weight="700">difference ${Math.abs(vals[a]-vals[b])}</text>`; }
    return `<div class="svg-wrap"><svg class="math-diagram chapter9-bar-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="bar chart"><text x="${W/2}" y="20" text-anchor="middle" font-size="15" font-weight="700">${esc(title)}</text>${g}<line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" class="axis-line"/><line x1="${padL}" y1="${H-padB}" x2="${padL}" y2="${padT-6}" class="axis-line"/></svg></div>`;
  }

  AR.buildGroupedDataFrames=(labels,vals,maxIndex)=>({type:'grouped-data-visual',labels,vals,maxIndex,frames:[
    {stage:'show',title:'Look at the data',text:'Compare the numbers for each category.'},
    {stage:'find',title:'Find the largest value',text:`The largest value belongs to ${labels[maxIndex]}.`},
    {stage:'answer',title:'Name the answer',text:`${labels[maxIndex]} has the most votes.`}
  ]});
  AR.renderGroupedData=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; const hi=f.stage==='show'?[]:[model.maxIndex]; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${simpleBarChartSvg(model.labels,model.vals,{title:'Grouped Data',highlight:hi,showValues:f.stage!=='show'})}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };

  AR.buildBarReadFrames=(labels,vals,target,title)=>({type:'bar-read-visual',labels,vals,target,title,frames:[
    {stage:'show',title:'Find the correct category',text:`Locate category ${labels[target]} on the graph.`},
    {stage:'read',title:'Read the bar height',text:`The bar for ${labels[target]} reaches ${vals[target]}.`},
    {stage:'answer',title:'State the value',text:`So the answer is ${vals[target]}.`}
  ]});
  AR.renderBarRead=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${simpleBarChartSvg(model.labels,model.vals,{title:model.title,highlight:f.stage==='show'?[]:[model.target],showValues:f.stage!=='show'})}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };

  AR.buildCompareBarsFrames=(labels,vals,a,b,ans,title)=>({type:'compare-bars-visual',labels,vals,a,b,ans,title,frames:[
    {stage:'pick',title:'Find the two bars',text:`Look at ${labels[a]} and ${labels[b]}.`},
    {stage:'read',title:'Read both values',text:`${labels[a]} is ${vals[a]} and ${labels[b]} is ${vals[b]}.`},
    {stage:'subtract',title:'Find the difference',text:`Subtract to find the difference: ${ans}.`}
  ]});
  AR.renderCompareBars=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; const showVals=f.stage!=='pick'; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${simpleBarChartSvg(model.labels,model.vals,{title:model.title,highlight:[model.a,model.b],compare:[model.a,model.b],showValues:showVals,showDiff:f.stage==='subtract'})}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };

  function probabilityItemsSvg(total,fav,stage,kind='theoretical'){
    const cols=Math.min(5,total), rows=Math.ceil(total/cols), size=38;
    const items=[];
    for(let i=0;i<total;i++){
      const x=24+(i%cols)*52, y=28+Math.floor(i/cols)*52;
      const good=i<fav;
      let cls='prob-item';
      if(stage!=='show-total' && good) cls+=' favorable';
      if(stage==='show-fav' && !good) cls+=' dim';
      items.push(`<g class="${cls}"><circle cx="${x+16}" cy="${y+16}" r="14"/><text x="${x+16}" y="${y+21}" text-anchor="middle" font-size="12" font-weight="700">${i+1}</text></g>`);
    }
    const eq=stage==='answer'?`<text x="150" y="${rows*52+44}" text-anchor="middle" font-size="18" font-weight="700">${fav}/${total}</text>`:'';
    return `<div class="svg-wrap"><svg class="math-diagram probability-diagram" viewBox="0 0 300 ${rows*52+60}" role="img" aria-label="probability model">${items.join('')}${eq}</svg></div>`;
  }

  AR.buildTheoreticalProbabilityFrames=(total,fav,simplified)=>({type:'theoretical-probability-visual',total,fav,simplified,frames:[
    {stage:'show-total',title:'Look at all possible outcomes',text:`There are ${total} equally likely outcomes in total.`},
    {stage:'show-fav',title:'Count favorable outcomes',text:`${fav} of the ${total} outcomes are favorable.`},
    {stage:'answer',title:'Write the probability',text:`Probability = favorable ÷ total = ${simplified[0]}/${simplified[1]}.`}
  ]});
  AR.renderTheoreticalProbability=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${probabilityItemsSvg(model.total,model.fav,f.stage,'theoretical')}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };

  function experimentalProbabilitySvg(trials,success,stage,simplified){
    const fail=trials-success, w=300, h=110, x=20, y=30, bw=260;
    const sucW=bw*(success/trials);
    const answer=stage==='answer'?`<text x="150" y="98" text-anchor="middle" font-size="18" font-weight="700">${success}/${trials} = ${simplified[0]}/${simplified[1]}</text>`:'';
    return `<div class="svg-wrap"><svg class="math-diagram probability-diagram" viewBox="0 0 ${w} ${h}" role="img" aria-label="experimental probability"><rect x="${x}" y="${y}" width="${bw}" height="24" rx="10" class="trial-bar total"/>${stage!=='show-total'?`<rect x="${x}" y="${y}" width="${sucW}" height="24" rx="10" class="trial-bar success"/>`:''}<text x="${x+bw/2}" y="24" text-anchor="middle" font-size="14">${trials} total trials</text>${stage!=='show-total'?`<text x="${x+sucW/2}" y="47" text-anchor="middle" font-size="13" font-weight="700">${success} successes</text><text x="${x+sucW+(bw-sucW)/2}" y="47" text-anchor="middle" font-size="13">${fail} other outcomes</text>`:''}${answer}</svg></div>`;
  }
  AR.buildExperimentalProbabilityFrames=(trials,success,simplified)=>({type:'experimental-probability-visual',trials,success,simplified,frames:[
    {stage:'show-total',title:'Count all trials',text:`There were ${trials} trials altogether.`},
    {stage:'show-success',title:'Count the successes',text:`The event happened ${success} times.`},
    {stage:'answer',title:'Write the experimental probability',text:`Experimental probability = ${success}/${trials} = ${simplified[0]}/${simplified[1]}.`}
  ]});
  AR.renderExperimentalProbability=(model,index=0)=>{ const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))]; return `<div class="line-relationship-animation"><div class="placeholder-visual-board">${experimentalProbabilitySvg(model.trials,model.success,f.stage,model.simplified)}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`; };


  function simpleNumberLineHtml(start,end,current,mid=null,opts={}){
    const total=end-start;
    const labelEvery=opts.labelEvery || (total<=12 ? 1 : total<=20 ? 2 : 5);
    const emphasis=new Set(opts.emphasis||[]);
    const marks=[];
    for(let n=start;n<=end;n++){
      const pct=((n-start)/total)*100;
      const showLabel = n===start || n===end || n===current || n===mid || emphasis.has(n) || ((n-start)%labelEvery===0);
      marks.push(`<div class="mini-line-mark" style="left:${pct}%"><span class="mini-line-tick ${showLabel?'major':''}"></span>${showLabel?`<span class="mini-line-label ${n===current?'active':''} ${n===mid?'mid':''} ${emphasis.has(n)?'emphasis':''}">${n}</span>`:''}</div>`);
    }
    const pointPct=((current-start)/total)*100;
    const midPct=mid===null?null:((mid-start)/total)*100;
    return `<div class="mini-number-line"><div class="mini-line-track"></div>${marks.join('')}${midPct!==null?`<div class="mini-midpoint" style="left:${midPct}%">midpoint</div>`:''}<div class="mini-line-point" style="left:${pointPct}%"></div></div>`;
  }


  function frogJumpNumberLineSvg(start,end,current,jumps=[],opts={}){
    const total=end-start;
    const W=560,H=170,left=34,right=526,baseY=108;
    const labelEvery=opts.labelEvery || (total<=12 ? 1 : total<=20 ? 2 : 5);
    const emphasis=new Set(opts.emphasis||[]);
    const xFor=n=> left + ((n-start)/total)*(right-left);
    let marks='';
    for(let n=start;n<=end;n++){
      const x=xFor(n);
      const showLabel = n===start || n===end || n===current || emphasis.has(n) || ((n-start)%labelEvery===0);
      const major=showLabel;
      marks += `<line x1="${x}" y1="${baseY-12}" x2="${x}" y2="${baseY}" class="frog-tick ${major?'major':''}"/>`;
      if(showLabel){
        marks += `<text x="${x}" y="${baseY+24}" text-anchor="middle" class="frog-label ${n===current?'active':''} ${emphasis.has(n)?'emphasis':''}">${n}</text>`;
      }
    }
    const allPads=new Set([start,current,...(opts.extraPads||[]),...Array.from(emphasis)]);
    const lilyPads=[...allPads].sort((a,b)=>a-b).map(n=>`<ellipse cx="${xFor(n)}" cy="${baseY+8}" rx="15" ry="6" class="lily-pad ${n===current?'active':''}"/>`).join('');
    const jumpPaths=jumps.map((j,idx)=>{
      const x1=xFor(j.from), x2=xFor(j.to), mid=(x1+x2)/2;
      const arcH=Math.max(26, Math.min(56, Math.abs(x2-x1)*0.35));
      const color=j.color || (idx===0?'#1e88e5':'#ef6c00');
      const stepText=j.step?`<text x="${mid}" y="${baseY-arcH-26}" text-anchor="middle" class="frog-step-label" fill="${color}">Step ${j.step}</text>`:'';
      const ghost=j.showFrogAtEnd?`<text x="${x2}" y="${baseY-18}" text-anchor="middle" class="frog-emoji trail">🐸</text><circle cx="${x2}" cy="${baseY-2}" r="7" class="frog-landing trail"/>`:'';
      return `<path d="M ${x1} ${baseY-2} Q ${mid} ${baseY-arcH} ${x2} ${baseY-2}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/><text x="${mid}" y="${baseY-arcH-10}" text-anchor="middle" class="frog-jump-label" fill="${color}">${esc(j.label||'')}</text>${stepText}${ghost}`;
    }).join('');
    const frogX=xFor(current);
    return `<div class="svg-wrap frog-line-wrap"><svg class="math-diagram frog-number-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Frog jumping on a number line"><line x1="${left}" y1="${baseY}" x2="${right}" y2="${baseY}" class="frog-axis"/>${lilyPads}${marks}${jumpPaths}<text x="${frogX}" y="${baseY-18}" text-anchor="middle" class="frog-emoji current">🐸</text><circle cx="${frogX}" cy="${baseY-2}" r="7" class="frog-landing current"/></svg></div>`;
  }

  AR.buildMentalAdditionStrategyFrames=(a,b,tens,ones,total)=>({type:'mental-addition-strategy',a,b,tens,ones,total,frames:[
    {stage:'split',title:'Break apart the second number',text:`Split ${b} into ${tens} and ${ones}.`},
    {stage:'tens',title:'Add the tens first',text:`Start at ${a} and jump ${tens} to land on ${a+tens}.`},
    {stage:'ones',title:'Add the ones next',text:`Then jump ${ones} more to land on ${total}.`},
    {stage:'answer',title:'State the total',text:`So ${a} + ${b} = ${total}.`}
  ]});
  AR.renderMentalAdditionStrategy=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    let visual='';
    if(f.stage==='split'){
      visual=`<div class="mental-addition-board"><div class="equation-strip"><span>${model.a}</span><span>+</span><span class="split-box">${model.b}</span><span>=</span><span>?</span></div><div class="split-arrow-row"><div class="split-piece">${model.tens}</div><div class="split-piece">${model.ones}</div></div><div class="subline">${model.b} = ${model.tens} + ${model.ones}</div></div>`;
    } else if(f.stage==='tens'){
      visual=`<div class="mental-addition-board"><div class="equation-strip"><span>${model.a}</span><span>+</span><span>${model.tens}</span><span>=</span><span>${model.a+model.tens}</span></div>${frogJumpNumberLineSvg(model.a,model.total,model.a+model.tens,[{from:model.a,to:model.a+model.tens,label:'Jump +'+model.tens,color:'#1e88e5'}],{emphasis:[model.a,model.a+model.tens]})}<div class="jump-caption jump-tens">The frog lands on ${model.a+model.tens}.</div></div>`;
    } else if(f.stage==='ones'){
      const start=model.a+model.tens;
      visual=`<div class="mental-addition-board"><div class="equation-strip"><span>${start}</span><span>+</span><span>${model.ones}</span><span>=</span><span>${model.total}</span></div>${frogJumpNumberLineSvg(model.a,model.total,model.total,[{from:model.a,to:start,label:'Jump +'+model.tens,color:'#1e88e5',step:1,showFrogAtEnd:true},{from:start,to:model.total,label:'Jump +'+model.ones,color:'#ef6c00',step:2}],{emphasis:[model.a,start,model.total],extraPads:[start]})}<div class="double-jump-row"><span class="jump-badge tens">+${model.tens}</span><span class="jump-badge ones">+${model.ones}</span></div></div>`;
    } else {
      visual=`<div class="mental-addition-board"><div class="equation-strip final"><span>${model.a}</span><span>+</span><span>${model.b}</span><span>=</span><span>${model.total}</span></div>${frogJumpNumberLineSvg(model.a,model.total,model.total,[{from:model.a,to:model.a+model.tens,label:'+'+model.tens,color:'#1e88e5',step:1,showFrogAtEnd:true},{from:model.a+model.tens,to:model.total,label:'+'+model.ones,color:'#ef6c00',step:2}],{emphasis:[model.a,model.a+model.tens,model.total],extraPads:[model.a+model.tens]})}<div class="strategy-summary"><div>${model.b} = ${model.tens} + ${model.ones}</div><div>${model.a} + ${model.tens} = ${model.a+model.tens}</div><div>${model.a+model.tens} + ${model.ones} = ${model.total}</div></div></div>`;
    }
    return `<div class="visual-animation"><div class="visual-board">${visual}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  function baseTenBlockHtml(h,t,o,stage='all'){
    const hundreds=(stage==='hundreds'||stage==='tens'||stage==='ones'||stage==='all')?Array.from({length:h},(_,i)=>`<div class="base-hundred"><span>100</span></div>`).join(''):'';
    const tens=(stage==='tens'||stage==='ones'||stage==='all')?Array.from({length:t},(_,i)=>`<div class="base-ten"><span>10</span></div>`).join(''):'';
    const ones=(stage==='ones'||stage==='all')?Array.from({length:o},(_,i)=>`<div class="base-one"><span>1</span></div>`).join(''):'';
    return `<div class="base-ten-wrap"><div class="base-group"><div class="base-group-label">Hundreds</div><div class="base-group-grid hundreds">${hundreds||'<div class="base-empty">0</div>'}</div></div><div class="base-group"><div class="base-group-label">Tens</div><div class="base-group-grid tens">${tens||'<div class="base-empty">0</div>'}</div></div><div class="base-group"><div class="base-group-label">Ones</div><div class="base-group-grid ones">${ones||'<div class="base-empty">0</div>'}</div></div></div>`;
  }

  AR.buildBaseTenRepresentationFrames=(n,h,t,o)=>({type:'base-ten-representation',n,h,t,o,frames:[
    {stage:'hundreds',title:'Show the hundreds',text:`${n} has ${h} hundred${h===1?'':'s'}.`},
    {stage:'tens',title:'Show the tens',text:`It also has ${t} ten${t===1?'':'s'}.`},
    {stage:'ones',title:'Show the ones',text:`And it has ${o} one${o===1?'':'s'}.`},
    {stage:'answer',title:'Write the representation',text:`So ${n} = ${h} hundreds, ${t} tens, and ${o} ones.`}
  ]});
  AR.renderBaseTenRepresentation=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const summary=f.stage==='answer'?`<div class="base-ten-summary">${model.n} = ${model.h*100} + ${model.t*10} + ${model.o}</div><div class="fraction-visual-answer">${model.h} hundreds, ${model.t} tens, ${model.o} ones</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${baseTenBlockHtml(model.h,model.t,model.o,f.stage)}${summary}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildPercentToFractionFrames=(p,frac)=>({type:'percent-to-fraction-visual',p,frac,frames:[
    {stage:'grid',title:'Shade the percent',text:`${p}% means ${p} out of 100.`},
    {stage:'fraction',title:'Write it as a fraction',text:`So write ${p}/100.`},
    {stage:'simplify',title:'Simplify the fraction',text:`Simplify ${p}/100 to ${frac}.`},
    {stage:'answer',title:'State the equivalent fraction',text:`${p}% = ${frac}.`}
  ]});
  AR.renderPercentToFraction=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const grid=hundredGridHtml(model.p,`${model.p}/100 shaded`,{previous:0});
    const eq=['fraction','simplify','answer'].includes(f.stage)?`<div class="percent-link-row"><span>${model.p}%</span><span>=</span><span>${model.p}/100</span>${['simplify','answer'].includes(f.stage)?`<span>=</span><span>${esc(model.frac)}</span>`:''}</div>`:'';
    const answer=f.stage==='answer'?`<div class="fraction-visual-answer">${esc(model.frac)}</div>`:'';
    return `<div class="visual-animation"><div class="visual-board">${grid}${eq}${answer}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildRoundingJustifyFrames=(a,rounded,ones)=>{
    const left=Math.floor(a/10)*10, right=left+10, midpoint=left+5;
    return {type:'rounding-justify-visual',a,rounded,ones,left,right,midpoint,frames:[
      {stage:'ones',title:'Look at the ones digit',text:`The ones digit is ${ones}.`},
      {stage:'line',title:'Place the number on a number line',text:`${a} lies between ${left} and ${right}.`},
      {stage:'decide',title:'Decide which ten is closer',text:`Because ${ones>=5?'the ones digit is 5 or more':'the ones digit is less than 5'}, ${a} rounds to ${rounded}.`},
      {stage:'answer',title:'State the rounded number',text:`The nearest ten is ${rounded}.`}
    ]};
  };
  AR.renderRoundingJustify=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    let visual='';
    if(f.stage==='ones'){
      visual=`<div class="rounding-digit-card"><div class="place-value-number"><span class="pv-tens">${Math.floor(model.a/10)*10}</span><span class="pv-ones highlight">+ ${model.ones}</span></div><div class="subline">The ones digit tells us whether to round up or down.</div></div>`;
    } else {
      const line=decimalLineHtml(model.left,model.right,model.a,{showTicks:true,showPoint:true,showMidpoint:['decide','answer'].includes(f.stage),highlight:['decide','answer'].includes(f.stage)?(model.rounded===model.left?'left':'right'):'',precision:0});
      const note=['decide','answer'].includes(f.stage)?`<div class="rounding-decision ${model.ones>=5?'up':'down'}">${model.ones>=5?'Round up':'Round down'} → ${model.rounded}</div>`:'';
      visual=`${line}${note}${f.stage==='answer'?`<div class="fraction-visual-answer">${model.a} → ${model.rounded}</div>`:''}`;
    }
    return `<div class="visual-animation"><div class="visual-board">${visual}</div><div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div><div class="animation-progress">Step ${index+1} of ${model.frames.length}</div></div>`;
  };

  AR.buildGuidedSolutionFrames=(problem)=>{
    const R=A.Renderers.Math;
    const steps=problem.solution||[];
    const frames=[{
      title:'Understand the problem',
      text:'Read the question carefully and identify what you need to find.',
      currentHtml:R.problemPrompt(problem),
      revealed:[],
      final:false
    }];
    steps.forEach((step,i)=>{
      const html=R.solutionContent(step);
      frames.push({
        title:`Step ${i+1}`,
        text:'Work through this part before moving to the next step.',
        currentHtml:html,
        revealed:steps.slice(0,i).map(x=>R.solutionContent(x)),
        final:false
      });
    });
    frames.push({
      title:'Final answer',
      text:`The solution is ${problem.answer}.`,
      currentHtml:`<div class="guided-final-answer">${R.escape(problem.answer)}</div>`,
      revealed:steps.map(x=>R.solutionContent(x)),
      final:true
    });
    return {type:'guided-solution',frames};
  };

  AR.renderGuidedSolution=(model,index=0)=>{
    const f=model.frames[Math.max(0,Math.min(index,model.frames.length-1))];
    const revealed=(f.revealed||[]).map((html,i)=>`<div class="guided-history-item"><span class="guided-check">✓</span><div>${html}</div></div>`).join('');
    return `<div class="guided-animation" data-frame="${index}">
      ${revealed?`<div class="guided-history">${revealed}</div>`:''}
      <div class="guided-current ${f.final?'final':''}">
        <div class="guided-current-label">${esc(f.title)}</div>
        <div class="guided-current-content">${f.currentHtml}</div>
      </div>
      <div class="animation-explanation"><strong>${esc(f.title)}</strong><div>${esc(f.text)}</div></div>
      <div class="animation-progress">Step ${index+1} of ${model.frames.length}</div>
    </div>`;
  };

  AR.createController=(problem,container)=>{
    if(!problem?.animation) return null;
    let model, renderer;
    if(problem.animation.type==='column-addition'){
      model=AR.buildAdditionFrames(problem.animation.a,problem.animation.b);
      renderer=AR.renderAddition;
    } else if(problem.animation.type==='column-subtraction'){
      model=AR.buildSubtractionFrames(problem.animation.a,problem.animation.b);
      renderer=AR.renderSubtraction;
    } else if(problem.animation.type==='column-multiplication'){
      model=AR.buildMultiplicationFrames(problem.animation.a,problem.animation.b);
      renderer=AR.renderMultiplication;
    } else if(problem.animation.type==='word-product-clipart'){
      model=AR.buildWordProductClipFrames(problem.animation.contextType,problem.animation.groupLabel,problem.animation.itemLabel,problem.animation.unit,problem.animation.count,problem.animation.each,problem.animation.answer);
      renderer=AR.renderWordProductClip;
    } else if(problem.animation.type==='pattern-arrows'){
      model=AR.buildPatternArrowFrames(problem.animation.mode,problem.animation.terms,problem.animation.delta,problem.animation.factor,problem.animation.answer);
      renderer=AR.renderPatternArrows;
    } else if(problem.animation.type==='pattern-rule-discovery'){
      model=AR.buildPatternRuleDiscoveryFrames(problem.animation.terms,problem.animation.delta);
      renderer=AR.renderPatternRuleDiscovery;
    } else if(problem.animation.type==='rule-machine'){
      model=AR.buildRuleMachineFrames(problem.animation.rate,problem.animation.pairs,problem.animation.x,problem.animation.answer);
      renderer=AR.renderRuleMachine;
    } else if(problem.animation.type==='placeholder-visual'){
      model=AR.buildPlaceholderVisualFrames(problem.animation);
      renderer=AR.renderPlaceholderVisual;
    } else if(problem.animation.type==='rectangle-missing-side'){
      model=AR.buildMissingSideAreaFrames(problem.animation.length,problem.animation.width,problem.animation.area);
      renderer=AR.renderMissingSideArea;
    } else if(problem.animation.type==='line-relationship-visual'){
      model=AR.buildLineRelationshipFrames(problem.animation.relationship);
      renderer=AR.renderLineRelationship;
    } else if(problem.animation.type==='solid-properties-visual'){
      model=AR.buildSolidPropertiesFrames(problem.animation.solid,problem.animation.ask,problem.animation.counts);
      renderer=AR.renderSolidProperties;
    } else if(problem.animation.type==='coordinate-read-visual'){
      model=AR.buildCoordinateReadFrames(problem.animation.point,problem.animation.label);
      renderer=AR.renderCoordinateRead;
    } else if(problem.animation.type==='coordinate-translate-visual'){
      model=AR.buildCoordinateTranslateFrames(problem.animation.point,problem.animation.translated,problem.animation.dx,problem.animation.dy,problem.animation.label);
      renderer=AR.renderCoordinateTranslate;
    } else if(problem.animation.type==='transformation-visual'){
      model=AR.buildTransformationFrames(problem.animation);
      renderer=AR.renderTransformation;
    } else if(problem.animation.type==='sample-population-visual'){
      model=AR.buildSamplePopulationFrames(problem.animation.isSample,problem.animation.scenario);
      renderer=AR.renderSamplePopulation;
    } else if(problem.animation.type==='grouped-data-visual'){
      model=AR.buildGroupedDataFrames(problem.animation.labels,problem.animation.vals,problem.animation.maxIndex);
      renderer=AR.renderGroupedData;
    } else if(problem.animation.type==='bar-read-visual'){
      model=AR.buildBarReadFrames(problem.animation.labels,problem.animation.vals,problem.animation.target,problem.animation.title);
      renderer=AR.renderBarRead;
    } else if(problem.animation.type==='compare-bars-visual'){
      model=AR.buildCompareBarsFrames(problem.animation.labels,problem.animation.vals,problem.animation.a,problem.animation.b,problem.animation.ans,problem.animation.title);
      renderer=AR.renderCompareBars;
    } else if(problem.animation.type==='theoretical-probability-visual'){
      model=AR.buildTheoreticalProbabilityFrames(problem.animation.total,problem.animation.fav,problem.animation.simplified);
      renderer=AR.renderTheoreticalProbability;
    } else if(problem.animation.type==='experimental-probability-visual'){
      model=AR.buildExperimentalProbabilityFrames(problem.animation.trials,problem.animation.success,problem.animation.simplified);
      renderer=AR.renderExperimentalProbability;
    } else if(problem.animation.type==='mental-addition-strategy'){
      model=AR.buildMentalAdditionStrategyFrames(problem.animation.a,problem.animation.b,problem.animation.tens,problem.animation.ones,problem.animation.total);
      renderer=AR.renderMentalAdditionStrategy;
    } else if(problem.animation.type==='base-ten-representation'){
      model=AR.buildBaseTenRepresentationFrames(problem.animation.n,problem.animation.h,problem.animation.t,problem.animation.o);
      renderer=AR.renderBaseTenRepresentation;
    } else if(problem.animation.type==='percent-to-fraction-visual'){
      model=AR.buildPercentToFractionFrames(problem.animation.p,problem.animation.frac);
      renderer=AR.renderPercentToFraction;
    } else if(problem.animation.type==='rounding-justify-visual'){
      model=AR.buildRoundingJustifyFrames(problem.animation.a,problem.animation.rounded,problem.animation.ones);
      renderer=AR.renderRoundingJustify;
    } else if(problem.animation.type==='long-division'){
      model=AR.buildDivisionFrames(problem.animation.dividend,problem.animation.divisor);
      renderer=AR.renderDivision;
    } else if(problem.animation.type==='word-to-numeral'){
      model=AR.buildWordToNumeralFrames(problem.animation.n,problem.animation.words); renderer=AR.renderWordToNumeral;
    } else if(problem.animation.type==='numeral-to-word'){
      model=AR.buildNumeralToWordFrames(problem.animation.n,problem.animation.words); renderer=AR.renderNumeralToWord;
    } else if(problem.animation.type==='place-value'){
      model=AR.buildPlaceValueFrames(problem.animation.n,problem.animation.targetIndex,problem.animation.value); renderer=AR.renderPlaceValue;
    } else if(problem.animation.type==='expanded-form'){
      model=AR.buildExpandedFormFrames(problem.animation.n); renderer=AR.renderExpandedForm;
    } else if(problem.animation.type==='compare-numbers'){
      model=AR.buildCompareFrames(problem.animation.a,problem.animation.b); renderer=AR.renderCompare;
    } else if(problem.animation.type==='order-numbers'){
      model=AR.buildOrderFrames(problem.animation.nums,problem.animation.ascending); renderer=AR.renderOrder;
    } else if(problem.animation.type==='rounding'){
      model=AR.buildRoundingFrames(problem.animation.n,problem.animation.place,problem.animation.answer); renderer=AR.renderRounding;
    } else if(problem.animation.type==='estimate-sum'){
      model=AR.buildEstimateFrames(problem.animation.a,problem.animation.b,problem.animation.place,problem.animation.ra,problem.animation.rb,problem.animation.answer); renderer=AR.renderEstimate;
    } else if(problem.animation.type==='fraction-of-whole'){
      model=AR.buildFractionOfWholeFrames(problem.animation.n,problem.animation.d); renderer=AR.renderFractionOfWhole;
    } else if(problem.animation.type==='equivalent-fraction'){
      model=AR.buildEquivalentFractionFrames(problem.animation.n,problem.animation.d,problem.animation.k,problem.animation.targetN,problem.animation.targetD); renderer=AR.renderEquivalentFraction;
    } else if(problem.animation.type==='fraction-compare'){
      model=AR.buildFractionCompareFrames(problem.animation.n1,problem.animation.d1,problem.animation.n2,problem.animation.d2,problem.animation.sym,problem.animation.lcm); renderer=AR.renderFractionCompare;
    } else if(problem.animation.type==='decimal-rounding'){
      model=AR.buildDecimalRoundingFrames(problem.animation.n,problem.animation.place,problem.animation.ans); renderer=AR.renderDecimalRounding;
    } else if(problem.animation.type==='decimal-to-fraction-visual'){
      model=AR.buildDecimalToFractionVisualFrames(problem.animation.dec,problem.animation.hundredths,problem.animation.simpN,problem.animation.simpD); renderer=AR.renderDecimalToFractionVisual;
    } else if(problem.animation.type==='fraction-to-decimal-visual'){
      model=AR.buildFractionToDecimalVisualFrames(problem.animation.n,problem.animation.d,problem.animation.ans); renderer=AR.renderFractionToDecimalVisual;
    } else if(problem.animation.type==='decimal-percent-visual'){
      model=AR.buildDecimalPercentVisualFrames(problem.animation.mode,problem.animation.p,problem.animation.dec); renderer=AR.renderDecimalPercentVisual;
    } else if(problem.animation.type==='decimal-addition'){
      model=AR.buildDecimalAdditionFrames(problem.animation.a,problem.animation.b); renderer=AR.renderDecimalAddition;
    } else if(problem.animation.type==='decimal-subtraction'){
      model=AR.buildDecimalSubtractionFrames(problem.animation.a,problem.animation.b); renderer=AR.renderDecimalSubtraction;
    } else if(problem.animation.type==='money-chain-add'){
      model=AR.buildMoneyChainAdditionFrames(problem.animation.values,problem.animation.labels,problem.animation.finalLabel); renderer=AR.renderMoneyChainAddition;
    } else if(problem.animation.type==='count-money-detailed'){
      model=AR.buildCountMoneyDetailedFrames(problem.animation.items,problem.animation.finalLabel); renderer=AR.renderCountMoneyDetailed;
    } else if(problem.animation.type==='budget-balance'){
      model=AR.buildBudgetBalanceFrames(problem.animation.income,problem.animation.expenses,problem.animation.spent,problem.animation.answer); renderer=AR.renderBudgetBalance;
    } else if(problem.animation.type==='unit-price-compare'){
      model=AR.buildUnitPriceCompareFrames(problem.animation.q1,problem.animation.p1,problem.animation.u1,problem.animation.q2,problem.animation.p2,problem.animation.u2,problem.animation.best); renderer=AR.renderUnitPriceCompare;
    } else if(problem.animation.type==='hst-calc'){
      model=AR.buildHSTFrames(problem.animation.price,problem.animation.tax,problem.animation.total); renderer=AR.renderHSTCalc;
    } else if(problem.animation.type==='guided-solution'){
      model=AR.buildGuidedSolutionFrames(problem); renderer=AR.renderGuidedSolution;
    } else return null;

    let index=0, timer=null;
    const render=()=>{
      container.querySelector('[data-animation-stage]').innerHTML=renderer(model,index);
      const prev=container.querySelector('[data-animation-prev]');
      const next=container.querySelector('[data-animation-next]');
      if(prev) prev.disabled=index===0;
      if(next) next.disabled=index===model.frames.length-1;
    };
    const stop=()=>{
      if(timer){clearInterval(timer);timer=null;}
      const play=container.querySelector('[data-animation-play]');
      if(play) play.textContent='Play';
    };
    const next=()=>{if(index<model.frames.length-1){index++;render();}else stop();};
    const prev=()=>{if(index>0){index--;render();}};
    container.querySelector('[data-animation-next]')?.addEventListener('click',()=>{stop();next();});
    container.querySelector('[data-animation-prev]')?.addEventListener('click',()=>{stop();prev();});
    container.querySelector('[data-animation-replay]')?.addEventListener('click',()=>{stop();index=0;render();});
    container.querySelector('[data-animation-play]')?.addEventListener('click',e=>{
      if(timer){stop();return;}
      if(index===model.frames.length-1) index=0;
      render();
      e.currentTarget.textContent='Pause';
      timer=setInterval(next,1800);
    });
    render();
    return {stop};
  };
})(MathApp);
