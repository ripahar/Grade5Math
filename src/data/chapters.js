(function(A){
 A.Data.chapters=[
  {id:1,title:'Number Concepts',sections:[
   {id:'1.1',title:'Representing and Describing Whole Numbers'},
   {id:'1.2',title:'Comparing and Ordering Numbers'},
   {id:'1.3',title:'Rounding and Estimation'}]},
  {id:2,title:'Number Operations',sections:[
   {id:'2.1',title:'Adding and Subtracting Whole Numbers'},
   {id:'2.2',title:'Mental Mathematics for Multiplying'},
   {id:'2.3',title:'Multiplying Whole Numbers'},
   {id:'2.4',title:'Dividing Whole Numbers'},
   {id:'2.5',title:'Communicating with Ratios'},
   {id:'2.6',title:'Rates'}]},
  {id:3,title:'Fractions and Decimals',sections:[
   {id:'3.1',title:'Comparing Fractions'},
   {id:'3.2',title:'Equivalent Fractions'},
   {id:'3.3',title:'Understanding and Rounding Decimals'},
   {id:'3.4',title:'Relating Decimals and Fractions'},
   {id:'3.5',title:'Addition and Subtraction of Decimals'},
   {id:'3.6',title:'Decimals and Percent'}]},
  {id:4,title:'Financial Literacy',sections:[
   {id:'4.1',title:'Our Money System'},
   {id:'4.2',title:'Calculating with Money'},
   {id:'4.3',title:'What Are Taxes?'},
   {id:'4.4',title:'Financial Planning'}]},
  {id:5,title:'Patterns',sections:[
   {id:'5.1',title:'Pattern Rules and Descriptions'},
   {id:'5.2',title:'Representing Patterns'}]},
  {id:6,title:'Variables and Equations',sections:[
   {id:'6.1',title:'Mathematical Sentences and Placeholders'},
   {id:'6.2',title:'Mathematical and Word Sentences'},
   {id:'6.3',title:'Variables and Equations'},
   {id:'6.4',title:'Solving Inequalities'},
   {id:'6.5',title:'Solving Word Problems'}]},
  {id:7,title:'Measurement',sections:[
   {id:'7.1',title:'Perimeter and Area'},
   {id:'7.2',title:'Drawing Rectangles'},
   {id:'7.3',title:'Measuring Angles and Constructing Triangles'},
   {id:'7.4',title:'Units of Length'}]},
  {id:8,title:'Lines, Shapes, and Transformations',sections:[
   {id:'8.1',title:'Characteristics of 2-Dimensional Shapes'},
   {id:'8.2',title:'Characteristics of 3-Dimensional Objects'},
   {id:'8.3',title:'Plotting Points in the First Quadrant'},
   {id:'8.4',title:'Transformations of 2-D Shapes'}]},
  {id:9,title:'Data and Probability',sections:[
   {id:'9.1',title:'Samples and Populations'},
   {id:'9.2',title:'Grouping and Interpreting Data'},
   {id:'9.3',title:'Displaying Data and Bar Graphs'},
   {id:'9.4',title:'Double Bar Graphs'},
   {id:'9.5',title:'Probability of an Event'}]},
  {id:10,title:'Social and Emotional Learnings',sections:[
   {id:'10.1',title:'Communicating'},
   {id:'10.2',title:'Representing'},
   {id:'10.3',title:'Connecting and Relating'},
   {id:'10.4',title:'Reasoning and Proving'}]},
  {id:11,title:'Coding',sections:[
   {id:'11.1',title:'The Structure of Coding'},
   {id:'11.2',title:'Simplifying the Code'},
   {id:'11.3',title:'Code Blocks'},
   {id:'11.4',title:'Conditional Statements'},
   {id:'11.5',title:'Writing Code in Scratch'}]}
 ];
 A.Data.findSection=(id)=>{for(const c of A.Data.chapters){const s=c.sections.find(x=>x.id===id);if(s)return {...s,chapter:c};}return null;};
})(MathApp);
