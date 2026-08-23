import { Injectable, inject, signal } from '@angular/core';
import { AiService, AiHealth } from './ai.service';

@Injectable({ providedIn: 'root' })
export class AiStateService {
  readonly health = signal<AiHealth | null>(null);
  readonly enabled = signal(true);

  private readonly aiService = inject(AiService);

  refresh(): void {
    this.aiService.health().subscribe({
      next: (health) => {
        this.health.set(health);
        this.enabled.set(health.enabled);
      },
      error: () => undefined
    });
  }
}