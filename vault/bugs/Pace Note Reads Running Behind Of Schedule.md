# Pace Note Reads Running Behind Of Schedule

Status: not-fixed
Found: `src/lib/insights.ts:147`
Summary: the goal pace note interpolates the pace word into a fixed sentence, which reads correctly for `ahead` and ungrammatically for `behind`.

## Details

```ts
body: `${goal.name} is running ${goal.pace} of schedule.`
```

`goal.pace` is `'ahead' | 'behind' | 'on-pace'`, and `'on-pace'` returns early. So the two reachable sentences are:

```
House is running ahead of schedule.     correct
House is running behind of schedule.    wrong
```

"Behind schedule" takes no preposition. The template assumes both words govern `of`, and only `ahead` does.

This is user-visible copy on the Notes screen, in an app whose whole voice is calm editorial prose, so a grammar slip is more costly here than the one-line fix suggests. Fix by branching the sentence on pace rather than interpolating the word into a shared tail.

Worth checking the Arabic strings for the same shape when [[Arabic Holding and Add Holding]] lands — a template that reads naturally in one language often does not survive interpolation in another.

Found by `src/lib/__tests__/insights.test.ts`, which asserts the current wording so the suite stays green. Not fixed in the harness PR, which carries no behaviour changes.

## Related
- Feature: [[Insight Rules Engine]]
- Page: [[Editorial Notes]]
- Enhancement: [[Native Notes Screen]]
