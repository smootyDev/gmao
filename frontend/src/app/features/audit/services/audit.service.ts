import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  timestamp: string;
  category: string;
  action: string;
  userId: number | null;
  username: string | null;
  role: string | null;
  entity: string | null;
  entityId: string | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  statusCode: number | null;
  requestBody: string | null;
  details: string | null;
  latencyMs: number | null;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditLogFilter {
  category?: string;
  entity?: string;
  action?: string;
  username?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private readonly http: HttpClient) {}

  listAuditLogs(filter: AuditLogFilter = {}): Observable<AuditLogPage> {
    let params = new HttpParams();
    if (filter.category) params = params.set('category', filter.category);
    if (filter.entity) params = params.set('entity', filter.entity);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.username) params = params.set('username', filter.username);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    params = params.set('page', String(filter.page ?? 0));
    params = params.set('size', String(filter.size ?? 50));
    return this.http.get<AuditLogPage>('/api/audit-logs', { params });
  }
}