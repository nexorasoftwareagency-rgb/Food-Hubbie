# Decisions: FeedbackPage

## Why mock data
Static customer feedback display — no moderation or reply functionality needed for demo.

## Design choices
- **Star distribution bars are fixed percentages** — not computed from actual data
- **Average rating hardcoded as "4.7"** — matches `MOCK_FEEDBACK` average
- **Dish badge** — orange pill showing which dish the feedback references
