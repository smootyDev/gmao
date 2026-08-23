import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuditLogListComponent } from './audit-log-list.component';
import { AuditService, AuditLog } from '../services/audit.service';

describe('AuditLogListComponent', () => {
  const page = {
    content: [
      { id: 1, timestamp: '2026-08-20T10:00:00Z', category: 'AI', action: 'CHAT', method: 'POST', path: '/api/ai/assistant/chat', username: 'admin', role: 'ADMIN', entity: 'ai', statusCode: 200, details: 'provider=mock', requestBody: null, latencyMs: 5, ip: '127.0.0.1', userId: 1, entityId: null } as AuditLog
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 50
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuditService, useValue: { listAuditLogs: () => of(page) } }
      ]
    }).compileComponents();
  });

  it('should render the audit table with logs', () => {
    const fixture = TestBed.createComponent(AuditLogListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-table')).toBeTruthy();
    expect(compiled.textContent).toContain('CHAT');
  });

  it('should expand and collapse a row when clicking the toggle button', async () => {
    const fixture = TestBed.createComponent(AuditLogListComponent);
    fixture.detectChanges();
    const getButton = () => fixture.nativeElement.querySelector('[aria-label="Expand"]') as HTMLElement;
    const component = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    getButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.expandedRowKeys()['1']).toBe(true);
    expect(compiled.textContent).toContain('provider=mock');

    getButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.expandedRowKeys()['1']).toBeFalsy();
    expect(compiled.textContent).not.toContain('provider=mock');
  });

  it('should send filters to the service on change', () => {
    const listAuditLogs = vi.fn().mockReturnValue(of(page));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuditLogListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuditService, useValue: { listAuditLogs } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditLogListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.category.set('AI');
    component.onFiltersChange();
    expect(listAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ category: 'AI', page: 0 }));
  });
});