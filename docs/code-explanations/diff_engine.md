# Code Explanation: `diff_engine.py`

## Matching Source File
`backend/app/diff/diff_engine.py`

---

## 1. Purpose
Computes structural line-by-line differences, similarity ratios, mutation percentages, unified diff patches, and structured comparison chunks between previous and current normalized text versions.

---

## 2. Responsibilities
- Splitting multiline normalized text strings into array representations.
- Calculating similarity ratios using Ratcliff-Obershelp sequence matching (`difflib.SequenceMatcher`).
- Extracting exact counts for lines added, lines removed, and lines modified.
- Generating structured opcode chunks (`equal`, `replace`, `delete`, `insert`) with line number ranges for the React side-by-side DiffViewer.
- Formatting unified diff strings compatible with standard patch tooling.
- Generating concise, human-readable change summaries.

---

## 3. Main Classes
- `DiffEngine`: Static computational service providing diff algorithms.

---

## 4. Main Functions
- `compare(previous_text: str, current_text: str) -> Dict[str, Any]`: Computes full diff metrics, chunks, unified diff, and summary.
- `_generate_summary(added, removed, modified, pct, chunks) -> str`: Formats an intuitive explanation of the detected change.

---

## 5. Execution Flow
1. Receives `previous_text` and `current_text`.
2. Splits inputs into line lists.
3. Initializes `difflib.SequenceMatcher`.
4. Retrieves matching opcodes via `matcher.get_opcodes()`.
5. Iterates through opcodes:
   - `replace`: increments `lines_modified`, records replaced lines on both sides.
   - `delete`: increments `lines_removed`, records deleted lines.
   - `insert`: increments `lines_added`, records inserted lines.
   - `equal`: records unchanged lines for context.
6. Computes `change_percentage = round((1.0 - ratio) * 100.0, 2)`.
7. Generates Git-style unified diff string via `difflib.unified_diff`.
8. Formats human-readable summary snippet.
9. Returns complete dictionary payload.

---

## 6. Dependencies
- `difflib`: Python standard library for delta sequences.
- `typing`: Type annotations.

---

## 7. Interview Explanation
> *"DiffEngine translates low-level text deltas into actionable metrics. By exposing structured chunks with line numbers and opcode tags, the backend empowers the frontend to render rich, interactive side-by-side code comparisons with zero client-side diff overhead."*

---

## 8. Common Modifications
- Introducing word-level or character-level diff highlighting for intra-line mutations.
- Implementing semantic AST diffing for structured formats like JSON or Markdown.
