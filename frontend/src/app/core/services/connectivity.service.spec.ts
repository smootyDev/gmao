import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConnectivityService] });
    service = TestBed.inject(ConnectivityService);
  });

  it('should expose the initial online state', () => {
    expect(typeof service.online()).toBe('boolean');
  });

  it('should mark offline and online', () => {
    service.markOffline();
    expect(service.online()).toBe(false);
    expect(service.verified()).toBe(false);
    service.markOnline();
    expect(service.online()).toBe(true);
    expect(service.verified()).toBe(true);
  });
});
