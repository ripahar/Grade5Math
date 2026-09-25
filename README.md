# Grade 5 Math Practice Lab

A browser-based Grade 5 mathematics practice application built from a modular problem-generator architecture.

## Run it

Open `index.html` directly in Chrome, Edge, Firefox, or Safari. No server or installation is required.

## What is included

- Chapter/section index for all 11 chapters in the supplied Grade 5 workbook.
- Randomized problem families across every chapter, including whole numbers, operations, fractions/decimals, financial literacy, patterns, equations, measurement, geometry, data/probability, mathematical reasoning, and coding logic.
- Text answer entry and automatic grading for closed-response questions.
- Open-response/self-check handling for reasoning and communication prompts.
- Step-by-step solution display.
- Letter-size worksheet generator with optional answer key.
- Browser-local progress tracking.
- HTML/SVG math visuals for fractions, coordinate grids, rectangles, and graphs.

## Architecture

The code is intentionally separated by responsibility:

- `src/data/chapters.js`: chapter and section metadata only.
- `src/core/problemRegistry.js`: central registry and generator lookup.
- `src/core/graders.js`: reusable answer graders.
- `src/math/`: mathematical domain utilities such as fractions and number formatting.
- `src/renderers/`: math/diagram presentation only; no grading logic.
- `src/problems/chapterXX.js`: problem-family definitions by chapter.
- `src/services/`: storage and worksheet generation.
- `src/ui/`: browser UI rendering.
- `src/app.js`: orchestration/state only.

The design uses composition rather than a deep inheritance hierarchy. Adding a new problem type normally means adding one registry definition to the appropriate chapter module; the practice view, worksheet generator, progress system, printing, and solution UI automatically pick it up.

## Problem definition contract

Each registered problem type has metadata and a `generate()` method. A generated problem supplies:

- prompt or `promptHtml`
- expected answer
- grader function
- step-by-step solution array
- optional answer-entry guidance

Example skeleton:

```js
MathApp.Core.Registry.register({
  id: '3.2.example',
  chapter: 3,
  section: '3.2',
  title: 'Example skill',
  generate: ({ difficulty, Random }) => ({
    prompt: 'Question text',
    answer: '42',
    grader: MathApp.Core.Graders.numeric(42),
    solution: [
      { text: 'Step 1...' },
      { text: 'Step 2...' }
    ]
  })
});
```

## Notes for further expansion

This first application version establishes the complete architecture and a broad set of generators across all chapters. The workbook contains additional sub-variants, diagram-heavy exercises, and open-ended items. Those can be added incrementally without changing the application core.

Recommended next expansion pass:

1. Audit every exercise page and create a formal problem-family coverage matrix.
2. Add any remaining workbook-specific subtypes.
3. Expand the SVG layer for protractor-style angle diagrams, 3-D solids, double-bar graphs, and transformation drawings.
4. Add richer fraction/mixed-number input widgets if desired.
5. Add automated unit tests for every generator/grader pair.


## Detailed step-by-step solutions

The solution engine now emphasizes worked calculations rather than generic instructions. Arithmetic, fractions, decimals, money, patterns, equations, measurement, data/probability, and coding problems show the actual intermediate calculations where applicable. Conceptual geometry/data questions show the reasoning sequence that leads to the answer.

## Variation and Challenge update (v5)

- Scenario-based word problems now draw from multiple wording/context templates so **New similar problem** changes both the values and the story wording.
- Reviewed scenario-style generators across Number Operations, Financial Literacy, Patterns, Variables & Equations, Measurement, Data & Probability, Social/Emotional Applications, and Coding.
- Chapter 2.3 **Challenge** multiplication now generates **3-digit × 2-digit** whole-number multiplication and uses the same worked long-multiplication solution renderer.

## Animation Phase 2
- Animated column subtraction is now available in **2.1 Subtract whole numbers**.
- The animation shows regrouping/borrowing before the subtraction step, including borrowing across one or more zeroes.
- Changed top digits are displayed with the original digit crossed out and the regrouped value highlighted.
- Previous / Play / Pause / Next / Replay controls are available, matching the addition animation controls.

## Animation Phase 3
- Animated long multiplication is now available in **2.3 Multiply whole numbers**.
- The animation highlights the active digit in the multiplier, reveals each aligned partial product, explains the place-value shift for tens, and then adds the partial products to produce the final product.
- Challenge mode continues to use **3-digit × 2-digit** multiplication and is supported by the animation.
- Previous / Play / Pause / Next / Replay controls match the addition and subtraction animations.

## Multiplication animation carry refinement

Phase 3 multiplication now animates each top digit separately, shows the incoming carry above the active top digit, shows the newly created carry moving to the next place on the left, and reveals each partial-product digit as it is calculated. This applies to 2-digit × 2-digit and Challenge 3-digit × 2-digit multiplication.

## Phase 4 animation
Long division problems in section 2.4 now include an animated walkthrough using the cycle: divide → multiply → subtract → bring down. The animation supports both exact division and division with remainders, including zero quotient digits inside the quotient.

## Chapter 1 animation pass
Chapter 1 now includes animated solution walkthroughs for all eight registered problem families: word number to numeral, numeral to word number, digit place value, expanded form, comparing numbers, ordering numbers, rounding, and estimating a sum by rounding. The animations use place-value charts, progressive highlighting, ordering cards, and rounding decision cues while preserving the existing static solutions and graders.

## Guided animations for Chapters 3–11
Chapters 3 through 11 now expose an **Animate solution** walkthrough for every registered problem family. The animation reveals the worked solution one stage at a time, preserves existing math/SVG visuals, keeps earlier completed stages visible for context, and supports Previous / Play / Pause / Next / Replay. Specialized Chapter 1 and Chapter 2 animations remain unchanged.


## Chapter 3 pictorial animation pass
- Replaced the generic guided Chapter 3 animations for key visual topics with more pictorial walkthroughs.
- Fraction of a whole, comparing fractions, equivalent fractions, rounding decimals, decimal-to-fraction, fraction-to-decimal, and decimal-percent now use visual models such as fraction bars, hundred grids, and number lines.
- Decimal addition and subtraction remain in the worked-solution format for now.


## Chapter 3 animation refinements (v17)
- Compare-fractions animation now explicitly shows the numerator and denominator multiplication used to create common denominators.
- Equivalent-fractions animation now explicitly shows the denominator scale factor and the matching numerator multiplication.
- Decimal rounding now uses a subdivided number line with tick marks, midpoint, animated point placement, and nearest-endpoint highlighting.
- Decimal-to-fraction and fraction-to-decimal hundred grids now fill progressively instead of appearing fully shaded at once.
- Decimal addition and subtraction now have place-value column animations with aligned decimal points, carrying, and regrouping.
- Decimal-percent animations now progressively fill the hundred grid before revealing percent, fraction, and decimal equivalences.


## Chapter 4 animation upgrade
- Added Chapter 4 animated solutions using decimal-style arithmetic similar to Chapter 3.5.
- Count money and total cost now add money amounts step by step.
- Make change uses animated decimal subtraction.
- Unit price compares both unit rates step by step.
- HST shows 13% → 0.13, computes the tax, then adds tax to price.
- Budget adds expenses first, then subtracts them from the income.

- Refined Chapter 4 again to include multiplication steps where applicable, especially in counting money and HST calculations.


## Chapter 4 multiplication animation refinement
- Chapter 4 multiplication steps now reuse the Chapter 2.3 long-multiplication animation style, including digit-by-digit multiplication, carrying, partial products, and final decimal placement where applicable.
- 4.1 money counting now animates each quantity × denomination multiplication before adding the money subtotals.
- 4.3 HST now animates price × 0.13 using the same long-multiplication engine, then restores the decimal point and continues with the animated addition of tax to price.

- Count Canadian money animation now includes a running summary table of each multiplication subtotal, with row highlighting to show what has been computed and what is being added into the running total.


## Chapter 2.3 multiplication word-problem clip art
- Added a new animated solution type for multiplication word problems.
- Uses simple clip-art style visuals for boxes, sticker packs, rows of chairs, bags, trays, and teams.
- Shows a small conceptual demo with 3 groups of 4, then connects repeated addition to multiplication, then applies the same principle to the real problem and solves it with long multiplication.


## Chapter 5 pattern animation upgrade
- Add/subtract patterns now animate term cards with repeated rule arrows.
- Multiplicative patterns animate repeated × rules and compact visual dot groups.
- Rule-description problems reveal each constant difference before displaying the final rule.
- Table relationships now use an input → rule machine → output animation.


## Chapter 6.1 placeholder animation
- Replaced the generic 6.1 walkthrough with visual placeholder models.
- Addition uses a balance-style undo model; subtraction uses a part-whole bar; multiplication uses equal groups; division rebuilds the missing total from equal groups.
- The 6.1 generator now varies among addition, subtraction, multiplication, and division placeholder sentences, with a visual check at the end.


## Chapter 7.2 continuity update
- Added a custom animated solution for rectangle-with-given-area problems.
- Draws the rectangle first, labels the unknown side as x, writes the area equation, and solves it in a Chapter 6 style for better continuity.


## Chapter 8.1 line relationship visuals
- Added animated diagrams for parallel, perpendicular, and intersecting lines.
- Perpendicular lines show a right-angle marker, parallel lines show equal spacing, and intersecting lines show the crossing point and a non-right angle.


## Chapter 8.2 visual animation update
- Added picture-based animations for faces, edges, and vertices questions.
- The animation now draws the 3D solid, highlights the requested feature, and then reveals the count.
- Supported solids: cube, rectangular prism, cylinder, and square pyramid.


## Chapter 8.3 coordinate reading animation
- Added a graph-based animated solution for reading coordinates in the first quadrant.
- The animation now shows the point first, then traces down to the x-axis, then across to the y-axis, and finally writes the ordered pair.


## Chapter 8.3 translation animation
- Added a graph-based animated solution for translating a point.
- The animation now plots the starting point, shows the horizontal move, then the vertical move, and finally reveals the new coordinates of A′.


## Chapter 9 visual animation update
- Added visual animated solutions across Chapter 9 instead of leaving them as static solution panels.
- 9.1 Sample or population: shows the whole group, then highlights some or all people.
- 9.2 Interpret grouped data: compares categories visually and highlights the largest value.
- 9.3 Read a bar graph: highlights the target bar and reveals its height.
- 9.4 Compare values in a graph: highlights two bars and shows the difference.
- 9.5 Theoretical probability: shows favorable outcomes out of all possible outcomes.
- 9.5 Experimental probability: shows successes out of total trials and simplifies the fraction.


## Chapter 10 visual animation update
- Reworked Chapter 10 animations so they are more visual and less text-only.
- 10.1 Communicate mathematical thinking: now shows a mental-addition strategy by splitting a number and using number-line jumps.
- 10.2 Represent a number: now shows hundreds, tens, and ones with base-ten blocks.
- 10.3 Connect concepts: now shows percent on a hundred grid, then converts to a fraction and simplifies it.
- 10.4 Reason and justify: now highlights the ones digit and uses a number line to justify rounding to the nearest ten.

- Improved the Chapter 10.1 mental-math number line so labels are not crowded: it now shows fewer labels, keeps key values emphasized, and uses a wider visual line.

- Updated Chapter 10.1 mental-math animation to use a frog jumping along the number line, with jump arcs for the tens jump and ones jump.

- Improved the frog number-line animation so the first jump is also visually shown during the two-jump step, with a landing marker/frog at the intermediate stop and step labels for both jumps.


## Gamification rewards
- Correct graded answers trigger a short fireworks celebration once per problem.
- Opening either Show step-by-step or Animate solution awards one Learning Sticker per problem.
- If a student views a solution, clicks New similar problem, and solves that follow-up correctly without revealing its solution, the student earns a larger Mastery Sticker.
- Learning and Mastery sticker totals are saved locally with progress and shown at the top of Practice and on the Progress screen.
- Repeated grading or repeatedly opening the same solution cannot farm duplicate rewards for the same problem.

- Updated correct-answer celebration: firework rockets now visibly launch from the bottom of the screen, travel upward, then burst near the top with a Correct! message.

- Enlarged and slowed the correct-answer fireworks: bigger rockets, longer launches from the bottom of the screen, larger bursts, more particles, and a longer celebration.

- Redesigned the correct-answer celebration: slower Correct popup, realistic rising rocket trails, bright burst flashes, expanding rings, radial streak sparks, and secondary fading sparks.

- Changed gamification: Learning Stickers are now awarded once for each correctly solved problem. Viewing a solution no longer increases the Learning Sticker count. Mastery Stickers still reward solving a similar follow-up problem after reviewing a solution.
