import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  employeeCode: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'TECH';
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = '/api/users';
  constructor(private readonly http: HttpClient) {}
  list(): Observable<User[]> { return this.http.get<User[]>(this.base); }
  get(id: number): Observable<User> { return this.http.get<User>(`${this.base}/${id}`); }
  create(user: User): Observable<User> { return this.http.post<User>(this.base, user); }
  update(id: number, user: User): Observable<User> { return this.http.put<User>(`${this.base}/${id}`, user); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
