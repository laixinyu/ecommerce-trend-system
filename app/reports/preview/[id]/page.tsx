'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Download, Printer } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  template: string;
  status: string;
  createdAt: string;
  fileUrl?: string;
}

export default function ReportPreviewPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 加载报告数据
    const loadReport = () => {
      const savedReports = localStorage.getItem('reports');
      if (savedReports) {
        try {
          const reports = JSON.parse(savedReports);
          const foundReport = reports.find((r: Report) => r.id === params.id);
          setReport(foundReport || null);
        } catch (error) {
          console.error('加载报告失败:', error);
        }
      }
      setLoading(false);
    };

    loadReport();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;

    // 生成 HTML 报告内容
    const htmlContent = generateReportHTML(report);
    
    // 创建 Blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.html`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 生成 HTML 报告
  const generateReportHTML = (report: Report) => {
    // 获取当前页面的完整 HTML 内容
    const content = document.querySelector('.report-content')?.innerHTML || '';
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      max-width: 900px; 
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
    .metric { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .metric-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
    .section { margin: 30px 0; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
    ul, ol { margin-left: 20px; }
    li { margin: 8px 0; }
    .highlight { background: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="加载报告..." />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">报告不存在</p>
          <Button onClick={() => window.close()}>关闭窗口</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 工具栏 */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold">{report.name}</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载 HTML
            </Button>
          </div>
        </div>

        {/* 报告内容 */}
        <Card className="p-8 report-content">
          {/* 报告标题 */}
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold mb-2">{report.name}</h1>
            <div className="text-sm text-gray-600">
              <span>生成时间：{new Date(report.createdAt).toLocaleString('zh-CN')}</span>
              <span className="mx-2">·</span>
              <span>报告类型：{getTemplateLabel(report.template)}</span>
            </div>
          </div>

          {/* 报告摘要 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📊 报告摘要</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700">
                本报告基于最近 30 天的数据分析，涵盖多个电商平台的商品趋势。
                通过对市场数据的深入分析，为您提供有价值的商业洞察。
              </p>
            </div>
          </section>

          {/* 关键指标 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📈 关键指标</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">1,234</div>
                <div className="text-sm text-gray-600 mt-1">分析商品数</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">+23%</div>
                <div className="text-sm text-gray-600 mt-1">平均增长率</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-gray-600 mt-1">热门类目</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">89</div>
                <div className="text-sm text-gray-600 mt-1">推荐商品</div>
              </div>
            </div>
          </section>

          {/* 趋势分析 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📉 趋势分析</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">🔥 热门趋势</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 电子产品类目整体呈上升趋势，增长率达 25%</li>
                  <li>• 智能家居设备需求持续增长，市场潜力巨大</li>
                  <li>• 环保材料商品受到消费者青睐</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">⚠️ 注意事项</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 部分类目竞争激烈，需谨慎进入</li>
                  <li>• 季节性商品需关注时间窗口</li>
                  <li>• 价格敏感型商品利润空间有限</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 推荐建议 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">💡 推荐建议</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. 重点关注高增长、低竞争的细分市场</li>
                <li>2. 优化供应链，降低成本以提高竞争力</li>
                <li>3. 关注消费者评价，持续改进产品质量</li>
                <li>4. 利用数据分析工具，及时调整运营策略</li>
              </ol>
            </div>
          </section>

          {/* 报告结论 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">✅ 结论</h2>
            <p className="text-gray-700 leading-relaxed">
              通过本次分析，我们发现市场整体呈现积极态势，多个类目存在良好的商业机会。
              建议商家根据自身资源和优势，选择合适的切入点，并持续关注市场动态，
              及时调整策略以获得最佳收益。
            </p>
          </section>

          {/* 页脚 */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            <p>本报告由电商趋势分析系统自动生成</p>
            <p className="mt-1">数据仅供参考，投资需谨慎</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getTemplateLabel(template: string) {
  const labels: Record<string, string> = {
    'trend-overview': '趋势概览报告',
    'category-analysis': '类目分析报告',
    'competition-analysis': '竞争分析报告',
  };
  return labels[template] || '未知类型';
}
