interface ReportData {
  title: string;
  generatedAt: string;
  dateRange: string;
  summary: {
    totalProducts: number;
    avgTrendScore: number;
    topCategory: string;
  };
  products?: Array<{
    name: string;
    platform: string;
    category: string;
    price: number;
    trend_score: number;
    competition_score: number;
    recommendation_score: number;
  }>;
  categories?: Array<{
    name: string;
    productCount: number;
    avgTrendScore: number;
  }>;
}

// 导出报告为Excel
export async function exportToExcel(reportData: ReportData): Promise<Blob> {
  // 使用xlsx库导出Excel
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();

  // 摘要工作表
  const summaryData = [
    ['报告标题', reportData.title],
    ['生成时间', reportData.generatedAt],
    ['数据范围', reportData.dateRange],
    [''],
    ['商品总数', reportData.summary.totalProducts],
    ['平均趋势分数', reportData.summary.avgTrendScore.toFixed(2)],
    ['热门类目', reportData.summary.topCategory],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '摘要');

  // 商品列表工作表
  if (reportData.products && reportData.products.length > 0) {
    const productsData = [
      ['商品名称', '平台', '类目', '价格', '趋势分数', '竞争度', '推荐评分'],
      ...reportData.products.map((p) => [
        p.name,
        p.platform,
        p.category,
        p.price,
        p.trend_score,
        p.competition_score,
        p.recommendation_score,
      ]),
    ];
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, '商品列表');
  }

  // 类目分析工作表
  if (reportData.categories && reportData.categories.length > 0) {
    const categoriesData = [
      ['类目', '商品数量', '平均趋势分数'],
      ...reportData.categories.map((c) => [
        c.name,
        c.productCount,
        c.avgTrendScore.toFixed(2),
      ]),
    ];
    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, '类目分析');
  }

  // 生成Excel文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// 导出报告为CSV
export function exportToCSV(reportData: ReportData): Blob {
  let csv = '报告标题,生成时间,数据范围\n';
  csv += `${reportData.title},${reportData.generatedAt},${reportData.dateRange}\n\n`;

  csv += '商品名称,平台,类目,价格,趋势分数,竞争度,推荐评分\n';
  reportData.products?.forEach((product) => {
    csv += `${product.name},${product.platform},${product.category},${product.price},${product.trend_score},${product.competition_score},${product.recommendation_score}\n`;
  });

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

// 下载文件
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
