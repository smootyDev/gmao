import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LayoutMenuitemComponent } from './layout-menuitem.component';
import { LayoutService } from './layout.service';

describe('LayoutMenuitemComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutMenuitemComponent],
      providers: [provideRouter([]), provideTranslateService(), LayoutService]
    }).compileComponents();
  });

  it('should match routes with subset path semantics', () => {
    const fixture = TestBed.createComponent(LayoutMenuitemComponent);
    fixture.componentRef.setInput('item', { path: '/workorders', routerLink: ['/workorders'] });
    fixture.detectChanges();

    expect(fixture.componentInstance.routeMatchOptions.paths).toBe('subset');
  });

  it('should keep the parent menu item active on a child route', () => {
    const layoutService = TestBed.inject(LayoutService);
    const fixture = TestBed.createComponent(LayoutMenuitemComponent);
    fixture.componentRef.setInput('item', { path: '/workorders', routerLink: ['/workorders'] });
    fixture.detectChanges();

    const parentPath = '/workorders';
    layoutService.layoutState.update((state) => ({ ...state, activePath: parentPath }));

    expect(fixture.componentInstance.isActive()).toBe(true);
  });

  it('should not mark the menu item active for an unrelated route', () => {
    const layoutService = TestBed.inject(LayoutService);
    const fixture = TestBed.createComponent(LayoutMenuitemComponent);
    fixture.componentRef.setInput('item', { path: '/workorders', routerLink: ['/workorders'] });
    fixture.detectChanges();

    layoutService.layoutState.update((state) => ({ ...state, activePath: '/assets' }));

    expect(fixture.componentInstance.isActive()).toBe(false);
  });
});
