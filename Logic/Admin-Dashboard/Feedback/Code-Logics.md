# Code-Logics: FeedbackPage

**Location**: App.jsx lines 2526-2572

## Props
- `{ showToast }`

## State
- None — pure mock data from `MOCK_FEEDBACK` constant

## Renders
- **Rating summary**: average rating "4.7" (hardcoded), 5-star distribution bar chart with fixed percentages (5-star = 45%, 4-star = 30%, 3-star = 15%, 2-star = 7%, 1-star = 3%)
- **Feedback cards**: Avatar with initials, customer name, relative time, `StarRating` component, comment text, dish reference badge (orange pill)
