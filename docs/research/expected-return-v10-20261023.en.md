# HHH V10 · Research result

`NO_CANDIDATE_PASSED_DEVELOPMENT_SCREEN`

E1 groups passed: 0/6. A0 is a reused control only.

Reused development dates | New fits | Lag score tables | Fixed roundtrip cost | Family tests
---|---|---|---|---
126 | 21 | 42 | 31 bp | 660

20260401–20261008. 22 connected policies × 6 groups × 5 contrasts; one-sided alpha=7.57576e-05.

Arm | Horizon | Entry lag | Gates passed | IC | MSE gain vs M0 | Top20 net mean
---|---|---|---|---|---|---
A0 | 1 | 1 | 14/42 | -0.0149692 | -0.4687% | -0.4430%
A0 | 1 | 2 | 13/42 | -0.0184857 | -0.4824% | -0.4137%
A0 | 3 | 1 | 13/42 | -0.0260299 | -0.8346% | -0.6591%
A0 | 3 | 2 | 13/42 | -0.0313108 | -0.8332% | -0.6249%
A0 | 5 | 1 | 13/42 | -0.0377429 | -1.0539% | -0.7239%
A0 | 5 | 2 | 13/42 | -0.0460321 | -1.1453% | -0.8416%
E1 | 1 | 1 | 14/42 | -0.0155566 | -0.4755% | -0.5508%
E1 | 1 | 2 | 13/42 | -0.0195367 | -0.4908% | -0.4460%
E1 | 3 | 1 | 13/42 | -0.0276721 | -0.8439% | -0.6975%
E1 | 3 | 2 | 13/42 | -0.0336091 | -0.8491% | -0.6784%
E1 | 5 | 1 | 13/42 | -0.0401357 | -1.0734% | -0.8146%
E1 | 5 | 2 | 13/42 | -0.0486508 | -1.1688% | -0.9037%

Same-pool net mean differences versus simple rules (arm minus rule; percentage points)

Arm | Horizon | Lag | High momentum | Short reversal | Low volatility | Laggard
---|---|---|---|---|---|---
A0 | 1 | 1 | -0.3099 | 0.0118 | -0.1999 | 0.0902
A0 | 1 | 2 | -0.2191 | 0.0581 | -0.1668 | 0.0178
A0 | 3 | 1 | -0.3280 | 0.1753 | -0.4449 | 0.1640
A0 | 3 | 2 | -0.2595 | 0.3260 | -0.3929 | 0.2454
A0 | 5 | 1 | -0.3305 | 0.5899 | -0.5175 | 0.4242
A0 | 5 | 2 | -0.5962 | 0.5175 | -0.6298 | 0.3509
E1 | 1 | 1 | -0.4177 | -0.0960 | -0.3077 | -0.0176
E1 | 1 | 2 | -0.2514 | 0.0258 | -0.1990 | -0.0145
E1 | 3 | 1 | -0.3664 | 0.1369 | -0.4833 | 0.1256
E1 | 3 | 2 | -0.3130 | 0.2726 | -0.4464 | 0.1919
E1 | 5 | 1 | -0.4213 | 0.4991 | -0.6083 | 0.3335
E1 | 5 | 2 | -0.6583 | 0.4554 | -0.6919 | 0.2888

The aggregate JSON also retains every gate, stress contrast and multiplicity-adjusted lower bound; observed mean differences alone do not establish a pass.

E1 adds only a strict-prior CHL measurement rank and its missingness indicator, using the [Abdi–Ranaldo measurement method](https://doi.org/10.1093/rfs/hhx084). This transforms existing prices; the paper is not evidence of predictive A-share alpha. Missingness and training-only feature pruning may also affect differences, so E1−A0 is not a causal estimate of CHL alone.
All dates are reused development data, not fresh out-of-sample or prospective evidence. Fixed costs and missing-outcome stress scenarios do not establish actual fills. Overlapping cohort means are not NAV, account returns or executable profit.
The clock is T=S+lag: enter at the adjusted open on the lag-th trading session after signal S, and exit at the adjusted close of T+h. T+1/T+3/T+5 count sessions AFTER entry, not after the signal. Missing exact-date prices remain missing; dates are never shifted.
The study remains RESEARCH_ONLY with E1 as its sole candidate. The current website model is not automatically replaced. Even a complete development pass only permits separately preregistered prospective validation with at least 60 NEW mature dates over at least 3 months and applicable independent review. This is a minimum evidence prerequisite, not an automatic pass rule. These saved-evidence integrity checks are not a formal independent promotion audit.

## Failure diagnosis

Every evaluated date selected exactly 20 securities. Coverage is no longer the limiting issue: all six E1 groups have worse full-period IC, net cohort means and MSE than reused A0. Gross cohort means are also negative in every group, so transaction costs alone do not explain failure.

Horizon | Entry lag | July IC | Other-date IC | July net mean | Other-date net mean
---|---|---|---|---|---
1 | 1 | -0.1712 | 0.0192 | -2.1896% | -0.1848%
1 | 2 | -0.1720 | 0.0145 | -1.7645% | -0.1516%
3 | 1 | -0.2205 | 0.0154 | -3.5931% | -0.0509%
3 | 2 | -0.2200 | 0.0080 | -3.5221% | -0.0434%
5 | 1 | -0.2517 | 0.0071 | -4.6621% | 0.0445%
5 | 2 | -0.2374 | -0.0065 | -4.6782% | -0.0608%

July contains 23 dates; 5/6 net cohort means remain negative across the other 103 dates. Scores are more strongly associated with historical volatility in July. E1 reduces that association relative to A0 but worsens returns, so this is descriptive evidence, not proof that volatility preference is the sole cause.

Both new measurement columns survive in all 21 fitted bundles. This is an executed feature experiment, not an unconnected implementation. Any next study needs evidence that distinguishes competing explanations; this completed run does not drop July, reverse the signal, retune or overwrite historical forecasts/outcomes. Mixed-date news caches cannot be retroactively treated as point-in-time event features.

[Full public aggregate JSON](expected-return-v10-20261023.json) · [中文](expected-return-v10-20261023.zh.md)
