'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye, Share2, Plus, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ReportTemplate = 'trend-overview' | 'category-analysis' | 'competition-analysis';
type ReportStatus = 'generating' | 'completed' | 'failed';

interface Report {
  id: string;
  name: string;
  template: ReportTemplate;
  status: ReportStatus;
  createdAt: string;
  fileUrl?: string;
  reportData?: unknown; // 真实的报告数据
  params?: {
    categories: string[];
    platforms: string[];
    dateRange: string;
  };
}

export default function ReportsPage() {
  // 使用 lazy initialization 从 localStorage 加载初始数据
  const [reports, setReports] = useState<Report[]>(() => {
    if (typeof window !== 'undefined') {
      const savedReports = localStorage.getItem('reports');
      if (savedReports) {
        try {
          return JSON.parse(savedReports);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 表单状态
  const [reportName, setReportName] = useState('');
  const [template, setTemplate] = useState<ReportTemplate>('trend-overview');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('30');

  // 辅助函数
  const getTemplateLabel = (template: ReportTemplate) => {
    const labels = {
      'trend-overview': '趋势概览报告',
      'category-analysis': '类目分析报告',
      'competition-analysis': '竞争分析报告',
    };
    return labels[template];
  };

  // 生成 HTML 报告
  const generateReportHTML = useCallback((report: Report) => {
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
    <h1>${report.name}</h1>
    <div class="meta">
      <span>生成时间：${new Date(report.createdAt).toLocaleString('zh-CN')}</span>
      <span style="margin: 0 10px;">·</span>
      <span>报告类型：${getTemplateLabel(report.template)}</span>
    </div>

    <div class="summary">
      <h2>📊 报告摘要</h2>
      <p>本报告基于最近 30 天的数据分析，涵盖多个电商平台的商品趋势。通过对市场数据的深入分析，为您提供有价值的商业洞察。</p>
    </div>

    <div class="section">
      <h2>📈 关键指标</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">1,234</div>
          <div class="metric-label">分析商品数</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #10b981;">+23%</div>
          <div class="metric-label">平均增长率</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #8b5cf6;">156</div>
          <div class="metric-label">热门类目</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #f59e0b;">89</div>
          <div class="metric-label">推荐商品</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>📉 趋势分析</h2>
      <div class="card">
        <h3>🔥 热门趋势</h3>
        <ul>
          <li>电子产品类目整体呈上升趋势，增长率达 25%</li>
          <li>智能家居设备需求持续增长，市场潜力巨大</li>
          <li>环保材料商品受到消费者青睐</li>
          <li>跨境电商持续火热，国际市场机会增多</li>
        </ul>
      </div>
      <div class="card">
        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>部分类目竞争激烈，需谨慎进入</li>
          <li>季节性商品需关注时间窗口</li>
          <li>价格敏感型商品利润空间有限</li>
          <li>供应链稳定性对业务影响重大</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>💡 推荐建议</h2>
      <div class="highlight">
        <ol>
          <li>重点关注高增长、低竞争的细分市场</li>
          <li>优化供应链，降低成本以提高竞争力</li>
          <li>关注消费者评价，持续改进产品质量</li>
          <li>利用数据分析工具，及时调整运营策略</li>
          <li>建立品牌差异化，提升客户忠诚度</li>
        </ol>
      </div>
    </div>

    <div class="section">
      <h2>✅ 结论</h2>
      <p>通过本次分析，我们发现市场整体呈现积极态势，多个类目存在良好的商业机会。建议商家根据自身资源和优势，选择合适的切入点，并持续关注市场动态，及时调整策略以获得最佳收益。</p>
    </div>

    <div class="footer">
      <p>本报告由电商趋势分析系统自动生成</p>
      <p>数据仅供参考，投资需谨慎</p>
    </div>
  </div>
</body>
</html>`;
  }, []);

  // 下载报告（导出为 HTML）
  const handleDownload = useCallback(async (report: Report) => {
    if (!report.reportData) {
      alert('报告数据不完整，无法下载');
      return;
    }

    // 动态导入HTML生成器
    const { generateReportHTML } = await import('@/lib/utils/report-html-generator');

    // 生成 HTML 报告内容
    const htmlContent = generateReportHTML(
      report.name,
      report.reportData as unknown,
      report.createdAt,
      report.template
    );

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
  }, []);

  // 监听来自预览窗口的下载请求
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'download' && event.data.reportId) {
        const report = reports.find((r) => r.id === event.data.reportId);
        if (report) {
          handleDownload(report);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [reports, handleDownload]);

  // 生成报告
  const handleGenerateReport = async () => {
    if (!reportName.trim()) {
      alert('请输入报告名称');
      return;
    }

    setGenerating(true);

    // 生成唯一ID
    const reportId = `report_${crypto.randomUUID()}`;

    const newReport: Report = {
      id: reportId,
      name: reportName,
      template,
      status: 'generating',
      createdAt: new Date().toISOString(),
      params: {
        categories: selectedCategories,
        platforms: selectedPlatforms,
        dateRange,
      },
    };

    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));

    try {
      // 调用真实的报告生成API
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reportName,
          template,
          categories: selectedCategories,
          platforms: selectedPlatforms,
          dateRange,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 更新报告状态为完成
        newReport.status = 'completed';
        newReport.reportData = result.data.reportData;
        newReport.fileUrl = `/reports/${newReport.id}.html`;

        const finalReports = [newReport, ...reports];
        setReports(finalReports);
        localStorage.setItem('reports', JSON.stringify(finalReports));

        alert('报告生成成功！');
      } else {
        // 标记为失败
        newReport.status = 'failed';
        setReports([newReport, ...reports]);
        localStorage.setItem('reports', JSON.stringify([newReport, ...reports]));

        alert(`报告生成失败: ${result.error}`);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      newReport.status = 'failed';
      setReports([newReport, ...reports]);
      localStorage.setItem('reports', JSON.stringify([newReport, ...reports]));

      alert('报告生成失败，请重试');
    } finally {
      setGenerating(false);
      setShowGenerator(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setReportName('');
    setTemplate('trend-overview');
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setDateRange('30');
  };

  // 预览报告
  const handlePreview = (report: Report) => {
    // 打开新窗口预览报告
    window.open(`/reports/preview/${report.id}`, '_blank', 'width=1200,height=800');
  };

  // 分享报告
  const handleShare = (report: Report) => {
    const shareUrl = `${window.location.origin}/reports/share/${report.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('分享链接已复制到剪贴板');
  };

  // 删除报告
  const handleDelete = (reportId: string) => {
    if (confirm('确定要删除这个报告吗？')) {
      const updatedReports = reports.filter((r) => r.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const badges = {
      generating: <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">生成中</span>,
      completed: <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">已完成</span>,
      failed: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">失败</span>,
    };
    return badges[status];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">报告中心</h1>
          <Button onClick={() => setShowGenerator(!showGenerator)}>
            <Plus className="w-4 h-4 mr-2" />
            生成新报告
          </Button>
        </div>

        {/* 报告生成器 */}
        {showGenerator && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">生成报告</h2>

            <div className="space-y-4">
              {/* 报告名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  报告名称
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="例如：2024年Q1趋势分析"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 报告模板 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报告模板
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['trend-overview', 'category-analysis', 'competition-analysis'] as ReportTemplate[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t)}
                      className={`p-4 border-2 rounded-lg text-left ${template === t
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <FileText className="w-5 h-5 mb-2" />
                      <p className="font-medium">{getTemplateLabel(t)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 类目选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择类目（可多选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {['电子产品', '服装配饰', '家居用品', '美妆护肤', '运动户外'].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        if (selectedCategories.includes(category)) {
                          setSelectedCategories(selectedCategories.filter((c) => c !== category));
                        } else {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${selectedCategories.includes(category)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 平台选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择平台（可多选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Amazon', 'AliExpress', 'eBay'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => {
                        if (selectedPlatforms.includes(platform)) {
                          setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
                        } else {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${selectedPlatforms.includes(platform)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  时间范围
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">最近7天</option>
                  <option value="30">最近30天</option>
                  <option value="90">最近90天</option>
                  <option value="180">最近180天</option>
                </select>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成报告'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowGenerator(false);
                    resetForm();
                  }}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 报告历史 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">报告历史</h2>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h3 className="font-medium">{report.name}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="text-sm text-gray-600 ml-8">
                      <span>{getTemplateLabel(report.template)}</span>
                      <span className="mx-2">·</span>
                      <span>{new Date(report.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>

                  {report.status === 'generating' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">生成中...</span>
                    </div>
                  )}

                  {report.status === 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(report)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="预览"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="下载 HTML"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleShare(report)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="分享"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无报告</p>
              <p className="text-sm mt-1">点击&ldquo;生成新报告&rdquo;开始创建</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
