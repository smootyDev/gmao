import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LayoutService] });
    service = TestBed.inject(LayoutService);
  });

  it('should toggle the static menu on desktop in static mode', () => {
    service.layoutConfig.update((config) => ({ ...config, menuMode: 'static' }));

    expect(service.layoutState().staticMenuDesktopInactive).toBe(false);
    service.onMenuToggle();
    expect(service.layoutState().staticMenuDesktopInactive).toBe(true);
  });

  it('should toggle the overlay menu on desktop in overlay mode', () => {
    service.layoutConfig.update((config) => ({ ...config, menuMode: 'overlay' }));

    expect(service.layoutState().overlayMenuActive).toBe(false);
    service.onMenuToggle();
    expect(service.layoutState().overlayMenuActive).toBe(true);
    service.onMenuToggle();
    expect(service.layoutState().overlayMenuActive).toBe(false);
  });
});
