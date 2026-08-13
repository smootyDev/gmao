import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventoryItem {
  id?: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  minimumStock?: number;
  currentStock?: number;
  locationId?: number | null;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryItemService {
  private readonly base = '/api/inventory-items';

  constructor(private http: HttpClient) {}

  list(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.base);
  }

  get(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.base}/${id}`);
  }

  create(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.base, item);
  }

  update(id: number, item: InventoryItem): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.base}/${id}`, item);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
