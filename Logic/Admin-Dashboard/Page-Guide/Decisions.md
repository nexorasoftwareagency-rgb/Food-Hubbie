# Decisions: Page Guide Module

## Why a separate file?
541 lines of guide content would bloat `index.html` or `main.js`. Separate file keeps guides maintainable and independent of UI logic.

## Why Lucide icons?
Already loaded in the Admin Dashboard. No new dependencies. Icons are self-contained in the modal (no external image files).

## Why not i18n yet?
Guide content is in English. i18n is deferred to v5.1.6 (listed in CHANGELOG Unreleased). All strings are ready for `t('key', 'fallback')` wrapping.

## Why step-by-step format?
Users scan guides linearly. Numbered steps with icons are easier to follow than walls of text. Each step answers "what is this?" and "what can I do?".
