import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService } from '../services/user.service';
import { SyncService } from '../../../core/services/sync.service';

describe('UserListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: UserService, useValue: { list: () => of([]) } },
        { provide: SyncService, useValue: { syncCompleted: { subscribe: () => ({ unsubscribe: () => {} }) } } }
      ]
    }).compileComponents();
  });

  it('should render the table with role dropdown filter and boolean tri-state filter', () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-table')).toBeTruthy();
    expect(compiled.querySelectorAll('app-dropdown-column-filter').length).toBe(1);
    expect(compiled.querySelectorAll('p-columnfilter').length).toBe(9);
  });

  it('should expose the role options for the equals filter', () => {
    const fixture = TestBed.createComponent(UserListComponent);
    expect(fixture.componentInstance.roleOptions.map((option) => option.value)).toEqual(['ADMIN', 'MANAGER', 'TECH']);
  });
});
