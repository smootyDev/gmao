import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Location {
  id?: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number | null;
  active?: boolean;
  systemRoot?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly base = '/api/locations';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Location[]> {
    return this.http.get<Location[]>(this.base);
  }

  get(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.base}/${id}`);
  }

  create(location: Location): Observable<Location> {
    return this.http.post<Location>(this.base, location);
  }

  update(id: number, location: Location): Observable<Location> {
    return this.http.put<Location>(`${this.base}/${id}`, location);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
