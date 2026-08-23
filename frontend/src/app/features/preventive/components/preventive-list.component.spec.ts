import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { PreventiveListComponent } from './preventive-list.component';
import { PreventivePlanService } from '../services/preventive-plan.service';
import { AssetService } from '../../assets/services/asset.service';
import { SyncService } from '../../../core/services/sync.service';

describe('PreventiveListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreventiveListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService(),
        { provide: PreventivePlanService, useValue: { list: () => of([]) } },
        { provide: AssetService, useValue: { list: () => of([]) } },
        { provide: SyncService, useValue: { syncCompleted: { subscribe: () => ({ unsubscribe: () => {} }) } } }
      ]
    }).compileComponents();
  });

  it('should render the preventive table', () => {
    const fixture = TestBed.createComponent(PreventiveListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-table')).toBeTruthy();
  });

  it('should flag overdue plans as danger', () => {
    const fixture = TestBed.createComponent(PreventiveListComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const past = new Date(Date.now() - 86_400_000 * 3).toISOString().split('T')[0];
    const near = new Date(Date.now() + 86_400_000 * 3).toISOString().split('T')[0];
    const far = new Date(Date.now() + 86_400_000 * 30).toISOString().split('T')[0];
    expect(component.dueSeverity({ name: 'A', assetId: 1, frequencyDays: 30, nextDueDate: past })).toBe('danger');
    expect(component.dueSeverity({ name: 'B', assetId: 1, frequencyDays: 30, nextDueDate: near })).toBe('warn');
    expect(component.dueSeverity({ name: 'C', assetId: 1, frequencyDays: 30, nextDueDate: far })).toBe('success');
  });
});
