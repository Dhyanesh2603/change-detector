import difflib
from typing import Dict, Any, List, Optional


class DiffEngine:
    """
    Computes semantic, structural, and line-by-line diffs between previous
    and current normalized website text versions.
    Produces machine-readable metrics and developer-friendly side-by-side structures.
    """

    @staticmethod
    def compare(previous_text: str, current_text: str) -> Dict[str, Any]:
        """
        Calculates diff metrics, unified diff, side-by-side lines, and change summary.
        """
        prev_lines = previous_text.splitlines() if previous_text else []
        curr_lines = current_text.splitlines() if current_text else []

        matcher = difflib.SequenceMatcher(None, prev_lines, curr_lines)
        ratio = matcher.ratio()

        lines_added = 0
        lines_removed = 0
        lines_modified = 0

        # Structured side-by-side comparison records
        # types: "equal", "replace", "delete", "insert"
        chunks: List[Dict[str, Any]] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            chunk_prev = prev_lines[i1:i2]
            chunk_curr = curr_lines[j1:j2]

            if tag == "replace":
                lines_modified += max(len(chunk_prev), len(chunk_curr))
                chunks.append({
                    "type": "replace",
                    "prev_start": i1,
                    "prev_end": i2,
                    "curr_start": j1,
                    "curr_end": j2,
                    "prev_lines": chunk_prev,
                    "curr_lines": chunk_curr
                })
            elif tag == "delete":
                lines_removed += len(chunk_prev)
                chunks.append({
                    "type": "delete",
                    "prev_start": i1,
                    "prev_end": i2,
                    "curr_start": j1,
                    "curr_end": j1,
                    "prev_lines": chunk_prev,
                    "curr_lines": []
                })
            elif tag == "insert":
                lines_added += len(chunk_curr)
                chunks.append({
                    "type": "insert",
                    "prev_start": i1,
                    "prev_end": i1,
                    "curr_start": j1,
                    "curr_end": j2,
                    "prev_lines": [],
                    "curr_lines": chunk_curr
                })
            elif tag == "equal":
                chunks.append({
                    "type": "equal",
                    "prev_start": i1,
                    "prev_end": i2,
                    "curr_start": j1,
                    "curr_end": j2,
                    "prev_lines": chunk_prev,
                    "curr_lines": chunk_curr
                })

        total_lines = max(len(prev_lines) + len(curr_lines), 1)
        total_changed = (lines_added + lines_removed + (lines_modified * 2))
        change_percentage = round((1.0 - ratio) * 100.0, 2)

        # Generate unified diff string
        unified_diff_list = list(
            difflib.unified_diff(
                prev_lines,
                curr_lines,
                fromfile="previous_version",
                tofile="current_version",
                lineterm=""
            )
        )
        unified_diff_str = "\n".join(unified_diff_list)

        # Generate human-readable summary
        summary = DiffEngine._generate_summary(lines_added, lines_removed, lines_modified, change_percentage, chunks)

        return {
            "has_changes": (lines_added > 0 or lines_removed > 0 or lines_modified > 0),
            "similarity_ratio": round(ratio, 4),
            "change_percentage": change_percentage,
            "lines_added": lines_added,
            "lines_removed": lines_removed,
            "lines_modified": lines_modified,
            "summary": summary,
            "unified_diff": unified_diff_str,
            "chunks": chunks
        }

    @staticmethod
    def _generate_summary(
        added: int,
        removed: int,
        modified: int,
        pct: float,
        chunks: List[Dict[str, Any]]
    ) -> str:
        if added == 0 and removed == 0 and modified == 0:
            return "No meaningful content changes detected."

        parts = []
        if added > 0:
            parts.append(f"+{added} lines added")
        if removed > 0:
            parts.append(f"-{removed} lines removed")
        if modified > 0:
            parts.append(f"{modified} lines modified")

        detail_snippets = []
        for chunk in chunks:
            if chunk["type"] in ("replace", "insert", "delete"):
                if chunk["curr_lines"]:
                    sample = chunk["curr_lines"][0][:60]
                    detail_snippets.append(f"'{sample}...'")
                elif chunk["prev_lines"]:
                    sample = chunk["prev_lines"][0][:60]
                    detail_snippets.append(f"removed '{sample}...'")
            if len(detail_snippets) >= 2:
                break

        summary_text = f"Content changed by {pct}% ({', '.join(parts)})"
        if detail_snippets:
            summary_text += f". Affected: {'; '.join(detail_snippets)}"

        return summary_text
