# HHH V12 · Research result

`NO_CANDIDATE_PASSED_DEVELOPMENT_SCREEN`

Sole candidate G1: 0/6 groups passed. A0 is the saved V8 C2 research control. The public V1 model remains unchanged.

126 reused development dates, 2026-04-01 to 2026-10-08; 21 new Ridge fits, 42 entry-lag score tables and zero new mature prospective dates.

The cumulative family contains 744 tests: 24 connected policies × 6 groups × 5 inherited contrasts, plus 12 executed V11 and 12 new V12 pool tests. Fixed 200,000 noncircular 20-session block draws; one-sided alpha=0.05/744.

Arm | Horizon | Entry lag | Gates passed | Full-E IC | Full-E MSE gain vs M0 | P-pool IC | Top20 fixed-cost net mean
---|---|---|---|---|---|---|---
A0 | 1 | 1 | 14/42 | -0.0149692 | -0.4687% | -0.0134338 | -0.4430%
A0 | 1 | 2 | 13/42 | -0.0184857 | -0.4824% | -0.0158396 | -0.4137%
A0 | 3 | 1 | 13/42 | -0.0260299 | -0.8346% | -0.0253873 | -0.6591%
A0 | 3 | 2 | 13/42 | -0.0313108 | -0.8332% | -0.0292139 | -0.6249%
A0 | 5 | 1 | 13/42 | -0.0377429 | -1.0539% | -0.0370338 | -0.7239%
A0 | 5 | 2 | 13/42 | -0.0460321 | -1.1453% | -0.0448116 | -0.8416%
G1 | 1 | 1 | 15/46 | -0.0113754 | -0.6588% | -0.00661305 | -0.4874%
G1 | 1 | 2 | 15/46 | -0.0105267 | -0.6252% | -0.00356801 | -0.3971%
G1 | 3 | 1 | 16/46 | -0.0156072 | -1.0631% | -0.0105382 | -0.5725%
G1 | 3 | 2 | 16/46 | -0.0217161 | -1.0630% | -0.0149247 | -0.4628%
G1 | 5 | 1 | 16/46 | -0.0237575 | -1.3102% | -0.019135 | -0.5473%
G1 | 5 | 2 | 16/46 | -0.0340396 | -1.4533% | -0.0282219 | -0.7146%

Same-pool comparisons: arm minus rule fixed-cost net mean, percentage points

Arm | Horizon | Lag | High momentum | Short reversal | Low volatility | Laggard
---|---|---|---|---|---|---
A0 | 1 | 1 | -0.3099 | 0.0118 | -0.1999 | 0.0902
A0 | 1 | 2 | -0.2191 | 0.0581 | -0.1668 | 0.0178
A0 | 3 | 1 | -0.3280 | 0.1753 | -0.4449 | 0.1640
A0 | 3 | 2 | -0.2595 | 0.3260 | -0.3929 | 0.2454
A0 | 5 | 1 | -0.3305 | 0.5899 | -0.5175 | 0.4242
A0 | 5 | 2 | -0.5962 | 0.5175 | -0.6298 | 0.3509
G1 | 1 | 1 | -0.3542 | -0.0326 | -0.2443 | 0.0458
G1 | 1 | 2 | -0.2025 | 0.0747 | -0.1501 | 0.0345
G1 | 3 | 1 | -0.2414 | 0.2619 | -0.3583 | 0.2506
G1 | 3 | 2 | -0.0974 | 0.4882 | -0.2308 | 0.4076
G1 | 5 | 1 | -0.1540 | 0.7664 | -0.3409 | 0.6008
G1 | 5 | 2 | -0.4691 | 0.6445 | -0.5027 | 0.4779

The JSON retains actual gates, corrected intervals, complete selection coverage and new-feature availability. A mean improvement alone does not establish a pass.

G1 adds only one signed directed cross-cell projection and its missing flag to C2. Full-E training, residual target, date/lag weights, Ridge, centering, M0 prior, original P and Top20 ordering remain. It is not the V11 conditional-P expert and does not copy outside-P scores. Training-only pruning can differ, so this is neither an exact nested regression nor causal identification of information diffusion.
Twenty-five amount/momentum cells use each historical date's original eligible names and market-demeaned returns. Sixty strict-prior lag-one pairs run from S−61..S−2 to S−60..S−1. Edge direction uses unequal absolute forward/reverse correlations while retaining the response sign; the fixed network projects other cells' S signals. Any missing current source on a historical nonzero incoming edge makes the projection unavailable, without renormalizing surviving sources or dropping stocks. Removing self-cell edges does not remove all own-stock information: market demeaning and cell identity still contain it.
Bennett, Cucuringu and Reinert (2022) motivate daily directed lead–lag analysis. Fixed characteristic cells and this 60-pair projection are local adaptations, not a replication of their network clustering, trading or reported results. The paper does not validate A-share next-open profitability. New news and notices lack sufficient verified timing and security mappings and were not backfilled into historical forecasts or outcomes.
All inherited error, economic and stability gates remain, plus positive corrected lower bounds for G1's paired P MSE improvement over saved A0 and P expected-return RankIC. Missing or undefined gates fail. Lag remains additive, so coincident stock rankings across entry delays are not independent ranking algorithms.
Enter at adjusted open T, lag trading sessions after S, and exit at adjusted close on the h-th session AFTER T, separately for h=1/3/5 and lag=1/2. The fixed roundtrip cost is 31bp. Exact-date missing prices remain missing. Overlapping cohort means are not account NAV or verified fills.
All dates are reused development evidence with zero new prospective dates. RESEARCH_ONLY remains; the website model, original forecasts and existing outcomes are not replaced. Even six passing development groups only permit a separately preregistered prospective protocol with at least 60 NEW mature dates over at least 3 months and applicable independent review. These minimum prerequisites are not an automatic pass rule. This is cooperative saved-evidence verification, not an independent promotion audit.

[Bennett, Cucuringu and Reinert (2022), Machine Learning](https://link.springer.com/article/10.1007/s10994-022-06250-4)
