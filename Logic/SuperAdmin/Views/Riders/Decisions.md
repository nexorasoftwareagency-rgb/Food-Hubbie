# Riders Tab — Decisions

## Design Decisions
1. **Real-time listener on riders** — Fleet status updates instantly without page refresh
2. **Image compression before upload** — Prevents large file storage costs; compressImage() uses canvas
3. **KYC document upload** — Aadhar image collected for verification compliance
4. **Secondary Firebase Auth for rider creation** — Prevents admin session disruption
5. **Inline modal for CRUD** — Single form for both create and edit (shared fields)
6. **Atomic delete with audit** — Rider removal bundled with audit log entry
7. **Password field on creation** — Rider credentials shared after account creation
