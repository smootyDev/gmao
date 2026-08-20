import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssetType {
  id?: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssetTypeService {
  private readonly base = '/api/asset-types';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<AssetType[]> {
    return this.http.get<AssetType[]>(this.base);
  }

  get(id: number): Observable<AssetType> {
    return this.http.get<AssetType>(`${this.base}/${id}`);
  }

  create(assetType: AssetType): Observable<AssetType> {
    return this.http.post<AssetType>(this.base, assetType);
  }

  update(id: number, assetType: AssetType): Observable<AssetType> {
    return this.http.put<AssetType>(`${this.base}/${id}`, assetType);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
