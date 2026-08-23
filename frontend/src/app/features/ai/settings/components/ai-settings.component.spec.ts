import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AiSettingsComponent } from './ai-settings.component';
import { AiService, AiSettings } from '../../services/ai.service';

describe('AiSettingsComponent', () => {
  const settings: AiSettings = {
    enabled: true,
    activeProvider: 'opencode',
    providers: [
      {
        provider: 'opencode', model: 'deepseek-v4-flash', baseUrl: 'http://localhost:4096',
        username: 'opencode', apiKeyConfigured: true, temperature: 0.2, maxTokens: 1000,
        timeoutMs: 30000, isActive: true
      }
    ]
  };

  const createStub = (overrides: Record<string, unknown> = {}) => ({
    getSettings: vi.fn().mockReturnValue(of(settings)),
    updateSettings: vi.fn().mockReturnValue(of(settings)),
    updateEnabled: vi.fn().mockReturnValue(of(settings)),
    testConnection: vi.fn().mockReturnValue(of({ ok: true, provider: 'opencode', model: 'deepseek-v4-flash', latencyMs: 10, message: 'OK' })),
    activate: vi.fn().mockReturnValue(of(settings)),
    health: vi.fn().mockReturnValue(of({ enabled: true, provider: 'opencode', model: 'deepseek-v4-flash', status: 'ok' })),
    ...overrides
  });

  function setup(stub: unknown) {
    TestBed.configureTestingModule({
      imports: [AiSettingsComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AiService, useValue: stub }
      ]
    });
    return TestBed.createComponent(AiSettingsComponent);
  }

  it('should load settings and build all 7 providers', () => {
    const stub = createStub();
    const fixture = setup(stub);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.providers().length).toBe(7);
    expect(component.enabled()).toBe(true);
    expect(component.activeProvider()).toBe('opencode');
    const opencode = component.providers().find((p) => p.provider === 'opencode');
    expect(opencode?.model).toBe('deepseek-v4-flash');
    expect(opencode?.apiKeyConfigured).toBe(true);
    expect(stub.getSettings).toHaveBeenCalled();
  });

  it('should save a provider via updateSettings', () => {
    const stub = createStub();
    const fixture = setup(stub);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const mock = component.providers()[0];
    mock.model = 'deepseek-v4-flash';
    component.save(mock);
    expect(stub.updateSettings).toHaveBeenCalledWith(expect.objectContaining({ provider: 'mock' }));
  });

  it('should activate a provider', () => {
    const stub = createStub();
    const fixture = setup(stub);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const opencode = component.providers().find((p) => p.provider === 'opencode');
    component.activate(opencode!);
    expect(stub.activate).toHaveBeenCalledWith('opencode');
  });

  it('should toggle module enabled', () => {
    const stub = createStub();
    const fixture = setup(stub);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.onEnabledChange(false);
    expect(stub.updateEnabled).toHaveBeenCalledWith(false);
  });

  it('should switch between grid and list view', () => {
    const stub = createStub();
    const fixture = setup(stub);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.viewMode()).toBe('grid');

    component.setViewMode('list');
    fixture.detectChanges();

    expect(component.viewMode()).toBe('list');
    expect(fixture.nativeElement.querySelector('p-table')).toBeTruthy();

    component.setViewMode('grid');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p-table')).toBeNull();
  });
});