import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly onlineSignal = signal<boolean>(this.initialOnline());
  readonly online = this.onlineSignal.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.markOnline());
      window.addEventListener('offline', () => this.markOffline());
    }
  }

  private initialOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  markOnline(): void {
    this.onlineSignal.set(true);
  }

  markOffline(): void {
    this.onlineSignal.set(false);
  }
}