import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkOrder } from '../../workorders/services/workorder.service';

export interface PreventivePlan {
  id?: number;
  name: string;
  description?: string;
  assetId: number | null;
  frequencyDays: number;
  lastRunAt?: string | null;
  nextDueDate?: string | null;
  active?: boolean;
  workOrderCount?: number;
}

@Injectable({ providedIn: 'root' })
export class PreventivePlanService {
  private readonly base = '/api/preventive-plans';

  constructor(private http: HttpClient) {}

  list(): Observable<PreventivePlan[]> {
    return this.http.get<PreventivePlan[]>(this.base);
  }

  get(id: number): Observable<PreventivePlan> {
    return this.http.get<PreventivePlan>(`${this.base}/${id}`);
  }

  create(plan: PreventivePlan): Observable<PreventivePlan> {
    return this.http.post<PreventivePlan>(this.base, plan);
  }

  update(id: number, plan: PreventivePlan): Observable<PreventivePlan> {
    return this.http.put<PreventivePlan>(`${this.base}/${id}`, plan);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  run(id: number): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.base}/${id}/run`, {});
  }
}
