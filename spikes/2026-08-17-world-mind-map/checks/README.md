# checks

```bash
node check-grouping.ts
node check-axis.ts
```

Node 22+ runs TypeScript directly; there is no build step and no test runner.

**This is not a test suite, and it is not in `code/` for that reason.** It is
the harness that made the spike's rules verifiable at all: the in-app browser
pane spent most of this spike not compositing frames, so nothing could be
driven by hand, and the only honest way to know whether the rules were right
was to call them.

That constraint shaped the code, and the shape turned out to be worth keeping:
`grouping.ts` and `axis.ts` have no React in them, so what belongs to what,
how categories form and fold, how lanes pack, how a drag is clamped and how a
position is worded can all be answered without a browser.

What is covered — 75 assertions:

| File | What it holds to account |
|---|---|
| `check-grouping.ts` | branch membership, category ids, badges, folding a limb, appearances, sub-headings, the add slot, trails, badge angles |
| `check-axis.ts` | spans, lane packing, pin lanes and sides, the three scales, drag arithmetic and its limits, where a new event lands |

Real tests get written at Promote, against hardened code. These answer a
different question: whether the idea behaves the way it was described.
