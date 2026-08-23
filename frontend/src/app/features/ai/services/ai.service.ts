import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiHealth {
  enabled: boolean;
  provider: string;
  model: string | null;
  status: string;
}

export interface AiProviderSettings {
  provider: string;
  model: string | null;
  baseUrl: string | null;
  username: string | null;
  apiKeyConfigured: boolean;
  temperature: number | null;
  maxTokens: number | null;
  timeoutMs: number | null;
  isActive: boolean;
}

export interface AiSettings {
  enabled: boolean;
  activeProvider: string;
  providers: AiProviderSettings[];
}

export interface AiSettingsRequest {
  provider: string;
  model?: string | null;
  baseUrl?: string | null;
  username?: string | null;
  apiKey?: string;
  temperature?: number | null;
  maxTokens?: number | null;
  timeoutMs?: number | null;
}

export interface AiTestResult {
  ok: boolean;
  provider: string;
  model: string | null;
  latencyMs: number;
  message: string;
}

export interface AiUsage {
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  estimatedCost: number;
}

export interface AiChatResponse {
  reply: string;
  usage: AiUsage;
}

export interface AiSuggestRequest {
  description: string;
  assetName?: string;
  notes?: string;
}

export interface AiSuggestResponse {
  title: string;
  description: string;
  priority: number;
  estimatedHours: number | null;
  checklist: string[];
}

export interface AiPrioritizeSuggestion {
  workOrderId: number;
  suggestedPriority: number;
  reason: string;
}

export interface AiPrioritizeResponse {
  suggestions: AiPrioritizeSuggestion[];
}

export interface AiSummarizeResponse {
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly base = '/api/ai';

  constructor(private readonly http: HttpClient) {}

  health(): Observable<AiHealth> {
    return this.http.get<AiHealth>(`${this.base}/health`);
  }

  getSettings(): Observable<AiSettings> {
    return this.http.get<AiSettings>(`${this.base}/settings`);
  }

  updateSettings(request: AiSettingsRequest): Observable<AiSettings> {
    return this.http.put<AiSettings>(`${this.base}/settings`, request);
  }

  updateEnabled(enabled: boolean): Observable<AiSettings> {
    return this.http.put<AiSettings>(`${this.base}/settings/enabled`, { enabled });
  }

  testConnection(provider: string): Observable<AiTestResult> {
    return this.http.post<AiTestResult>(`${this.base}/settings/${provider}/test`, {});
  }

  activate(provider: string): Observable<AiSettings> {
    return this.http.post<AiSettings>(`${this.base}/settings/${provider}/activate`, {});
  }

  chat(message: string): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.base}/assistant/chat`, { message });
  }

  suggest(request: AiSuggestRequest): Observable<AiSuggestResponse> {
    return this.http.post<AiSuggestResponse>(`${this.base}/workorders/suggest`, request);
  }

  prioritize(workOrderIds: number[] = []): Observable<AiPrioritizeResponse> {
    return this.http.post<AiPrioritizeResponse>(`${this.base}/workorders/prioritize`, { workOrderIds });
  }

  summarize(scope?: string, from?: string, to?: string): Observable<AiSummarizeResponse> {
    return this.http.post<AiSummarizeResponse>(`${this.base}/summarize`, { scope, from, to });
  }
}