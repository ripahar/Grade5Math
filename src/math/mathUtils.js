(function(A){
  const M=A.Math.Utils={};
  M.gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
  M.lcm=(a,b)=>Math.abs(a*b)/M.gcd(a,b);
  M.roundTo=(n,place)=>Math.round(n/place)*place;
  M.clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  M.formatNumber=(n)=>{
    if(!Number.isFinite(Number(n))) return String(n);
    const [i,d]=String(n).split('.');
    const sign=i.startsWith('-')?'-':'';
    const raw=sign?i.slice(1):i;
    const spaced=raw.length>4?raw.replace(/\B(?=(\d{3})+(?!\d))/g,' '):raw;
    return sign+spaced+(d?'.'+d:'');
  };
  const ones=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function under1000(n){
    let s=[]; if(n>=100){s.push(ones[Math.floor(n/100)]+' hundred');n%=100;}
    if(n>=20){s.push(tens[Math.floor(n/10)]+(n%10?'-'+ones[n%10]:''));}
    else if(n>0 || s.length===0){if(n>0) s.push(ones[n]);}
    return s.join(' ');
  }
  M.numberToWords=(n)=>{
    n=Math.trunc(Number(n)); if(n===0)return 'zero'; if(n<0)return 'negative '+M.numberToWords(-n);
    const parts=[];
    if(n>=1000){parts.push(under1000(Math.floor(n/1000))+' thousand');n%=1000;}
    if(n>0)parts.push(under1000(n));
    return parts.join(' ');
  };
  M.normalizeText=s=>String(s??'').toLowerCase().trim().replace(/[–—]/g,'-').replace(/\s+/g,' ').replace(/\band\b/g,'').replace(/\s+/g,' ').trim();
  M.currency=n=>'$'+Number(n).toFixed(2);
  M.parseNumber=s=>Number(String(s).replace(/[$,%\s,]/g,''));
})(MathApp);
