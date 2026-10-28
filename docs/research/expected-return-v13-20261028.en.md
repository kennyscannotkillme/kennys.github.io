# V13 research iteration · 28 October 2026

**Research history updated; daily forecasts remain on V1.** The frozen experiment passed 0/6 groups. V13 is not adopted because its incremental result is unstable: P-pool MSE is worse than saved C2 in 5/6 groups, returns after costs are worse in 4/6, and full-period T+1/lag1 returns deteriorate against the actual V1 policy.

One new input combines high cash trading activity within the stock's own 50-session history (average rank at least 46) with a normal adjusted daily return (own-history average rank 16–35), plus a missing indicator. The C2 learner, P selection pool and expected-return ordering are retained. The bounded study completed 21 fits and 42 horizon/lag score tables, without a second arm or threshold/sign search.

Gervais, Kaniel and Mingelgrin motivate the representation. Actual CNY trading amount adapts the manuscript's close-times-share-volume proxy. This is existing OHLCV represented differently, not new external information or a demonstrated attention mechanism. Short-horizon associations motivate a test; the manuscript's market-order bid/ask results are negative and do not establish profitability here. [Author manuscript](https://rodneywhitecenter.wharton.upenn.edu/wp-content/uploads/2014/04/9901.pdf)

## Comparison with the actual public V1 policy

The reused development period is 2026-04-01–2026-10-08, with 126 mature signal dates. MSE and RankIC use the same full-E universe. V1 retains its original E Top20 selection; V13 selects within P. Return differences therefore combine the earlier architecture and pool changes and cannot all be attributed to the new input. Lag is the exchange-session gap from signal to entry.

| Horizon / lag | MSE improvement vs V1 | V1 → V13 RankIC | V1 → V13 return after costs | Return change (pp) |
|---|---:|---:|---:|---:|
| T+1 / 1 | +0.8910% | -0.04449 → -0.01498 | -0.1166% → -0.4814% | -0.3648 |
| T+1 / 2 | +0.7670% | -0.04538 → -0.01844 | -0.4787% → -0.4520% | +0.0267 |
| T+3 / 1 | +0.9013% | -0.05961 → -0.02565 | -1.1709% → -0.6290% | +0.5418 |
| T+3 / 2 | +0.7080% | -0.05560 → -0.03083 | -1.2365% → -0.6175% | +0.6190 |
| T+5 / 1 | +0.3172% | -0.07028 → -0.03715 | -1.9778% → -0.7525% | +1.2253 |
| T+5 / 2 | +0.1811% | -0.07105 → -0.04543 | -2.3389% → -0.8460% | +1.4930 |

All groups improve MSE and RankIC; five improve returns, while T+1/lag1 deteriorates. Every V13 RankIC and return after costs remains negative. MSE remains worse than the historical-mean M0 baseline, and returns remain below same-P LOW_VOL20.

## Increment over the saved, unrefitted C2 control

| Horizon / lag | P MSE improvement vs C2 | P RankIC change | Return change (pp) |
|---|---:|---:|---:|
| T+1 / 1 | -0.001847% | -0.000098 | -0.03843 |
| T+1 / 2 | -0.001784% | -0.000060 | -0.03830 |
| T+3 / 1 | -0.001701% | +0.000228 | +0.03010 |
| T+3 / 2 | -0.001446% | +0.000278 | +0.00744 |
| T+5 / 1 | -0.000004% | +0.000429 | -0.02866 |
| T+5 / 2 | +0.000689% | +0.000424 | -0.00438 |

P-pool MSE worsens in 5/6 groups and returns worsen in 4/6. Tiny full-E error improvements do not establish a stable selection benefit. Same-P V1 reranking is separately reported as a diagnostic, not the original public policy.

## Recent window and limitations

The fixed recent-60-date window is 2026-07-09–2026-10-08. It is not fresh unseen evidence.

| Horizon / lag | MSE improvement vs V1 | V1 → V13 RankIC | V1 → V13 return after costs | Return change (pp) |
|---|---:|---:|---:|---:|
| T+1 / 1 | +1.5825% | -0.09429 → -0.05303 | -1.2812% → -0.7114% | +0.5699 |
| T+1 / 2 | +1.3171% | -0.08381 → -0.04621 | -1.2117% → -0.5787% | +0.6330 |
| T+3 / 1 | +1.5371% | -0.09664 → -0.05150 | -2.4088% → -0.9990% | +1.4098 |
| T+3 / 2 | +1.1043% | -0.08222 → -0.04990 | -2.0338% → -0.9415% | +1.0922 |
| T+5 / 1 | +0.3822% | -0.09734 → -0.05355 | -3.2863% → -1.3273% | +1.9590 |
| T+5 / 2 | +0.1701% | -0.08731 → -0.05344 | -3.0381% → -1.0627% | +1.9754 |

All recent groups improve against V1 but still fail the M0/LOW_VOL20 comparisons. In July all six MSE comparisons against V1 deteriorate; in May all six RankIC and return comparisons deteriorate. October has only one mature date and does not establish monthly stability.

Returns are daily-equal averages of overlapping Top20 holding cohorts after a fixed 31bp scenario, not account NAV, compound strategy returns or verified fills. Missing outcomes and failed gates remain visible. Saved arithmetic checks passed and 3013 protected/frozen files stayed unchanged. These are cooperative checks, not an independent promotion audit.

The bounded news/notice repair made 2 actual business calls and verified cached replay. Original timezone and security mapping remain unverified; the fragments are neither a complete feed nor eligible historical return features. No old forecast was backfilled.

The progressive research policy permits adopting a materially improved research version before every simple baseline is beaten. This non-adoption rests on unstable incremental results and concrete regressions, not that universal requirement. Original experiment verdicts, the V1 daily model and old predictions/completed outcomes stay intact. No prior 28 October prediction is fabricated and no automated trading is enabled.

[中文](expected-return-v13-20261028.zh.md) · [Complete horizon/lag and baseline aggregates](expected-return-v13-20261028.json)
