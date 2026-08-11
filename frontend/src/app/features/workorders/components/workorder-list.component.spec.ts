import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WorkorderListComponent } from './workorder-list.component';
import { WorkorderService } from '../services/workorder.service';
import { AssetService } from '../../assets/services/asset.service';
import { UserService } from '../../users/services/user.service';
import { Asset } from '../../assets/services/asset.service';
import { User } from '../../users/services/user.service';

describe('WorkorderListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkorderListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: WorkorderService, useValue: { list: () => of([]) } },
        { provide: AssetService, useValue: { list: () => of([]) } },
        { provide: UserService, useValue: { list: () => of([]) } }
      ]
    }).compileComponents();
  });

  it('should render the table with per-column filters', () => {
    const fixture = TestBed.createComponent(WorkorderListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-table')).toBeTruthy();
    expect(compiled.querySelectorAll('app-dropdown-column-filter').length).toBe(4);
    expect(compiled.querySelectorAll('p-columnfilter').length).toBeGreaterThanOrEqual(4);
  });

  it('should build dropdown options from loaded assets and users', () => {
    const fixture = TestBed.createComponent(WorkorderListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.assets.set([{ id: 5, name: 'Bomba', serialNumber: 'BP-1' } as Asset]);
    component.users.set([{ id: 3, employeeCode: 'EMP-3', firstName: 'Técnico', lastName: '' } as User]);
    expect(component.assetFilterOptions().length).toBe(1);
    expect(component.assetFilterOptions()[0].label).toBe('BP-1 - Bomba');
    expect(component.userFilterOptions()[0].label).toBe('EMP-3 - Técnico ');
  });
});
