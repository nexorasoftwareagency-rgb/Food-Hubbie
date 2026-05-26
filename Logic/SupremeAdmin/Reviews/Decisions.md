# Reviews — Decisions

1. **Read-only tab**: Reviews are displayed but cannot be moderated, deleted, or replied to. This limits the admin's ability to manage public feedback.

2. **One-time read (not listener)**: Reviews are loaded once and not updated in real-time. Acceptable for a review browsing use case.

3. **Truncated comments (100 chars)**: Long comments are truncated to keep the layout clean. No "read more" expansion mechanism.

4. **Star rating visualization**: Uses raw Unicode stars (★/☆) instead of an icon library. Simple and dependency-free.

5. **No pagination**: All reviews are loaded and displayed at once. Could be slow with thousands of reviews.

6. **No filtering/sorting options**: Reviews are sorted by newest first with no way to filter by rating, business, or date range.
