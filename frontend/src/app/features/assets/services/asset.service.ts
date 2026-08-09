import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Asset {
  id?: number;
  name: string;
  type?: string;
  criticality?: string;
  status?: string;
  location?: string;
  serialNumber?: string;
  hoursOfUse?: number;
  purchaseDate?: string;
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly base = '/api/assets';

  constructor(private http: HttpClient) {}

  list(): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.base);
  }

  get(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.base}/${id}`);
  }

  create(asset: Asset): Observable<Asset> {
    return this.http.post<Asset>(this.base, asset);
  }

  update(id: number, asset: Asset): Observable<Asset> {
    return this.http.put<Asset>(`${this.base}/${id}`, asset);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
