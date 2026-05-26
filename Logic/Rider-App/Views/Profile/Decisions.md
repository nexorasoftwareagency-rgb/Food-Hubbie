# Profile View — Decisions

## Design Decisions
1. **Inline editing** — Tap a field to edit directly (no separate edit mode); reduces friction
2. **Phone/email read-only** — Used for authentication; changes require separate auth update
3. **Aadhar masked** — Shows only last 4 digits for privacy; full number stored in DB
4. **Photo upload to Storage** — Firebase Storage for image hosting; URL stored in RTDB
5. **Status toggle** — Prominent switch at top; affects order availability
6. **No email verification flow** — Rider's email is system-generated (phone@rider.com)
7. **Save button only for edited fields** — Only writes changed fields to minimize DB writes
8. **Profile completeness indicator** — Shows % complete based on filled fields
