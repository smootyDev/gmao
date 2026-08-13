import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SyncService } from '../../../core/services/sync.service';
import { PreventivePlan, PreventivePlanService } from '../services/preventive-plan.service';
import { Asset, AssetService } from '../../assets/services/asset.service';

type DueSeverity = 'danger' | 'warn' | 'success' | 'secondary';

@Component({
  selector: 'app-preventive-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, InputTextModule, TranslatePipe],
  templateUrl: './preventive-list.component.html',
  styleUrl: './preventive-list.component.scss'
})
export class PreventiveListComponent implements OnInit, OnDestroy {
  plans = signal<PreventivePlan[]>([]);
  assets = signal<Asset[]>([]);
  loading = signal(true);
  generating = signal(false);

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly preventivePlanService: PreventivePlanService,
    private readonly assetService: AssetService,
    private readonly syncService: SyncService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscriptions.push(
      this.syncService.syncCompleted.subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      plans: this.preventivePlanService.list(),
      assets: this.assetService.list()
    }).subscribe({
      next: ({ plans, assets }) => {
        this.plans.set(plans);
        this.assets.set(assets);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  assetName(id?: number | null): string {
    const asset = this.assets().find((candidate) => candidate.id === id);
    return asset ? `${asset.serialNumber || asset.id} - ${asset.name}` : '-';
  }

  dueSeverity(plan: PreventivePlan): DueSeverity {
    if (!plan.nextDueDate) {
      return 'secondary';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${plan.nextDueDate}T00:00:00`);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
    if (diffDays <= 0) {
      return 'danger';
    }
    if (diffDays <= 7) {
      return 'warn';
    }
    return 'success';
  }

  dueLabel(plan: PreventivePlan): string {
    if (!plan.nextDueDate) {
      return '-';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${plan.nextDueDate}T00:00:00`);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
    return `${plan.nextDueDate} (${diffDays <= 0 ? '0' : diffDays}d)`;
  }

  generate(plan: PreventivePlan): void {
    if (plan.id === undefined) {
      return;
    }
    this.generating.set(true);
    this.preventivePlanService.run(plan.id).subscribe({
      next: () => {
        this.generating.set(false);
        this.loadData();
      },
      error: () => {
        this.generating.set(false);
      }
    });
  }

  delete(id: number): void {
    if (confirm('¿Eliminar este plan preventivo?')) {
      this.preventivePlanService.delete(id).subscribe(() => this.loadData());
    }
  }
}
