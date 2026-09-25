(function (A) {
  const R = A.Core.Random = {};
  R.int = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  R.choice = arr => arr[R.int(0,arr.length-1)];
  R.shuffle = arr => {
    const out=[...arr];
    for(let i=out.length-1;i>0;i--){const j=R.int(0,i);[out[i],out[j]]=[out[j],out[i]];}
    return out;
  };
  R.nonZeroDigit = () => R.int(1,9);
  R.multipleOf = (n,minFactor=1,maxFactor=12) => n*R.int(minFactor,maxFactor);
  R.bool = (p=.5) => Math.random()<p;
})(MathApp);
