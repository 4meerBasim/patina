# Persisted Settings

Status: shipped
Summary: User settings that survive restart — locale, numeral system, base currency, appearance and the two privacy flags.

## Details
`src/data/settings.ts` persists `locale`, `numeralSystem`, `baseCurrency`, `appearance` and `privacyBlur` in the SQLite `kv` table and the `biometricLock` flag in `expo-secure-store`; `loadSettings`/`saveSettings` back the store's `updateSettings`, which changing the base currency also triggers a snapshot recompute.

## Related
- Page: [[Editorial Settings]], [[Native Settings]], [[Editorial Home]], [[Native Liabilities]]
- Features: [[Settings Toggles]], [[App State Store]], [[Money and Numeral Formatting]], [[Local SQLite Persistence]], [[Biometric App Lock]], [[Target Allocation and Rebalance Hints]], [[Privacy Blur on Launch]]
- Bugs: [[Dividend Calendar Sums Foreign Currency Without FX]], [[Rebalance Does Not Normalise Targets Over 100]]
