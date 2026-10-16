# Code Explanation: `hash_engine.py`

## Matching Source File
`backend/app/diff/hash_engine.py`

---

## 1. Purpose
Provides cryptographic SHA-256 content hashing to enable $O(1)$ equality verification between sequential captures, bypassing expensive diff calculations when content is unmodified.

---

## 2. Responsibilities
- Computing deterministic SHA-256 hexadecimal digests of normalized strings.
- Performing constant-time equality comparisons between hash signatures.

---

## 3. Main Classes
- `HashEngine`: Static utility class for cryptographic digest operations.

---

## 4. Main Functions
- `compute_sha256(content: str) -> str`: Encodes string to UTF-8 and computes SHA-256 hex digest. Returns 64-character lowercase hexadecimal string.
- `are_hashes_identical(hash_a: str, hash_b: str) -> bool`: Verifies equality of two hashes.

---

## 5. Execution Flow
1. Receives normalized text string.
2. If string is empty, returns hash of empty bytes.
3. Encodes string into UTF-8 byte array.
4. Generates SHA-256 digest via `hashlib.sha256()`.
5. Returns 64-character hexadecimal digest.

---

## 6. Dependencies
- `hashlib`: Python standard library for cryptographic hashing.

---

## 7. Interview Explanation
> *"HashEngine provides a critical optimization gate in the monitoring lifecycle. Instead of comparing previous and current snapshots line-by-line on every scheduled check, the system performs a constant-time SHA-256 comparison. If the 64-character hashes match, the pipeline terminates immediately, reducing check latency from hundreds of milliseconds to under one millisecond."*

---

## 8. Common Modifications
- Incorporating locality-sensitive hashing (e.g. MinHash or SimHash) to compute approximate text similarity before calculating exact diffs.
