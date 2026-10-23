# HHH V11 · Research result

`NO_CANDIDATE_PASSED_DEVELOPMENT_SCREEN`

Sole candidate F1: 0/6 groups passed. A0 is a reused control only.

126 reused development dates, 2026-04-01 to 2026-10-08; 21 new fits, 42 entry-lag score tables and zero new prospective dates.

23 connected policies × 6 groups × 5 inherited tests, plus 12 F1 pool checks: 702 tests. Fixed 200,000 noncircular 20-session block draws; one-sided alpha=0.05/702.

Arm | Horizon | Entry lag | Gates passed | Full-pool IC | Full-pool MSE gain vs M0 | P-pool IC | Top20 fixed-cost net mean
---|---|---|---|---|---|---|---
A0 | 1 | 1 | 14/42 | -0.0149692 | -0.4687% | -0.0134338 | -0.4430%
A0 | 1 | 2 | 13/42 | -0.0184857 | -0.4824% | -0.0158396 | -0.4137%
A0 | 3 | 1 | 13/42 | -0.0260299 | -0.8346% | -0.0253873 | -0.6591%
A0 | 3 | 2 | 13/42 | -0.0313108 | -0.8332% | -0.0292139 | -0.6249%
A0 | 5 | 1 | 13/42 | -0.0377429 | -1.0539% | -0.0370338 | -0.7239%
A0 | 5 | 2 | 13/42 | -0.0460321 | -1.1453% | -0.0448116 | -0.8416%
F1 | 1 | 1 | 16/46 | -0.0187739 | -0.4483% | -0.0167963 | -0.4002%
F1 | 1 | 2 | 17/46 | -0.020967 | -0.4664% | -0.0187099 | -0.2838%
F1 | 3 | 1 | 15/46 | -0.025102 | -0.8085% | -0.0230501 | -0.6337%
F1 | 3 | 2 | 16/46 | -0.0279691 | -0.7926% | -0.0244418 | -0.4158%
F1 | 5 | 1 | 19/46 | -0.0289776 | -0.9855% | -0.0246325 | -0.3079%
F1 | 5 | 2 | 20/46 | -0.0342563 | -1.0682% | -0.0286047 | -0.2480%

Same-pool simple-rule comparisons (arm minus rule net mean, percentage points)

Arm | Horizon | Lag | High momentum | Short reversal | Low volatility | Laggard
---|---|---|---|---|---|---
A0 | 1 | 1 | -0.3099 | 0.0118 | -0.1999 | 0.0902
A0 | 1 | 2 | -0.2191 | 0.0581 | -0.1668 | 0.0178
A0 | 3 | 1 | -0.3280 | 0.1753 | -0.4449 | 0.1640
A0 | 3 | 2 | -0.2595 | 0.3260 | -0.3929 | 0.2454
A0 | 5 | 1 | -0.3305 | 0.5899 | -0.5175 | 0.4242
A0 | 5 | 2 | -0.5962 | 0.5175 | -0.6298 | 0.3509
F1 | 1 | 1 | -0.2671 | 0.0545 | -0.1571 | 0.1329
F1 | 1 | 2 | -0.0892 | 0.1880 | -0.0368 | 0.1477
F1 | 3 | 1 | -0.3026 | 0.2007 | -0.4195 | 0.1894
F1 | 3 | 2 | -0.0504 | 0.5352 | -0.1838 | 0.4545
F1 | 5 | 1 | 0.0855 | 1.0059 | -0.1015 | 0.8402
F1 | 5 | 2 | -0.0026 | 1.1110 | -0.0362 | 0.9445

The JSON preserves every actual gate, corrected interval and sample coverage. Observed mean differences alone do not establish a pass.

F1 reuses V8 features and aligns its training domain and residual target with the original signal-time P selection pool, with a training-derived P conditional prior. Saved C2 forecasts are copied outside P; original full-universe mean and median baselines stay unchanged. This compares a package of training domain, target, training-only pruning and prior, not new raw information or a single-factor causal effect.
Inherited full-universe error, economic and stability gates remain. F1 additionally needs positive corrected lower bounds for paired P MSE improvement versus A0 and P expected-return RankIC. Missing or undefined conditions fail. The additive model makes P ranks across entry lags essentially coincide; these are not two new algorithms.
Enter at adjusted open T, the lag-th trading session after signal S, and exit at adjusted close on the h-th session AFTER T; h=1/3/5 and lag=1/2 are evaluated separately. Fixed roundtrip cost is 31bp. Exact-date missing prices remain missing. Overlapping cohort means are not account NAV, and fixed-cost scenarios do not establish actual fills.
All dates are reused development data, not fresh out-of-sample or prospective evidence. The study remains RESEARCH_ONLY and does not replace the website model or historical forecasts and outcomes. Even a complete development pass needs separately preregistered prospective validation with at least 60 NEW mature dates over at least 3 months and applicable independent review. These minimum prerequisites are not an automatic pass rule. This is saved-evidence integrity verification, not an independent promotion audit.


Sources:

- [Aggregate results and complete gates](expected-return-v11-20261023.json)
- [Market Efficiency in a Changing Asset Population, v2](https://arxiv.org/html/2610.23283v2): motivates careful estimation-population definition. Cryptocurrency evidence does not establish A-share predictability or leakage in the current system.
- [From Alpha to Execution, v1](https://arxiv.org/html/2610.23749v1): execution-cost background. This study did not change entry windows or treat theoretical cost savings as forecast gains.
