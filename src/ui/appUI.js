(function(A){
 const UI=A.UI, R=A.Renderers.Math;
 const esc=R.escape;
 function chapterNav(selectedSection){
   return `<aside class="sidebar no-print"><h2>Chapters</h2>${A.Data.chapters.map(c=>{
     const active=c.sections.some(s=>s.id===selectedSection);
     return `<div><button class="chapter-btn ${active?'active':''}" data-chapter="${c.id}">Chapter ${c.id}: ${esc(c.title)}</button><div class="section-list" ${active?'':'hidden'}>${c.sections.map(s=>`<button class="section-btn ${s.id===selectedSection?'active':''}" data-section="${s.id}">${esc(s.id)} ${esc(s.title)}</button>`).join('')}</div></div>`;
   }).join('')}</aside>`;
 }
 function controls(sectionId,typeId,difficulty){
   const defs=A.Core.Registry.bySection(sectionId);
   return `<div class="toolbar no-print">
    <div class="field"><label>Problem type</label><select id="problemType">${defs.map(d=>`<option value="${d.id}" ${d.id===typeId?'selected':''}>${esc(d.title)}</option>`).join('')}</select></div>
    <div class="field"><label>Difficulty</label><select id="difficulty"><option value="easy" ${difficulty==='easy'?'selected':''}>Easy</option><option value="medium" ${difficulty==='medium'?'selected':''}>Medium</option><option value="challenge" ${difficulty==='challenge'?'selected':''}>Challenge</option><option value="mixed" ${difficulty==='mixed'?'selected':''}>Mixed</option></select></div>
    <button class="btn secondary" id="newProblem">New similar problem</button>
   </div>`;
 }
 function rewardStrip(){
   const r=A.Services.Storage.rewards?.()||{learning:0,mastery:0};
   return `<div class="reward-strip no-print"><div class="reward-pill"><span class="reward-icon small">⭐</span><strong>${r.learning||0}</strong><span>Learning stickers</span></div><div class="reward-pill mastery"><span class="reward-icon big">🏆</span><strong>${r.mastery||0}</strong><span>Mastery stickers</span></div></div>`;
 }
 function problemCard(p){
   const self=p.selfCheck;
   return `<article class="question-card" id="questionCard">
      <div class="question-meta"><span class="badge">${esc(p.section)}</span><span class="badge">${esc(p.title)}</span><span class="badge">${esc(p.difficulty)}</span></div>
      <div class="prompt">${R.problemPrompt(p)}</div>
      <div class="answer-row no-print">
        <input id="answerInput" class="answer-input" type="text" autocomplete="off" placeholder="${self?'Write your explanation':'Enter your answer'}" aria-label="Your answer" />
        <button id="checkAnswer" class="btn primary">${self?'Compare reasoning':'Grade answer'}</button>
        <button id="showSolution" class="btn">Show step-by-step</button>
        ${p.animation?'<button id="showAnimation" class="btn secondary">Animate solution</button>':''}
      </div>
      <div id="answerPreview" class="preview no-print">${esc(p.answerPreview||'')}</div>
      <div id="feedback" class="feedback no-print"></div>
      <div id="solution" class="solution" hidden></div>
   </article>`;
 }
 UI.practice=(state)=>{
   const sec=A.Data.findSection(state.sectionId); if(!sec)return '<div class="empty">No section selected.</div>';
   return `<div class="layout">${chapterNav(state.sectionId)}<section>${rewardStrip()}<div class="panel" style="margin-bottom:16px"><h2 style="margin-top:0">${sec.chapter.id}. ${esc(sec.chapter.title)}</h2><h3>${esc(sec.id)} ${esc(sec.title)}</h3><p class="notice">Questions are generated from reusable problem families. Use “New similar problem” for another variation of the same skill.</p></div>${controls(state.sectionId,state.typeId,state.difficulty)}${problemCard(state.problem)}</section></div>`;
 };
 UI.solution=(p)=>`<h3>Step-by-step solution</h3>${(p.solution||[]).map((s,i)=>`<div class="solution-step"><div class="step-num">${i+1}</div><div>${R.solutionContent(s)}</div></div>`).join('')}<p><strong>Answer:</strong> ${esc(p.answer)}</p>`;
 UI.animation=(p)=>{const subtitles={
   'column-addition':'Watch carrying happen one column at a time.',
   'column-subtraction':'Watch regrouping and borrowing happen one column at a time.',
   'column-multiplication':'Watch each partial product appear in the correct place-value position, then add them.',
   'word-product-clipart':'See a clip-art example of equal groups, then connect it to multiplication and solve the real problem.',
   'pattern-arrows':'Watch the pattern grow and see the same rule repeat between terms.',
   'pattern-rule-discovery':'Compare each gap until the repeating pattern rule becomes clear.',
   'rule-machine':'Send inputs through a rule machine and watch the outputs appear.',
   'placeholder-visual':'Use a balance, part-whole bar, or equal groups to reveal the missing number.',
   'rectangle-missing-side':'Draw the rectangle, turn the missing side into x, then solve the equation step by step.',
   'line-relationship-visual':'See the lines drawn, identify the key feature, then name their relationship.',
   'solid-properties-visual':'Look at the solid, highlight the requested feature, then count it.',
   'coordinate-read-visual':'Trace from the point to the axes, then write the ordered pair.',
   'coordinate-translate-visual':'Watch the point move on the graph horizontally and vertically, then read the new coordinates.',
   'transformation-visual':'See the shape on a graph, watch how it moves, then identify the transformation.',
   'sample-population-visual':'See the whole group, then highlight some or all people to decide between sample and population.',
   'grouped-data-visual':'Compare the categories visually and highlight the largest value.',
   'bar-read-visual':'Highlight the target bar and read its height from the graph.',
   'compare-bars-visual':'Highlight two bars and subtract to find the difference.',
   'theoretical-probability-visual':'See favorable outcomes and total outcomes, then write the probability.',
   'experimental-probability-visual':'See successes out of all trials, then write the experimental probability.',
   'mental-addition-strategy':'Break apart the second number and use visual jumps on a number line.',
   'base-ten-representation':'Show the number with hundreds, tens, and ones blocks.',
   'percent-to-fraction-visual':'Shade a hundred grid, then connect percent to a simplified fraction.',
   'rounding-justify-visual':'Use the ones digit and a number line to justify the rounding.',
   'long-division':'Watch divide → multiply → subtract → bring down, one step at a time.',
   'word-to-numeral':'Watch the numeral fill into a place-value chart.',
   'numeral-to-word':'Watch the numeral turn into words by place-value groups.',
   'place-value':'Watch the target digit and its value become clear.',
   'expanded-form':'Watch each non-zero digit become its expanded-form value.',
   'compare-numbers':'Watch the numbers compare from the greatest place value to the right.',
   'order-numbers':'Watch the numbers move into the correct order.',
   'rounding':'Watch the rounding digit and deciding digit get highlighted.',
   'estimate-sum':'Watch both numbers round first, then add for an estimate.',
   'fraction-of-whole':'See the shaded parts and total parts build the fraction.',
   'equivalent-fraction':'Watch a fraction bar split into smaller equal pieces.',
   'fraction-compare':'Compare two fraction bars visually.',
   'decimal-rounding':'Place the decimal on a number line and round to the nearest value.',
   'decimal-to-fraction-visual':'Use a hundred grid to connect a decimal to a fraction.',
   'fraction-to-decimal-visual':'Use a visual model to connect a fraction to a decimal.',
   'decimal-percent-visual':'Watch the hundred grid fill, then connect percent, fraction, and decimal.',
   'decimal-addition':'Add decimals by place value, with carrying shown above the columns.',
   'decimal-subtraction':'Subtract decimals by place value, with regrouping shown when needed.',
   'money-chain-add':'Add the money amounts one decimal step at a time.',
   'count-money-detailed':'Multiply each group of money first, then add the subtotals.',
   'budget-balance':'Add the expenses, then subtract them from the income.',
   'unit-price-compare':'Find and compare the unit prices step by step.',
   'hst-calc':'Find the HST, then add it to the price using decimal addition.',
   'guided-solution':'Work through the solution one visual step at a time.'
 };const subtitle=subtitles[p.animation?.type]||'Watch the calculation happen one step at a time.';return `<div class="animation-panel no-print" id="animationPanel"><div class="animation-heading"><div><h3>Animated solution</h3><p>${esc(subtitle)}</p></div></div><div data-animation-stage></div><div class="animation-controls"><button class="btn" data-animation-prev>Previous</button><button class="btn primary" data-animation-play>Play</button><button class="btn" data-animation-next>Next</button><button class="btn ghost" data-animation-replay>Replay</button></div></div>`;};
 UI.worksheetBuilder=(state)=>{
   const chapter=A.Data.chapters.find(c=>c.id===state.worksheetChapter) || A.Data.chapters[0];
   return `<section class="panel no-print"><h2>Worksheet Builder</h2><div class="grid-2"><div class="field"><label>Chapter</label><select id="wsChapter">${A.Data.chapters.map(c=>`<option value="${c.id}" ${c.id===chapter.id?'selected':''}>Chapter ${c.id}: ${esc(c.title)}</option>`).join('')}</select></div><div class="field"><label>Section</label><select id="wsSection">${chapter.sections.map(s=>`<option value="${s.id}" ${s.id===state.worksheetSection?'selected':''}>${esc(s.id)} ${esc(s.title)}</option>`).join('')}</select></div><div class="field"><label>Questions</label><input id="wsCount" type="number" min="1" max="50" value="${state.worksheetCount||12}" /></div><div class="field"><label>Difficulty</label><select id="wsDifficulty"><option>easy</option><option selected>mixed</option><option>medium</option><option>challenge</option></select></div></div><div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button id="generateWorksheet" class="btn primary">Generate worksheet</button><label style="display:flex;align-items:center;gap:7px"><input id="includeAnswers" type="checkbox" checked /> Include answer key</label></div></section><div id="worksheetOutput" style="margin-top:18px"></div>`;
 };
 UI.worksheet=(problems,includeAnswers=true)=>{
   if(!problems.length)return '<div class="panel empty">No problem generators are available for this section yet.</div>';
   const sec=A.Data.findSection(problems[0].section);
   return `<section class="worksheet panel"><div class="worksheet-header"><div><h2 style="margin:0">Grade 5 Mathematics Practice</h2><div>${esc(sec.id)} ${esc(sec.title)}</div></div><div>Name: ____________________<br>Date: ____________________</div></div>${problems.map((p,i)=>`<div class="worksheet-item"><strong>${i+1}.</strong> ${R.problemPrompt(p)}<span class="worksheet-answer-line"></span></div>`).join('')}${includeAnswers?`<section class="answer-key"><h2>Answer Key</h2>${problems.map((p,i)=>`<p><strong>${i+1}.</strong> ${esc(p.answer)}</p>`).join('')}</section>`:''}</section><div class="no-print" style="margin-top:12px"><button class="btn primary" onclick="window.print()">Print Letter-size worksheet</button></div>`;
 };
 UI.progress=()=>{
   const p=A.Services.Storage.load(),pct=p.attempts?Math.round(100*p.correct/p.attempts):0;
   const chapterRows=A.Data.chapters.map(c=>{const ids=A.Core.Registry.all().filter(x=>x.chapter===c.id).map(x=>x.id),a=ids.reduce((s,id)=>s+(p.byType[id]?.attempts||0),0),k=ids.reduce((s,id)=>s+(p.byType[id]?.correct||0),0),pc=a?Math.round(k/a*100):0;return `<div class="stat"><strong>${pc}%</strong><div>Chapter ${c.id}: ${esc(c.title)}</div><small>${k} correct out of ${a} graded attempts</small><div class="progress-bar"><span style="width:${pc}%"></span></div></div>`;}).join('');
   return `<section><div class="panel"><h2>Progress</h2><div class="grid-3"><div class="stat"><strong>${p.attempts}</strong>Total attempts</div><div class="stat"><strong>${p.correct}</strong>Correct answers</div><div class="stat"><strong>${pct}%</strong>Overall accuracy</div></div><div class="reward-progress"><div class="stat"><strong>⭐ ${p.rewards?.learning||0}</strong>Learning stickers</div><div class="stat"><strong>🏆 ${p.rewards?.mastery||0}</strong>Mastery stickers</div></div><div style="margin-top:20px" class="grid-2">${chapterRows}</div><div style="margin-top:18px"><button id="resetProgress" class="btn danger">Reset progress</button></div></div></section>`;
 };
})(MathApp);
