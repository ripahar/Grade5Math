(function(A){
  const R=A.Renderers.Math={};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  R.escape=esc;
  R.frac=(n,d)=>`<span class="fraction" aria-label="${esc(n)} over ${esc(d)}"><span class="num">${esc(n)}</span><span class="den">${esc(d)}</span></span>`;
  R.mixed=(w,n,d)=>`${esc(w)} ${R.frac(n,d)}`;
  R.problemPrompt=(p)=>{
    if(typeof p.prompt==='function') return p.prompt(R);
    return p.promptHtml || esc(p.prompt || '');
  };
  R.solutionContent=(step)=>{
    if(step.html) return step.html;
    if(step.lines) return R.equationLines(step.lines, step.label);
    if(step.fraction) return R.frac(step.fraction[0],step.fraction[1]);
    return esc(step.text||'');
  };

  const columnNumber=value=>String(value).replace(/[\s,]/g,'');

  R.vertical=(top,bottom,op,result)=>{
    return `<div class="vertical-math"><div>${esc(columnNumber(top))}</div><div>${esc(op)} ${esc(columnNumber(bottom))}</div><div class="bar">${esc(columnNumber(result||''))}</div></div>`;
  };

  R.verticalDecimal=(top,bottom,op,result='')=>{
    const normalize=v=>String(v).replace(/[\s,]/g,'');
    const [ti,td='']=normalize(top).split('.');
    const [bi,bd='']=normalize(bottom).split('.');
    const [ri,rd='']=normalize(String(result||'')).split('.');
    const maxInt=Math.max(ti.length,bi.length,ri.length||0);
    const maxDec=Math.max(td.length,bd.length,rd.length||0,2);
    const fmt=(intPart,decPart)=>`${' '.repeat(maxInt-intPart.length)}${intPart}.${decPart.padEnd(maxDec,'0')}`;
    const res = result==='' ? '?'.padStart(maxInt+1+maxDec,' ') : fmt(ri||'',rd||'');
    return `<div class="vertical-math decimal"><div>${esc(fmt(ti,td))}</div><div>${esc(op)} ${esc(fmt(bi,bd))}</div><div class="bar">${esc(res)}</div></div>`;
  };

  R.longMultiplication=(a,b)=>{
    const multiplicand=columnNumber(a), multiplier=columnNumber(b);
    const digits=String(multiplier).split('').reverse().map(Number);
    const partials=digits.map((d,i)=>d*Number(multiplicand)*10**i);
    const rows = [
      ['',''+multiplicand],
      ['×',''+multiplier],
      ...partials.map(v=>['',''+v]),
    ];
    const width=Math.max(String(a*b).length, ...rows.map(r=>r[1].length));
    const tr=(label,val,cls='')=>`<tr class="${cls}"><td class="op">${esc(label)}</td><td class="num">${esc(String(val).padStart(width,' '))}</td></tr>`;
    return `<div class="long-work"><div class="long-title">Long multiplication</div><table class="arith-table"><tbody>${tr('', multiplicand)}${tr('×', multiplier, 'with-bar')}${partials.map(v=>tr('', v)).join('')}${partials.length>1?`<tr class="light-bar"><td colspan="2"></td></tr>`:''}${tr('', a*b,'total')}</tbody></table></div>`;
  };

  R.longDivisionWork=(dividend,divisor)=>{
    const digits=String(dividend).split('').map(Number);
    let current=0, quotient='';
    const steps=[];
    digits.forEach((digit,idx)=>{
      current = current*10 + digit;
      if(current < divisor && quotient!==''){
        quotient += '0';
        steps.push({partial: current, qdigit: 0, product: 0, remainder: current, bring: idx < digits.length-1 ? digits[idx+1] : ''});
        return;
      }
      if(current >= divisor){
        const qdigit = Math.floor(current/divisor);
        const product = qdigit*divisor;
        const remainder = current-product;
        quotient += qdigit;
        steps.push({partial: current, qdigit, product, remainder, bring: idx < digits.length-1 ? digits[idx+1] : ''});
        current = remainder;
      }
    });
    const qNum = Math.floor(dividend/divisor), rem = dividend%divisor;
    const rows = steps.map((s,i)=>`<tr><td>${i+1}</td><td>${s.partial}</td><td>${s.qdigit}</td><td>${s.product}</td><td>${s.remainder}</td><td>${s.bring!==''?s.bring:'—'}</td></tr>`).join('');
    return `<div class="long-work"><div class="long-title">Long division</div><div class="division-summary"><strong>${dividend} ÷ ${divisor} = ${qNum}${rem?` R${rem}`:''}</strong></div><table class="work-table"><thead><tr><th>Step</th><th>Partial dividend</th><th>Quotient digit</th><th>Subtract</th><th>Remainder</th><th>Bring down</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  R.equationLines=(lines,label='')=>`<div class="equation-stack">${label?`<div class="equation-label">${esc(label)}</div>`:''}${lines.map(line=>`<div class="equation-line">${esc(line)}</div>`).join('')}</div>`;

  R.calcTable=(rows,headers=null)=>`<table class="work-table">${headers?`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`:''}<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  R.longDivision=(dividend,divisor)=>{
    const q=Math.floor(dividend/divisor), rem=dividend%divisor;
    return `<div class="long-division">${esc(String(q)+(rem?' R'+rem:''))}\n${esc(divisor)} ) ${esc(dividend)}</div>`;
  };
})(MathApp);
