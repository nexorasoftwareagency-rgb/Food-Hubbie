# Delivery Slabs — Decisions

1. **Array storage in RTDB**: Unlike most RTDB data which uses objects with keys, delivery slabs are stored as a JSON array. This is unusual for RTDB and makes concurrent edits risky (array overwrite rather than per-index update).

2. **Prompt()-based editing**: Uses browser prompt() dialogs for slab creation/editing. Poor UX — no validation, no proper form, no number input controls.

3. **Auto-save on every operation**: add/edit/remove all call saveSlabs() immediately. No draft state or cancel flow.

4. **Full array replacement**: saveSlabs() uses set() to replace the entire slabs array. Risk of data loss if two admins edit simultaneously.

5. **No validation in prompts**: User can enter non-numeric values, negative distances, or overlapping ranges. No client-side validation.

6. **Slab order matters**: Array order determines which slab applies first. No UI indication of priority — admin must understand array indexing.
