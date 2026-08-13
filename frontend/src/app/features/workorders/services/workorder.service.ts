import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkOrderItem {
  id?: number;
  workOrderId?: number;
  inventoryItemId: number;
  quantity: number;
}

export interface WorkOrder {
  id?: number;
  title: string;
  description?: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'CLOSED';
  priority: number;
  createdAt?: string;
  updatedAt?: string;
  assetId?: number | null;
  assignedTo?: number | null;
  estimatedHours?: number;
  preventivePlanId?: number;
  items?: WorkOrderItem[];
}

@Injectable({ providedIn: 'root' })
export class WorkorderService {
  private readonly base = '/api/workorders';

  constructor(private http: HttpClient) {}

  list(status?: string, assignedTo?: number): Observable<WorkOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (assignedTo) params = params.set('assignedTo', assignedTo.toString());
    return this.http.get<WorkOrder[]>(this.base, { params });
  }

  get(id: number): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.base}/${id}`);
  }

  create(workOrder: WorkOrder): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.base, workOrder);
  }

  update(id: number, workOrder: WorkOrder): Observable<WorkOrder> {
    return this.http.put<WorkOrder>(`${this.base}/${id}`, workOrder);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listByInventoryItem(itemId: number): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.base}/by-inventory-item/${itemId}`);
  }
}
