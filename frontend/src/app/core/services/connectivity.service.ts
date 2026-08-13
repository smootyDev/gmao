import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly onlineSignal = signal<boolean>(this.initialOnline());
  private readonly verifiedSignal = signal<boolean>(false);
  readonly online = this.onlineSignal.asReadonly();
  readonly verified = this.verifiedSignal.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onlineSignal.set(true));
      window.addEventListener('offline', () => this.onlineSignal.set(false));
    }
  }

  private initialOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  markOnline(): void {
    this.onlineSignal.set(true);
    this.verifiedSignal.set(true);
  }

  markOffline(): void {
    this.onlineSignal.set(false);
    this.verifiedSignal.set(false);
  }
}
