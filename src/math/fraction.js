(function(A){
  class Fraction{
    constructor(n,d=1){if(d===0)throw new Error('Denominator cannot be 0');if(d<0){n=-n;d=-d;}this.n=n;this.d=d;}
    simplify(){const g=A.Math.Utils.gcd(this.n,this.d);return new Fraction(this.n/g,this.d/g);}
    value(){return this.n/this.d;}
    equals(other){const a=this.simplify(),b=other.simplify();return a.n===b.n&&a.d===b.d;}
    add(other){return new Fraction(this.n*other.d+other.n*this.d,this.d*other.d).simplify();}
    sub(other){return new Fraction(this.n*other.d-other.n*this.d,this.d*other.d).simplify();}
    toString(){const s=this.simplify();return `${s.n}/${s.d}`;}
    static parse(s){
      const t=String(s).trim();
      let m=t.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
      if(m){const whole=Number(m[1]),n=Number(m[2]),d=Number(m[3]);return new Fraction(Math.sign(whole||1)*(Math.abs(whole)*d+n),d);}
      m=t.match(/^(-?\d+)\s*\/\s*(-?\d+)$/); if(m)return new Fraction(Number(m[1]),Number(m[2]));
      if(/^[-+]?\d+(\.\d+)?$/.test(t)){const num=Number(t);if(Number.isInteger(num))return new Fraction(num,1);const dec=t.split('.')[1].length;return new Fraction(Math.round(num*10**dec),10**dec).simplify();}
      return null;
    }
  }
  A.Math.Fraction=Fraction;
})(MathApp);
