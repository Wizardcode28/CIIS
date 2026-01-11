const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export type RerunIntent = 'light' | 'medium' | 'deep';

export interface ReportResponse {
  pdf?: string;
  csv?: string;
  docx?: string;
  generated_at?: string;
}

export interface RerunResponse {
  status: string;
  pdf?: string;
  csv?: string;
  docx?: string;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
  }

  async rerunReport(intent: RerunIntent): Promise<RerunResponse> {
    console.log(`[ApiService] Making request to: ${this.baseUrl}/rerun`, { intent });

    const response = await fetch(`${this.baseUrl}/rerun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.VITE_API_KEY && { 'x-api-key': import.meta.env.VITE_API_KEY })
      },
      body: JSON.stringify({ intent })
    });

    if (!response.ok) {
      let errorDetail = `${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(`Rerun failed: ${errorDetail}`);
    }

    return response.json();
  }

  async getReport(): Promise<ReportResponse> {
    const response = await fetch(`${this.baseUrl}/report`, {
      headers: {
        ...(import.meta.env.VITE_API_KEY && { 'x-api-key': import.meta.env.VITE_API_KEY })
      }
    });

    if (response.status === 404) {
      return {};
    }

    if (!response.ok) {
      throw new Error(`Get report failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(filename: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/files/${filename}`, {
      headers: {
        ...(import.meta.env.VITE_API_KEY && { 'x-api-key': import.meta.env.VITE_API_KEY })
      }
    });

    if (!response.ok) {
      throw new Error(`Get file failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  getFileUrl(filename: string): string {
    return `${this.baseUrl}/files/${filename}`;
  }
  getPdfViewUrl(filename: string): string {
    return `${this.baseUrl}/pdf/view/${filename}`;
  }

  getPdfDownloadUrl(filename: string): string {
    return `${this.baseUrl}/pdf/download/${filename}`;
  }
  getWordCloudUrl(): string {
    return `${this.baseUrl}/files/danger_wc.png`;
  }

}

export const apiService = new ApiService();