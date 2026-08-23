import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryItemService } from '../services/inventory-item.service';
import { LocationService } from '../../locations/services/location.service';
import { WorkorderService } from '../../workorders/services/workorder.service';
import { SyncService } from '../../../core/services/sync.service';

describe('InventoryListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService(),
        { provide: InventoryItemService, useValue: { list: () => of([]) } },
        { provide: LocationService, useValue: { list: () => of([]) } },
        { provide: WorkorderService, useValue: { list: () => of([]) } },
        { provide: SyncService, useValue: { syncCompleted: { subscribe: () => ({ unsubscribe: () => {} }) } } }
      ]
    }).compileComponents();
  });

  it('should render the inventory table', () => {
    const fixture = TestBed.createComponent(InventoryListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-table')).toBeTruthy();
  });

  it('should flag items whose current stock is below minimum', () => {
    const fixture = TestBed.createComponent(InventoryListComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isLowStock({ code: 'A', name: 'A', currentStock: 2, minimumStock: 5 })).toBe(true);
    expect(component.isLowStock({ code: 'B', name: 'B', currentStock: 10, minimumStock: 5 })).toBe(false);
  });
});
