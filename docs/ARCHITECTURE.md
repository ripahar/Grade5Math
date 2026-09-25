# Architecture Notes

## Separation of concerns

### Data layer
Defines chapters and sections. It contains no generation logic.

### Problem layer
Each problem family is independent and registered by ID. It owns:
- valid random generation
- expected answer
- grading rule selection
- solution steps

### Math domain layer
Reusable deterministic math logic. It should never depend on DOM APIs.

### Rendering layer
Converts structured values into HTML/SVG. It should never decide whether an answer is correct.

### Service layer
Cross-cutting features such as worksheet creation and persistence.

### UI layer
Displays state, captures student input, and delegates all math behavior to problem definitions/graders.

## Extension rule

A new problem type should not require changes to `app.js` or the practice/worksheet views. Register it with a section ID and it becomes available automatically.

## Future testing structure

Recommended folders:

- `tests/math/`
- `tests/graders/`
- `tests/problems/`

Test generated values against the answer and verify solution steps end at the same expected result.
