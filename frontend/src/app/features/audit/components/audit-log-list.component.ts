import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuditService, AuditLog } from '../services/audit.service';

interface CategoryOption {
  label: string;
  value: string | null;
}

const CATEGORIES: CategoryOption[] = [
  { label: 'CRUD', value: 'CRUD' },
  { label: 'AUTH', value: 'AUTH' },
  { label: 'AI', value: 'AI' },
  { label: 'CONFIG', value: 'CONFIG' },
  { label: 'BUSINESS', value: 'BUSINESS' }
];

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    TagModule,
    TranslatePipe
  ],
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.scss'
})
export class AuditLogListComponent implements OnInit, OnDestroy {
  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  totalPages = signal(0);
  rows = signal(50);
  first = signal(0);
  expandedRowKeys = signal<Record<string, boolean>>({});

  category = signal<string | null>(null);
  action = signal('');
  entity = signal('');
  username = signal('');
  dateRange = signal<Date[] | null>(null);

  categoryOptions = CATEGORIES;

  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly auditService: AuditService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  onFiltersChange(): void {
    this.first.set(0);
    this.load();
  }

  clearFilters(): void {
    this.category.set(null);
    this.action.set('');
    this.entity.set('');
    this.username.set('');
    this.dateRange.set(null);
    this.first.set(0);
    this.load();
  }

  onPage(event: { first: number; rows: number }): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.load();
  }

  onRowExpand(event: { data: AuditLog }): void {
    this.setExpanded(event.data.id, true);
  }

  onRowCollapse(event: { data: AuditLog }): void {
    this.setExpanded(event.data.id, false);
  }

  private setExpanded(id: number, expanded: boolean): void {
    this.expandedRowKeys.update((keys) => ({ ...keys, [String(id)]: expanded }));
  }

  formatTimestamp(value: string): string {
    return new Date(value).toLocaleString();
  }

  statusLabel(code: number | null): string {
    return code == null ? '-' : String(code);
  }

  categorySeverity(category: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (category) {
      case 'CRUD': return 'info';
      case 'AUTH': return 'warn';
      case 'AI': return 'contrast';
      case 'CONFIG': return 'secondary';
      case 'BUSINESS': return 'success';
      default: return 'secondary';
    }
  }

  load(): void {
    this.loading.set(true);
    const range = this.dateRange();
    const from = range?.[0] ? range[0].toISOString() : undefined;
    const to = range?.[1] ? range[1].toISOString() : undefined;
    const subscription = this.auditService.listAuditLogs({
      category: this.category() ?? undefined,
      entity: this.entity().trim() || undefined,
      action: this.action().trim() || undefined,
      username: this.username().trim() || undefined,
      from,
      to,
      page: this.first() / this.rows(),
      size: this.rows()
    }).subscribe({
      next: (page) => {
        this.logs.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.subscriptions.push(subscription);
  }
}