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

        # Generate human-readable and executive semantic summaries
        intel = DiffEngine._classify_change(chunks, change_percentage)
        summary = DiffEngine._generate_summary(lines_added, lines_removed, lines_modified, change_percentage, chunks, intel)

        return {
            "has_changes": (lines_added > 0 or lines_removed > 0 or lines_modified > 0),
            "similarity_ratio": round(ratio, 4),
            "change_percentage": change_percentage,
            "lines_added": lines_added,
            "lines_removed": lines_removed,
            "lines_modified": lines_modified,
            "summary": summary,
            "unified_diff": unified_diff_str,
            "chunks": chunks,
            "category": intel["category"],
            "category_label": intel["category_label"],
            "severity": intel["severity"],
            "executive_summary": intel["executive_summary"],
            "key_entities": intel["key_entities"]
        }

    @staticmethod
    def _classify_change(
        chunks: List[Dict[str, Any]],
        change_pct: float
    ) -> Dict[str, Any]:
        """
        Synthesizes semantic category, severity, and executive English summary.
        """
        import re
        all_changed_lines = []
        for c in chunks:
            if c["type"] in ("replace", "insert", "delete"):
                all_changed_lines.extend(c.get("prev_lines", []))
                all_changed_lines.extend(c.get("curr_lines", []))

        full_text = " ".join(all_changed_lines).lower()

        # Pricing patterns
        pricing_terms = ["$", "€", "£", "₹", "pricing", "price", "/mo", "/month", "/year", "plan", "tier", "subscription", "billed", "starter", "pro", "enterprise", "per seat"]
        has_pricing = any(term in full_text for term in pricing_terms) or bool(re.search(r"[\$€£₹]\s*\d+", full_text))

        # Stock / availability
        stock_terms = ["stock", "sold out", "inventory", "available", "unavailable", "backorder", "pre-order", "in stock", "out of stock"]
        has_stock = any(term in full_text for term in stock_terms)

        # Policy / Legal / Security
        policy_terms = ["privacy", "terms of service", "policy", "gdpr", "compliance", "security", "cookie", "data collection", "rights reserved"]
        has_policy = any(term in full_text for term in policy_terms)

        # Feature / Release
        release_terms = ["version", "v1.", "v2.", "v3.", "release", "changelog", "announcing", "feature", "beta", "deprecated", "update:"]
        has_release = any(term in full_text for term in release_terms)

        # Determine Category
        if has_pricing:
            category = "PRICING_UPDATE"
            category_label = "Pricing & Plans"
        elif has_stock:
            category = "STOCK_AVAILABILITY"
            category_label = "Inventory & Availability"
        elif has_policy:
            category = "POLICY_TERMS"
            category_label = "Legal & Policies"
        elif has_release:
            category = "FEATURE_RELEASE"
            category_label = "Release & Changelog"
        elif change_pct > 20:
            category = "MAJOR_REDESIGN"
            category_label = "Major Page Overhaul"
        else:
            category = "CONTENT_COPY"
            category_label = "Content & Copy"

        # Determine Severity
        if has_pricing or change_pct >= 25.0:
            severity = "CRITICAL"
        elif has_stock or has_policy or change_pct >= 10.0:
            severity = "HIGH"
        elif change_pct >= 3.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Extract entities
        entities = []
        prices = re.findall(r"[\$€£₹]\s*\d+(?:\.\d{2})?(?:/[a-z]+)?", full_text)
        if prices:
            entities.extend(list(set(prices))[:4])

        # Formulate Executive Summary
        if has_pricing:
            price_str = f" (detected rates: {', '.join(entities)})" if entities else ""
            executive = f"Pricing or subscription terms were altered{price_str}. Mutation affected core commercial tiers."
        elif has_stock:
            executive = "Inventory or product availability status changed. Stock state altered on monitored page."
        elif has_policy:
            executive = "Terms of service, privacy policy, or legal compliance disclosures were revised."
        elif has_release:
            executive = "New release, version tag, or feature announcement was published on the page."
        elif change_pct > 20:
            executive = f"Substantial page mutation detected ({change_pct}% altered). Large-scale DOM or section restructuring."
        else:
            executive = f"Copy and textual elements were refined ({change_pct}% altered). Routine textual update."

        return {
            "category": category,
            "category_label": category_label,
            "severity": severity,
            "executive_summary": executive,
            "key_entities": entities
        }

    @staticmethod
    def _generate_summary(
        added: int,
        removed: int,
        modified: int,
        pct: float,
        chunks: List[Dict[str, Any]],
        intel: Optional[Dict[str, Any]] = None
    ) -> str:
        if added == 0 and removed == 0 and modified == 0:
            return "No meaningful content changes detected."

        exec_summary = intel.get("executive_summary") if intel else None
        if exec_summary:
            return exec_summary

        parts = []
        if added > 0:
            parts.append(f"+{added} lines added")
        if removed > 0:
            parts.append(f"-{removed} lines removed")
        if modified > 0:
            parts.append(f"{modified} lines modified")

        return f"Content changed by {pct}% ({', '.join(parts)})"
