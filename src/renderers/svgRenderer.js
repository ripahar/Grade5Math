(function(A){
 const S=A.Renderers.SVG={};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

 S.rectangle=(w,h,labels=true)=>{
   const W=300,H=190;
   const widthValue=parseFloat(w), heightValue=parseFloat(h);
   const safeW=Number.isFinite(widthValue)&&widthValue>0?widthValue:10;
   const safeH=Number.isFinite(heightValue)&&heightValue>0?heightValue:6;
   const displayW=String(w), displayH=String(h);
   // Keep extreme proportions readable without hiding either dimension label.
   const maxRw=190,maxRh=105,minRw=90,minRh=48;
   const ratio=safeW/safeH;
   let rw=maxRw,rh=maxRh;
   if(ratio>=1){rh=Math.max(minRh,Math.min(maxRh,maxRw/ratio));}
   else {rw=Math.max(minRw,Math.min(maxRw,maxRh*ratio));}
   const x=45,y=45;
   const widthLabelX=x+rw/2;
   const heightLabelX=x+rw+14;
   const heightLabelY=y+rh/2;
   return `<div class="svg-wrap"><svg class="math-diagram rectangle-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rectangle ${esc(displayW)} by ${esc(displayH)}"><rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="none" stroke="currentColor" stroke-width="2"/>${labels?`<text x="${widthLabelX}" y="31" text-anchor="middle" font-size="16">${esc(displayW)}</text><text x="${heightLabelX}" y="${heightLabelY}" font-size="16" dominant-baseline="middle">${esc(displayH)}</text>`:''}</svg></div>`;
 };

 S.coordinateGrid=(point,translated=null)=>{
   const size=330,pad=48,step=34,max=7; let lines='';
   const gridEnd=pad+max*step;
   for(let i=0;i<=max;i++){
     const x=pad+i*step,y=pad+(max-i)*step;
     lines+=`<line x1="${x}" y1="${pad}" x2="${x}" y2="${gridEnd}" class="grid-line"/><line x1="${pad}" y1="${pad+i*step}" x2="${gridEnd}" y2="${pad+i*step}" class="grid-line"/><text x="${x}" y="${gridEnd+22}" text-anchor="middle" font-size="12">${i}</text><text x="${pad-20}" y="${y+4}" text-anchor="middle" font-size="12">${i}</text>`;
   }
   const dot=(pt,cls,label)=>{
     const x=pad+pt[0]*step,y=pad+(max-pt[1])*step;
     const dx=pt[0]>=6?-10:10, anchor=pt[0]>=6?'end':'start';
     const dy=pt[1]>=6?14:-10;
     return `<circle cx="${x}" cy="${y}" r="5.5" class="${cls}"/><text x="${x+dx}" y="${y+dy}" text-anchor="${anchor}" font-size="13" font-weight="700">${esc(label)}</text>`;
   };
   return `<div class="svg-wrap"><svg class="math-diagram coordinate-diagram" viewBox="0 0 ${size} ${size}" role="img" aria-label="First quadrant coordinate grid"><g>${lines}</g><line x1="${pad}" y1="${gridEnd}" x2="${gridEnd+8}" y2="${gridEnd}" class="axis-line"/><line x1="${pad}" y1="${gridEnd}" x2="${pad}" y2="${pad-8}" class="axis-line"/><text x="${gridEnd+16}" y="${gridEnd+5}" font-size="13" font-weight="700">x</text><text x="${pad-5}" y="${pad-18}" font-size="13" font-weight="700">y</text>${dot(point,'point-primary','A')}${translated?dot(translated,'point-secondary','A′'):''}</svg></div>`;
 };

 S.barChart=(labels,values,title='Data')=>{
   const W=480,H=300,left=55,right=25,top=55,bottom=235;
   const chartW=W-left-right,chartH=bottom-top;
   const maxValue=Math.max(...values,1);
   const tickMax=Math.max(5,Math.ceil(maxValue/5)*5);
   const n=labels.length, gap=22;
   const barW=Math.min(58,(chartW-gap*(n+1))/n);
   const totalBars=n*barW+(n-1)*gap;
   const startX=left+(chartW-totalBars)/2;
   let grid='',bars='';
   for(let i=0;i<=5;i++){
     const v=tickMax*i/5,y=bottom-chartH*i/5;
     grid+=`<line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" class="chart-grid"/><text x="${left-10}" y="${y+4}" text-anchor="end" font-size="11">${Number.isInteger(v)?v:v.toFixed(1)}</text>`;
   }
   labels.forEach((lab,i)=>{
     const bh=chartH*values[i]/tickMax,x=startX+i*(barW+gap),y=bottom-bh;
     bars+=`<rect x="${x}" y="${y}" width="${barW}" height="${bh}" class="chart-bar"/><text x="${x+barW/2}" y="${bottom+22}" text-anchor="middle" font-size="12">${esc(lab)}</text><text x="${x+barW/2}" y="${Math.max(top+12,y-7)}" text-anchor="middle" font-size="12" font-weight="700">${esc(values[i])}</text>`;
   });
   return `<div class="svg-wrap"><svg class="math-diagram bar-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)} bar graph"><text x="${W/2}" y="27" text-anchor="middle" font-size="17" font-weight="700">${esc(title)}</text>${grid}<line x1="${left}" y1="${bottom}" x2="${W-right}" y2="${bottom}" class="axis-line"/><line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" class="axis-line"/>${bars}</svg></div>`;
 };

 S.fractionBar=(n,d)=>{
   const W=340,H=105,x=35,y=34,totalW=270,cellW=totalW/d;let r='';
   for(let i=0;i<d;i++) r+=`<rect x="${x+i*cellW}" y="${y}" width="${cellW}" height="42" class="fraction-cell ${i<n?'shaded':''}"/>`;
   return `<div class="svg-wrap"><svg class="math-diagram fraction-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fraction model with ${n} of ${d} parts shaded">${r}<text x="${W/2}" y="94" text-anchor="middle" font-size="12">${n} shaded of ${d} equal parts</text></svg></div>`;
 };
})(MathApp);
