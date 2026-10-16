import hashlib


class HashEngine:
    """
    Computes cryptographic SHA-256 hashes of normalized content
    to allow instant O(1) equality verification between consecutive checks.
    """

    @staticmethod
    def compute_sha256(content: str) -> str:
        """
        Calculates the SHA-256 hex digest of the normalized utf-8 string.
        """
        if not content:
            return hashlib.sha256(b"").hexdigest()
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    @staticmethod
    def are_hashes_identical(hash_a: str, hash_b: str) -> bool:
        """
        Constant-time comparison of two hex hashes.
        """
        return hash_a == hash_b
