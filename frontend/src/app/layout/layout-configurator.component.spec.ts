import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LayoutConfiguratorComponent } from './layout-configurator.component';
import { LayoutService } from './layout.service';

describe('LayoutConfiguratorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutConfiguratorComponent],
      providers: [provideTranslateService()]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LayoutConfiguratorComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render primary color buttons', () => {
    const fixture = TestBed.createComponent(LayoutConfiguratorComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(5);
  });

  it('should update primary color on click', () => {
    const layoutService = TestBed.inject(LayoutService);
    const fixture = TestBed.createComponent(LayoutConfiguratorComponent);
    fixture.detectChanges();

    const emeraldButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.title === 'emerald');

    expect(emeraldButton).toBeTruthy();
    emeraldButton!.click();
    fixture.detectChanges();

    expect(layoutService.layoutConfig().primary).toBe('emerald');
    const styleVar = getComputedStyle(document.documentElement).getPropertyValue('--p-primary-color');
    expect(styleVar).toBeTruthy();
  });

  it('should update surface color on click', () => {
    const layoutService = TestBed.inject(LayoutService);
    const fixture = TestBed.createComponent(LayoutConfiguratorComponent);
    fixture.detectChanges();

    const surfaceButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.title === 'zinc');

    expect(surfaceButton).toBeTruthy();
    surfaceButton!.click();
    fixture.detectChanges();

    expect(layoutService.layoutConfig().surface).toBe('zinc');
  });

  it('should change preset on selectbutton', () => {
    const layoutService = TestBed.inject(LayoutService);
    const fixture = TestBed.createComponent(LayoutConfiguratorComponent);
    fixture.detectChanges();

    fixture.componentInstance.onPresetChange('Lara');

    expect(layoutService.layoutConfig().preset).toBe('Lara');
  });
});
