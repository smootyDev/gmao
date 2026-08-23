import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WorkorderFormComponent } from './workorder-form.component';
import { WorkorderService } from '../services/workorder.service';
import { AssetService } from '../../assets/services/asset.service';
import { UserService } from '../../users/services/user.service';
import { InventoryItemService, InventoryItem } from '../../inventory/services/inventory-item.service';
import { PreventivePlanService } from '../../preventive/services/preventive-plan.service';

describe('WorkorderFormComponent', () => {
  const inventoryItem: InventoryItem = { id: 1, name: 'Rodamiento 6204', unit: 'ud', code: 'ROD-1' } as InventoryItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkorderFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService(),
        { provide: WorkorderService, useValue: { get: () => of({}) } },
        { provide: AssetService, useValue: { list: () => of([]) } },
        { provide: UserService, useValue: { list: () => of([]) } },
        { provide: InventoryItemService, useValue: { list: () => of([inventoryItem]) } },
        { provide: PreventivePlanService, useValue: { list: () => of([]) } }
      ]
    }).compileComponents();
  });

  it('shows the quantity of added items in the items list', () => {
    const fixture = TestBed.createComponent(WorkorderFormComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.addItem();
    fixture.detectChanges();

    expect(component.itemRows().length).toBe(1);
    expect(component.itemRows()[0].quantity).toBe(1);
    const compiled = fixture.nativeElement as HTMLElement;
    const quantityInput = compiled.querySelector('input.modern-qty') as HTMLInputElement | null;
    expect(quantityInput).toBeTruthy();
    expect(quantityInput?.value).toBe('1');
  });
});