# Native Astra event classification: bounded V2 pilot

23 October 2026 · HHH research update · Research only

The native Codex workflow completed one frozen classification batch with **19 new retained materials**, using GPT-6 Astra with ultra reasoning. All 19 outputs passed the strict structure and original-sentence identifier checks, with 0 rejected materials. Python restored the selected source spans and offsets. This verifies citation locations, **not whether each citation semantically supports its label**. The implementation separately passed 52 synthetic contract tests. Model and orchestration context: [official model documentation](https://learn.chatgpt.com/docs/models) and [native subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

A separate assistant task froze the reference before classification. It used the same model family and was not human-verified or a strict cross-model audit. Eleven reference-ambiguous fields were predeclared, leaving 46 primary scored fields. The classifier's own 17 ambiguous statuses remain in the record and do not remove fields from scoring. Against this reference, native Astra matched **41/46 (89.13%)**, versus **19/46 (41.30%)** for the unchanged title-keyword rule.

| Classification axis | Reference-clear fields | Native Astra reference agreement | Fixed title-keyword agreement |
|---|---:|---:|---:|
| Subject | 17 | 17/17 (100.00%) | 6/17 (35.29%) |
| Event | 10 | 6/10 (60.00%) | 2/10 (20.00%) |
| Document form | 19 | 18/19 (94.74%) | 11/19 (57.89%) |

The agent read titles and provider excerpts; the keyword workflow read titles only. These results compare the two workflows with different information, and do not establish pure model superiority, human-gold accuracy or generalization. The 5 remaining reference-clear disagreements are preserved: four classify the event as industry when the reference selects earnings results, and one selects analyst commentary when the reference selects news. They are diagnostic questions for later research, not repaired labels or verified classifier errors. The earlier 43-material local-model pilot remains unchanged and is not used for a cross-sample improvement claim. The new reference contains only news reports and analyst commentary, with no direct-disclosure examples, so this pilot does not validate classification of issuer announcements.

Sample quality remains limited. One query to the [Eastmoney information provider](https://ai.eastmoney.com/mxmcp) returned 20 materials, but **0/20 matched the requested 21 October date window**, and 12/20 lacked original URLs. One normalized-title duplicate was excluded, leaving 19 classification test texts. Deduplication does not establish semantic novelty or market coverage. These mixed-date materials are not verified current news or point-in-time prediction inputs. Source texts and detailed labels remain private.

This V2 classification used zero local-model calls and zero external-model API calls. Native Codex account usage and cost were not measured, so the workflow is not described as free computation. Re-ingesting the saved response returned `UNCHANGED` with zero new classifications.

**All-A T+1, T+3 and T+5 return validation remains NOT_READY**, with MSE improvement, net-return improvement and Rank IC all null. There is no new return-model fit, backtest or economic advantage. Verified security mapping, availability clocks, a longitudinal all-A event panel and separately frozen return experiments are still required. Existing prospective maturity, matched-baseline stability and independent-review conditions continue to govern any later website replacement. The current public forecasting model, original forecasts and completed actual returns are preserved.

中文摘要：原生 GPT-6 Astra ultra 已完成19条新材料的固定分类试验，19条均通过结构与引用位置校验；引用位置正确不等于语义支持已经核实。对同模型家族、非人工金标准的事前参考，46个无歧义字段中一致41个，固定标题关键词一致19个。两种工作流输入不同，不能据此宣称纯模型优势，也不能与旧43条试验跨样本比较。来源返回日期未满足请求窗口，全A T+1/T+3/T+5收益验证仍未就绪，线上模型和历史记录保留。

[Aggregate machine-readable results](native-astra-events-20261023.json)
