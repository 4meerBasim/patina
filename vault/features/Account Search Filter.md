# Account Search Filter

Status: shipped
Summary: Typing in the linking sheet's search field filters the institution list by name.

## Details
`src/app/editorial/link.tsx`: case-insensitive substring match on institution name (Interactive Brokers, Fidelity, Coinbase, Chase); a group (Brokerages, Exchanges, Banks) with no matches is hidden. The Link / Linked labels are static; no real account connection happens.

## Related
- Page: [[Editorial Account Linking]]
- Bugs: none known
