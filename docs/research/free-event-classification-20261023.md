# Free local news and announcement classifier: pilot result

23 October 2026 · HHH research update

An existing local Qwen model was connected to classify cached financial news and announcement fragments by subject, event and document form. This bounded pilot made **43 local inference calls and zero paid API calls**, without downloading another model. Of 43 outputs, **27 passed the validation checks and 16 were rejected** because their quoted evidence did not pass the exact substring check against the supplied text.

The reference labels were frozen before inference by a separate Codex annotation task. They are **assistant annotations, not a human-verified gold standard**. Fifteen ambiguous fields across eight materials were predeclared and excluded, leaving 114 scored fields. Rejected outputs count as nonmatches on the remaining unambiguous fields.

| Classification axis | Scored fields | Local Qwen reference agreement | Fixed keyword reference agreement |
|---|---:|---:|---:|
| Subject | 38 | 22/38 (57.89%) | 30/38 (78.95%) |
| Event | 37 | 21/37 (56.76%) | 24/37 (64.86%) |
| Document form | 39 | 14/39 (35.90%) | 33/39 (84.62%) |

The local model trailed the keyword baseline on all three axes in this development sample. The results do not establish general classification accuracy. The small, uneven convenience sample contains related fragments and does not represent the full market.

**All-A T+1, T+3 and T+5 return validation remains NOT_READY.** The current inputs lack verified point-in-time availability, validated security mapping, a longitudinal all-A event panel and new mature candidate dates. No new return model was fitted and no return experiment was run. Missing news cannot be treated as verified absence of an event, and newly classified material cannot be inserted into earlier forecasts.

The existing public forecasting model and historical forecasts/returns remain unchanged. A classifier will enter a separate return study only after its data requirements and fixed validation protocol are met; stable matched-baseline performance and the existing prospective review conditions remain necessary for any website model replacement.

中文摘要：已复用本地 Qwen 完成43条新闻与公告分类试验，付费调用为0。27条通过校验，16条因引用证据未通过原文精确匹配而被隔离。对事前冻结的 Codex 参考标注，三个分类轴均未超过固定关键词基线；这些结果不能称为人工金标准准确率或收益提升。全A股 T+1、T+3、T+5 均尚不具备收益验证条件，继续保留原网页模型、历史预测和实际收益。

[Aggregate machine-readable results](free-event-classification-20261023.json) · [Qwen model card](https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct) · [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
