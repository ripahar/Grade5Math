(function(A){
 const G=A.Core.Graders={};
 G.numeric=(expected,{tolerance=1e-9}={})=>(input)=>{const v=A.Math.Utils.parseNumber(input);return Number.isFinite(v)&&Math.abs(v-expected)<=tolerance;};
 G.text=(expected)=>(input)=>A.Math.Utils.normalizeText(input)===A.Math.Utils.normalizeText(expected);
 G.oneOf=(values)=>(input)=>values.map(v=>A.Math.Utils.normalizeText(v)).includes(A.Math.Utils.normalizeText(input));
 G.symbol=(expected)=>(input)=>String(input).trim()===expected;
 G.fraction=(expected,{requireSimplest=false}={})=>(input)=>{const f=A.Math.Fraction.parse(input);if(!f)return false;if(requireSimplest){const s=f.simplify();if(s.n!==f.n||s.d!==f.d)return false;}return f.equals(expected);};
 G.ratio=(a,b,{simplest=true}={})=>(input)=>{const m=String(input).trim().match(/^(\d+)\s*[:\/]\s*(\d+)$/);if(!m)return false;let x=Number(m[1]),y=Number(m[2]);if(simplest){const g=A.Math.Utils.gcd(a,b);a/=g;b/=g;}return x===a&&y===b;};
 G.orderedList=(expected)=>(input)=>String(input).split(/[ ,;]+/).filter(Boolean).map(Number).join(',')===expected.join(',');
 G.selfCheck=()=>()=>null;
})(MathApp);
