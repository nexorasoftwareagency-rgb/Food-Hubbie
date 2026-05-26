# Settings — Decisions

1. **Custom TOTP implementation (stub)**: Built their own TOTP verification instead of using a library. Implementation is broken (always returns "000000"). No OTPAuth URI generated for authenticator apps.

2. **TFA secret stored in /system/admins**: TFA secret is stored alongside admin metadata in RTDB. If database is compromised, secrets are exposed.

3. **Data retention with archive/purge**: Two-tier approach — archive moves data to /archives/ namespace before deletion. Provides safety net for accidental purges.

4. **Retention by record age**: Uses simple timestamp comparison with configurable days threshold. No granularity (all records older than X days are affected).

5. **No retention scheduling**: Data retention is manual — admin must visit Settings and trigger it. No automated cron job or Cloud Function.

6. **No retention exclusions**: Archive/purge applies to ALL records matching the age criteria. No way to exclude specific records or businesses.

7. **No retention audit trail**: The retention action itself is not logged (no audit log entry for archive/purge operations).
