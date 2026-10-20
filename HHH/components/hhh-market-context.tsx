import { Panel } from './hhh-ui';

export default function MarketContext(){return <Panel title="市场线索 · BTC 与 Q-day" note="核对日期 2026-10-20 · 事件观察，尚未进入选股评分">
 <div className="event-grid">
  <article><h3>量子进展 ≠ 已经破解</h3><p>Google 3 月研究下调了破解椭圆曲线密码所需的未来量子计算资源估计；这是技术可行性研究，并非已破解 BTC 钱包的公告。</p><p>10 月 13 日 Coinbase 发布迁移准备讨论，10 月 15 日论坛也在讨论地址复用与公钥暴露。本次查到的材料不支持“Q-day 已发生”。</p><a href="https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/" target="_blank" rel="noreferrer">Google 原始研究说明</a><br/><a href="https://www.coinbase.com/blog/working-together-on-btc-post-quantum-readiness" target="_blank" rel="noreferrer">Coinbase 10 月 13 日讨论</a></article>
  <article><h3>中本聪持币数量尚有归属争议</h3><p>“中本聪钱包有 200 万枚”不能作为已核实前提。Patoshi 研究估计该早期矿工约挖出 110 万枚，但矿工归属中本聪本身也属于推断，并不是一个已证实的单一钱包余额。</p><p>即使发生技术突破，暴露公钥、获得控制、链上转移、进入交易所、实际卖出仍是不同环节。</p><a href="https://bitslog.com/2020/06/22/a-new-mystery-in-patoshi-timestamps/" target="_blank" rel="noreferrer">Patoshi 研究者原文</a></article>
  <article><h3>传导到股票：可以检验的假设</h3><p>可检验路径：量子消息冲击 → BTC 抛售／杠杆去化 → 共同持仓减仓 → 股票承压。还需比较利率、美元、财报等共同驱动，不能凭同跌确认因果。</p><p>xStocks 确有股票代币，但代表底层股票的价格敞口，可用法币或加密资产购买；这不等于美股由 BTC 抵押，也不产生 BTC 下跌必然带动全市场下跌的机械关系。</p><a href="https://support.kraken.com/articles/xstocks-faq" target="_blank" rel="noreferrer">Kraken 产品机制</a></article>
 </div>
 <details className="stock-notes"><summary>后续验证项与论坛出处</summary><p>尚待获取：具体下跌时段、消息发布时间、异常老币交易哈希、交易所净流入、强平与跨资产收益。没有这些证据，本页不把 Q-day 定为本轮股市下跌原因，也不自动调整量化权重。</p><p><a href="https://www.reddit.com/r/Bitcoin/comments/1x6lpcr/one_in_four_bitcoin_is_quantum_exposed_because_of/" target="_blank" rel="noreferrer">10 月 15 日 Reddit 讨论</a>：本次仅检索摘要可见，完整帖文未能读取；作为讨论线索，不作为技术事实证据。</p></details>
 </Panel>}
