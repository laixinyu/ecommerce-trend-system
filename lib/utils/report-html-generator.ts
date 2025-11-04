/**
 * 报告HTML生成器 - 将报告数据转换为HTML格式
 */

import type { ReportData } from '../analytics/report-generator';

export function generateReportHTML(
  reportName: string,
  reportData: ReportData,
  createdAt: string,
  template: string
): string {
  const templateLabel = getTemplateLabel(template);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 40px 20px;
      background: #f9fafb;
    }
    .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { font-size: 32px; margin-bottom: 10px; color: #1f2937; }
    h2 { font-size: 24px; margin: 30px 0 15px; color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
    h3 { font-size: 18px; margin: 20px 0 10px; color: #4b5563; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
    .summary { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
    .metric-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .metric-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
    .section { margin: 30px 0; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fafafa; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    ul, ol { margin-left: 20px; }
    li { margin: 8px 0; }
    .highlight { background: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .danger { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${reportName}</h1>
    <div class="meta">
      <span>生成时间：${new Date(createdAt).toLocaleString('zh-CN')}</span>
      <span style="margin: 0 10px;">·</span>
      <span>报告类型：${templateLabel}</span>
    </div>

    ${generateSummarySection(reportData)}
    ${generateMarketOverviewSection(reportData)}
    ${generateTrendAnalysisSection(reportData)}
    ${generateCompetitionAnalysisSection(reportData)}
    ${generateProfitAnalysisSection(reportData)}
    ${generateOpportunitiesSection(reportData)}
    ${generateRisksSection(reportData)}
    ${generateRecommendationsSection(reportData)}

    <div class="footer">
      <p>本报告由电商趋势分析系统自动生成</p>
      <p class="mt-1">数据基于真实市场数据分析，仅供参考</p>
    </div>
  </div>
</body>
</html>`;
}

function getTemplateLabel(template: string): string {
  const labels: Record<string, string> = {
    'trend-overview': '趋势概览报告',
    'category-analysis': '类目分析报告',
    'competition-analysis': '竞争分析报告',
  };
  return labels[template] || '分析报告';
}

function generateSummarySection(data: ReportData): string {
  return `
    <div class="summary">
      <h2>📊 报告摘要</h2>
      <p>本报告基于 <strong>${data.summary.totalProducts}</strong> 个商品的真实数据分析，
      平均增长率为 <strong>${data.summary.avgGrowthRate}%</strong>，
      发现 <strong>${data.summary.hotCategories}</strong> 个热门类目，
      推荐 <strong>${data.summary.recommendedProducts}</strong> 个优质商品。</p>
    </div>

    <div class="section">
      <h2>📈 关键指标</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${data.summary.totalProducts}</div>
          <div class="metric-label">分析商品数</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: ${data.summary.avgGrowthRate >= 20 ? '#10b981' : data.summary.avgGrowthRate >= 10 ? '#f59e0b' : '#ef4444'};">
            ${data.summary.avgGrowthRate >= 0 ? '+' : ''}${data.summary.avgGrowthRate}%
          </div>
          <div class="metric-label">平均增长率</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #8b5cf6;">${data.summary.hotCategories}</div>
          <div class="metric-label">热门类目</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #f59e0b;">${data.summary.recommendedProducts}</div>
          <div class="metric-label">推荐商品</div>
        </div>
      </div>
    </div>
  `;
}

function generateMarketOverviewSection(data: ReportData): string {
  const platformRows = data.marketOverview.platformDistribution
    .map(p => `<tr><td>${p.platform}</td><td>${p.count}</td><td>${p.percentage}%</td></tr>`)
    .join('');

  const priceRows = data.marketOverview.priceRanges
    .map(p => `<tr><td>${p.range}</td><td>${p.count}</td><td>$${p.avgPrice.toFixed(2)}</td></tr>`)
    .join('');

  return `
    <div class="section">
      <h2>🌍 市场概况</h2>
      
      <div class="grid-2">
        <div class="card">
          <h3>平台分布</h3>
          <table>
            <thead>
              <tr><th>平台</th><th>商品数</th><th>占比</th></tr>
            </thead>
            <tbody>${platformRows}</tbody>
          </table>
        </div>

        <div class="card">
          <h3>价格区间分布</h3>
          <table>
            <thead>
              <tr><th>价格区间</th><th>商品数</th><th>平均价格</th></tr>
            </thead>
            <tbody>${priceRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function generateTrendAnalysisSection(data: ReportData): string {
  const total = data.trendAnalysis.highTrendProducts + 
                data.trendAnalysis.mediumTrendProducts + 
                data.trendAnalysis.lowTrendProducts;

  return `
    <div class="section">
      <h2>📉 趋势分析</h2>
      
      <div class="card">
        <h3>趋势分布</h3>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value" style="color: #10b981;">${data.trendAnalysis.highTrendProducts}</div>
            <div class="metric-label">高趋势商品 (≥70分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.trendAnalysis.highTrendProducts / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #f59e0b;">${data.trendAnalysis.mediumTrendProducts}</div>
            <div class="metric-label">中等趋势 (40-70分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.trendAnalysis.mediumTrendProducts / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ef4444;">${data.trendAnalysis.lowTrendProducts}</div>
            <div class="metric-label">低趋势商品 (<40分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.trendAnalysis.lowTrendProducts / total) * 100) : 0}%
            </div>
          </div>
        </div>
        <p style="margin-top: 15px; color: #6b7280;">
          平均趋势分数：<strong>${data.trendAnalysis.avgTrendScore.toFixed(1)}</strong> / 100
        </p>
      </div>
    </div>
  `;
}

function generateCompetitionAnalysisSection(data: ReportData): string {
  const total = data.competitionAnalysis.lowCompetition + 
                data.competitionAnalysis.mediumCompetition + 
                data.competitionAnalysis.highCompetition;

  return `
    <div class="section">
      <h2>⚔️ 竞争分析</h2>
      
      <div class="card">
        <h3>竞争度分布</h3>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value" style="color: #10b981;">${data.competitionAnalysis.lowCompetition}</div>
            <div class="metric-label">低竞争 (≤3分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.competitionAnalysis.lowCompetition / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #f59e0b;">${data.competitionAnalysis.mediumCompetition}</div>
            <div class="metric-label">中等竞争 (3-7分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.competitionAnalysis.mediumCompetition / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ef4444;">${data.competitionAnalysis.highCompetition}</div>
            <div class="metric-label">高竞争 (>7分)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.competitionAnalysis.highCompetition / total) * 100) : 0}%
            </div>
          </div>
        </div>
        <p style="margin-top: 15px; color: #6b7280;">
          平均竞争度：<strong>${data.competitionAnalysis.avgCompetitionScore.toFixed(1)}</strong> / 10
        </p>
      </div>
    </div>
  `;
}

function generateProfitAnalysisSection(data: ReportData): string {
  const total = data.profitAnalysis.highProfitProducts + 
                data.profitAnalysis.mediumProfitProducts + 
                data.profitAnalysis.lowProfitProducts;

  return `
    <div class="section">
      <h2>💰 利润分析（经营决策核心）</h2>
      
      <div class="highlight">
        <h3>利润空间评估</h3>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value" style="color: #10b981;">${data.profitAnalysis.highProfitProducts}</div>
            <div class="metric-label">高利润商品 (≥30%)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.profitAnalysis.highProfitProducts / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #f59e0b;">${data.profitAnalysis.mediumProfitProducts}</div>
            <div class="metric-label">中等利润 (20-30%)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.profitAnalysis.mediumProfitProducts / total) * 100) : 0}%
            </div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #ef4444;">${data.profitAnalysis.lowProfitProducts}</div>
            <div class="metric-label">低利润商品 (<20%)</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${total > 0 ? Math.round((data.profitAnalysis.lowProfitProducts / total) * 100) : 0}%
            </div>
          </div>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #10b981;">
          <p><strong>平均利润率：</strong> ${data.profitAnalysis.avgProfitMargin.toFixed(1)}%</p>
          <p><strong>平均ROI：</strong> ${data.profitAnalysis.avgROI.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  `;
}

function generateOpportunitiesSection(data: ReportData): string {
  const topOpps = data.opportunities.topOpportunities
    .slice(0, 5)
    .map((opp, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="max-width: 300px;">${opp.name}</td>
        <td><span class="badge badge-blue">${opp.platform}</span></td>
        <td>${opp.trendScore.toFixed(0)}</td>
        <td>${opp.competitionScore.toFixed(1)}</td>
        <td>${opp.profitMargin.toFixed(1)}%</td>
        <td><span class="badge badge-green">${opp.reason}</span></td>
      </tr>
    `)
    .join('');

  return `
    <div class="section">
      <h2>🎯 机会识别</h2>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-value" style="color: #3b82f6;">${data.opportunities.blueOcean}</div>
          <div class="metric-label">蓝海市场</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">高趋势+低竞争</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #10b981;">${data.opportunities.quickWins}</div>
          <div class="metric-label">快速获胜</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">高利润+低竞争</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #ef4444;">${data.opportunities.risky}</div>
          <div class="metric-label">高风险商品</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">低利润+高竞争</div>
        </div>
      </div>

      <div class="card">
        <h3>Top 5 机会商品</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>商品名称</th>
              <th>平台</th>
              <th>趋势</th>
              <th>竞争</th>
              <th>利润率</th>
              <th>推荐理由</th>
            </tr>
          </thead>
          <tbody>${topOpps || '<tr><td colspan="7" style="text-align: center; color: #6b7280;">暂无数据</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

function generateRisksSection(data: ReportData): string {
  const warnings = data.risks.warnings.length > 0
    ? data.risks.warnings.map(w => `<li>${w}</li>`).join('')
    : '<li>未发现重大风险</li>';

  return `
    <div class="section">
      <h2>⚠️ 风险评估</h2>
      
      ${data.risks.warnings.length > 0 ? `
        <div class="warning">
          <h3>⚠️ 风险警告</h3>
          <ul>${warnings}</ul>
        </div>
      ` : `
        <div class="highlight">
          <p>✅ 未发现重大风险，市场环境良好</p>
        </div>
      `}

      <div class="card">
        <h3>风险指标</h3>
        <p><strong>高风险商品数量：</strong> ${data.risks.highRiskProducts}</p>
        <p><strong>饱和市场：</strong> ${data.risks.saturatedMarkets.length > 0 ? data.risks.saturatedMarkets.join(', ') : '无'}</p>
        <p><strong>低利润类目：</strong> ${data.risks.lowMarginCategories.length > 0 ? data.risks.lowMarginCategories.join(', ') : '无'}</p>
      </div>
    </div>
  `;
}

function generateRecommendationsSection(data: ReportData): string {
  const topProducts = data.recommendations.topProducts
    .slice(0, 5)
    .map((prod, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="max-width: 300px;">${prod.name}</td>
        <td><span class="badge badge-blue">${prod.platform}</span></td>
        <td>${prod.score.toFixed(0)}</td>
        <td>${prod.reasons.join(', ')}</td>
      </tr>
    `)
    .join('');

  return `
    <div class="section">
      <h2>💡 推荐建议</h2>
      
      <div class="highlight">
        <h3>Top 5 推荐商品</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>商品名称</th>
              <th>平台</th>
              <th>评分</th>
              <th>推荐理由</th>
            </tr>
          </thead>
          <tbody>${topProducts || '<tr><td colspan="5" style="text-align: center; color: #6b7280;">暂无推荐</td></tr>'}</tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>定价策略</h3>
          <p>${data.recommendations.pricingStrategy}</p>
        </div>

        <div class="card">
          <h3>进入策略</h3>
          <p>${data.recommendations.entryStrategy}</p>
        </div>
      </div>

      ${data.recommendations.avoidCategories.length > 0 ? `
        <div class="danger">
          <h3>⚠️ 应避免的类目</h3>
          <p>${data.recommendations.avoidCategories.join(', ')}</p>
        </div>
      ` : ''}
    </div>

    <div class="section">
      <h2>✅ 结论</h2>
      <p>通过本次分析，我们基于 <strong>${data.summary.totalProducts}</strong> 个真实商品数据，
      发现了 <strong>${data.opportunities.blueOcean}</strong> 个蓝海市场机会和 
      <strong>${data.opportunities.quickWins}</strong> 个快速获胜机会。
      建议商家根据自身资源和优势，优先关注推荐的商品和类目，
      同时注意规避高风险区域，持续关注市场动态以获得最佳收益。</p>
    </div>
  `;
}
