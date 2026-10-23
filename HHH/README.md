# HHH / A 股研究工作台

[Live demo / 在线演示](https://kennyscannotkillme.github.io/kennys.github.io/HHH/) · [Bilingual project guide / 中英双语项目说明](../README.md)

Frontend source, public research snapshots and generated static website files. See the repository guide for setup, features, data dates and interpretation limits.

本目录包含前端源码、公开研究快照与静态网站文件。安装方式、功能、数据日期和研究限制见仓库首页。

Accepted research release: 20 October 2026, daily-data source commit `bbb246b3343e5b5784c0c71ea2083e6c44c7f868`. Three independently ranked T+1/T+3/T+5 return horizons cover 5,382 eligible A-shares, alongside a separate 20-ETF journal. Initial validation did not beat historical-mean or zero-return baselines. Research only; no profitable-alpha or live-execution claim. Private research pipelines and databases are not distributed.

本版覆盖 5,382 只符合条件的 A 股，按 T+1/T+3/T+5 分别预测与排名，另有 20 只 ETF 记录。首轮验证未超过历史均值或零收益基线，仅作研究展示，不宣称盈利能力或实盘执行。私人研究流程及数据库不在仓库发布。

Daily signals are dated 20 October 2026, with a 21 October entry reference. Frozen V1 models are unchanged. Historical records remain available. / 每日信号日期为 2026 年 10 月 20 日，入场参考日为 10 月 21 日；冻结 V1 模型未变，历史记录保留。

[Completed V6 study / V6 完整验证结果](../docs/research/v6-20261020.md): paper-derived features and selection tested; 0/6 groups passed for both candidates. Public V1 and historical records retained.


Completed V7 (21 October): 21 new fits tested eight turnover-based cost-state inputs and fixed sign-conflict selection. Both candidates passed 0/6 development groups. B2 reduced observed losses but had six dates below 20 names; full coverage/stress gates failed. Public V1 and daily forecasts remain unchanged. [Results and exact return definition / 结果与收益口径](../docs/research/v7-20261021.md).

V7 已完成：成本状态特征与固定符号筛选均未通过六组验证；部分观察收益改善不构成稳定优势，线上模型与历史记录保留。



Completed V8 (21 October): 42 new fits tested phase dependence and continuous state interactions. Both candidates selected 20 names on every evaluation date, but each passed 0/6 development groups. July loss reduction did not establish stable predictive performance. Public V1 and forecasts remain unchanged. [Results / 完整结果](../docs/research/v8-20261021.md).

V8 已完成：选满 20 只的覆盖缺口已解决，两个候选仍均未通过六组验证；单月改善不等于稳定盈利，线上 V1 保留。

[23 October data-source integration / 10 月 23 日数据源接入进度](../docs/research/provider-integration-20261023.md): authenticated catalogs, one cached news-retrieval check and 63 passing targeted tests; forecasting models and historical records unchanged. / 认证目录、单次新闻读取及缓存验证完成，63 项针对性测试通过；预测模型与历史记录保留。


Completed V9 (23 October): 21 native Ridge fits and 21 characteristic-cell table bundles tested historical size/BM and return salience across all three horizons and both entry clocks. D1 and D2 each passed 0/6 development groups. Full Top20 coverage was retained, but prediction and economic gates failed. Public V1 and historical forecasts remain unchanged. [Results / 完整结果](../docs/research/v9-20261023.md).

V9 已完成：历史规模、估值、收益显著性及特征分组选股均已按三个期限、两种入场时钟验证。两个候选均 0/6 组通过，保留线上 V1 与全部历史记录。


[Free local event-classification pilot / 免费本地资讯分类试验（23 October）](../docs/research/free-event-classification-20261023.md): 43 local calls, 27 accepted and 16 evidence-check rejections. The local model trailed fixed keyword rules on all three classification axes against a predeclared assistant reference. All-A T+1/T+3/T+5 return validation remains NOT_READY; the public forecast model and historical records are unchanged.


[Native Astra event-classification V2 / 原生 Astra 资讯分类 V2（23 October）](../docs/research/native-astra-events-20261023.md): 19/19 materials passed structure and citation-location checks. Reference agreement was 41/46 versus 19/46 for fixed title keywords; the nonhuman reference and different input information limit interpretation. All-A T+1/T+3/T+5 return validation remains NOT_READY, with the public model and history preserved. / 仅发布分类工程与参考一致性结果，不作人工金标准准确率、纯模型优势或收益提升声明。


## V10 research update · 23 October 2026

A predeclared CHL liquidity-measurement feature experiment completed 21 new monthly fits across all-A T+1/T+3/T+5 and two entry lags. It passed 0/6 development groups and did not replace the website model. Both the negative findings and prior forecasts/outcomes are retained.

新增 CHL 流动性测量特征完成三期限、两种入场延迟验证，6 组均未通过；保留失败证据与历史预测，不替换网页模型。

- [中文方法、结果与失败诊断](../docs/research/expected-return-v10-20261023.zh.md)
- [English methods and results](../docs/research/expected-return-v10-20261023.en.md)
- [Aggregate data](../docs/research/expected-return-v10-20261023.json)
