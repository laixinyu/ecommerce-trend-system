import { createClient } from '@/lib/supabase/server';
import { ExportJob, DataSource } from '@/types/intelligence';
import { DataAggregator } from './data-aggregator';

export class DataExporter {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Create an export job
   */
  async createExportJob(
    type: 'excel' | 'csv' | 'google_sheets' | 'power_bi' | 'tableau',
    dataSource: DataSource,
    filters?: Record<string, any>
  ): Promise<ExportJob> {
    const job: ExportJob = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      type,
      data_source: dataSource,
      filters,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await this.supabase.from('export_jobs').insert(job);

    // Process export asynchronously
    this.processExport(job).catch(error => {
      console.error('Error processing export:', error);
    });

    return job;
  }

  /**
   * Process an export job
   */
  private async processExport(job: ExportJob): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('export_jobs')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // Fetch data
      const data = await DataAggregator.fetchDataFromSource(job.data_source, this.userId);

      // Apply filters if provided
      const filteredData = job.filters ? this.applyFilters(data, job.filters) : data;

      // Generate export file
      let fileUrl: string;

      switch (job.type) {
        case 'csv':
          fileUrl = await this.exportToCSV(filteredData, job);
          break;
        case 'excel':
          fileUrl = await this.exportToExcel(filteredData, job);
          break;
        case 'google_sheets':
          fileUrl = await this.exportToGoogleSheets(filteredData, job);
          break;
        case 'power_bi':
          fileUrl = await this.exportToPowerBI(filteredData, job);
          break;
        case 'tableau':
          fileUrl = await this.exportToTableau(filteredData, job);
          break;
        default:
          throw new Error(`Unsupported export type: ${job.type}`);
      }

      // Update job with file URL
      await this.supabase
        .from('export_jobs')
        .update({
          status: 'completed',
          file_url: fileUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    } catch (error: any) {
      console.error('Export processing error:', error);
      
      await this.supabase
        .from('export_jobs')
        .update({
          status: 'failed',
          error: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    return data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(data: any[], job: ExportJob): Promise<string> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    // Generate CSV content
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Upload to Supabase Storage
    const fileName = `exports/${job.id}.csv`;
    const { data: uploadData, error } = await this.supabase.storage
      .from('exports')
      .upload(fileName, csvContent, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload CSV: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Export to Excel (simplified - generates CSV with .xlsx extension)
   */
  private async exportToExcel(data: any[], job: ExportJob): Promise<string> {
    // In a real implementation, you would use a library like exceljs
    // For now, we'll just create a CSV with .xlsx extension
    const csvUrl = await this.exportToCSV(data, job);
    return csvUrl.replace('.csv', '.xlsx');
  }

  /**
   * Export to Google Sheets
   */
  private async exportToGoogleSheets(data: any[], job: ExportJob): Promise<string> {
    // This would require Google Sheets API integration
    // For now, return a placeholder
    throw new Error('Google Sheets export not yet implemented');
  }

  /**
   * Export to Power BI
   */
  private async exportToPowerBI(data: any[], job: ExportJob): Promise<string> {
    // This would require Power BI API integration
    // For now, export as CSV which can be imported to Power BI
    return await this.exportToCSV(data, job);
  }

  /**
   * Export to Tableau
   */
  private async exportToTableau(data: any[], job: ExportJob): Promise<string> {
    // This would require Tableau API integration
    // For now, export as CSV which can be imported to Tableau
    return await this.exportToCSV(data, job);
  }

  /**
   * Get export job status
   */
  async getExportJob(jobId: string): Promise<ExportJob | null> {
    const { data, error } = await this.supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Error fetching export job:', error);
      return null;
    }

    return data;
  }

  /**
   * List export jobs
   */
  async listExportJobs(limit: number = 50): Promise<ExportJob[]> {
    const { data, error } = await this.supabase
      .from('export_jobs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error listing export jobs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate custom report
   */
  async generateReport(
    templateId: string,
    params?: Record<string, any>
  ): Promise<string> {
    // Fetch report template
    const { data: template } = await this.supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', this.userId)
      .single();

    if (!template) {
      throw new Error('Report template not found');
    }

    // Collect data for each section
    const reportData: any = {};

    for (const section of template.sections) {
      if (section.data_source) {
        const data = await DataAggregator.fetchDataFromSource(
          section.data_source,
          this.userId
        );
        reportData[section.id] = data;
      }
    }

    // Generate report (simplified - would use a template engine in production)
    const reportContent = this.renderReport(template, reportData);

    // Upload report
    const fileName = `reports/${crypto.randomUUID()}.html`;
    const { error } = await this.supabase.storage
      .from('exports')
      .upload(fileName, reportContent, {
        contentType: 'text/html',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload report: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Render report from template
   */
  private renderReport(template: any, data: any): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          h2 { color: #666; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${template.name}</h1>
        <p>${template.description || ''}</p>
    `;

    for (const section of template.sections) {
      html += `<h2>${section.title}</h2>`;

      if (section.type === 'text') {
        html += `<p>${section.config.content || ''}</p>`;
      } else if (section.type === 'table' && data[section.id]) {
        html += this.renderTable(data[section.id]);
      } else if (section.type === 'metrics' && data[section.id]) {
        html += this.renderMetrics(data[section.id]);
      }
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Render table
   */
  private renderTable(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '<p>No data available</p>';
    }

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';

    for (const header of headers) {
      html += `<th>${header}</th>`;
    }

    html += '</tr></thead><tbody>';

    for (const row of data) {
      html += '<tr>';
      for (const header of headers) {
        html += `<td>${row[header]}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
  }

  /**
   * Render metrics
   */
  private renderMetrics(data: any): string {
    let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">';

    for (const [key, value] of Object.entries(data)) {
      html += `
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <div style="color: #666; font-size: 14px;">${key}</div>
          <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${value}</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }
}
