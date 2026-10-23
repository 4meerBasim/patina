# Goals With Linked Holdings

Status: shipped
Summary: goals are created, edited and deleted by the user, funded by linked holdings or accounts, and their ahead/behind/on-pace standing is computed from real balances.

## Details

`addGoal`, `updateGoal` and `deleteGoal` live in `src/store/data-store.ts:428`. `src/app/editorial/goal.tsx` and `src/app/native/goal.tsx` are the editor: name, target, monthly contribution, target date, and the set of holdings that fund it. `selectGoalProgress` turns the linked holdings' values into a percentage and a pace, so nothing on the goals screens is typed in as a figure.

The editorial goals tab pushes to the detail screen with the goal id, and the same route with no id creates one. The native detail screen has no route into it — see [[Four Finished Screens Have No Route In]].

## Related
- Feature: [[Domain Data Model]], [[App State Store]], [[Insight Rules Engine]], [[Money and Numeral Formatting]], [[Native Notes Screen]]
- Bugs: [[Pace Note Reads Running Behind Of Schedule]], [[Four Finished Screens Have No Route In]]
- Page: [[Editorial Goal Detail]], [[Native Goal Detail]], [[Editorial Goals]], [[Native Goals]]
- Enhancement: [[Goal Detail with Projection Fan]]
