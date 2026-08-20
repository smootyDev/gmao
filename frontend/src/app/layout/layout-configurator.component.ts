import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { LayoutService } from './layout.service';
import { getPrimaryColors, presets, surfaces, type SurfacesType } from './theme';

@Component({
  selector: 'app-layout-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectButtonModule, TranslatePipe],
  template: `
    <div class="flex flex-column gap-3">
      <div>
        <span class="text-sm text-muted-color font-semibold">{{ 'CONFIGURATOR.PRIMARY' | translate }}</span>
        <div class="pt-2 flex gap-2 flex-wrap justify-content-start">
          @for (primaryColor of primaryColors(); track primaryColor.name) {
            <button
              type="button"
              [title]="primaryColor.name"
              (click)="updateColors($event, 'primary', primaryColor)"
              [ngClass]="{ 'outline outline-primary': primaryColor.name === selectedPrimaryColor() }"
              class="configurator-color-swatch cursor-pointer border-circle flex align-items-center justify-content-center p-0 outline-offset-1 shadow-none border-none"
              [style]="{ 'background-color': primaryColor?.name === 'noir' ? 'var(--text-color)' : primaryColor?.palette?.['500'] }"
            ></button>
          }
        </div>
      </div>
      <div>
        <span class="text-sm text-muted-color font-semibold">{{ 'CONFIGURATOR.SURFACE' | translate }}</span>
        <div class="pt-2 flex gap-2 flex-wrap justify-content-start">
          @for (surface of surfaces; track surface.name) {
            <button
              type="button"
              [title]="surface.name"
              (click)="updateColors($event, 'surface', surface)"
              class="configurator-color-swatch cursor-pointer border-circle flex align-items-center justify-content-center p-0 outline-offset-1 shadow-none border-none"
              [ngClass]="{
                'outline outline-primary': selectedSurfaceColor()
                  ? selectedSurfaceColor() === surface.name
                  : layoutService.layoutConfig().darkTheme
                    ? surface.name === 'zinc'
                    : surface.name === 'slate'
              }"
              [style]="{ 'background-color': surface?.palette?.['500'] }"
            ></button>
          }
        </div>
      </div>
      <div class="flex flex-column gap-2">
        <span class="text-sm text-muted-color font-semibold">{{ 'CONFIGURATOR.PRESETS' | translate }}</span>
        <p-selectbutton [options]="presetNames" [ngModel]="selectedPreset()" (ngModelChange)="onPresetChange($event)" [allowEmpty]="false" size="small" />
      </div>
      <div *ngIf="showMenuModeButton()" class="flex flex-column gap-2">
        <span class="text-sm text-muted-color font-semibold">{{ 'CONFIGURATOR.MENU_MODE' | translate }}</span>
        <p-selectbutton [ngModel]="menuMode()" (ngModelChange)="onMenuModeChange($event)" [options]="menuModeOptions" [allowEmpty]="false" size="small" />
      </div>
    </div>
  `,
  host: {
    class: 'configurator-panel hidden absolute top-100 right-0 mt-2 w-18rem p-3 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top'
  }
})
export class LayoutConfiguratorComponent {
  readonly layoutService = inject(LayoutService);

  presetNames = Object.keys(presets);

  surfaces = surfaces;

  showMenuModeButton = signal(true);

  menuModeOptions = [
    { label: 'Static', value: 'static' },
    { label: 'Overlay', value: 'overlay' }
  ];

  selectedPrimaryColor = computed(() => this.layoutService.layoutConfig().primary);

  selectedSurfaceColor = computed(() => this.layoutService.layoutConfig().surface);

  selectedPreset = computed(() => this.layoutService.layoutConfig().preset);

  menuMode = computed(() => this.layoutService.layoutConfig().menuMode);

  primaryColors = computed<SurfacesType[]>(() => getPrimaryColors(this.layoutService.layoutConfig().preset));

  updateColors(event: Event, type: 'primary' | 'surface', color: SurfacesType) {
    if (type === 'primary') {
      this.layoutService.layoutConfig.update((state) => ({ ...state, primary: color.name! }));
    } else {
      this.layoutService.layoutConfig.update((state) => ({ ...state, surface: color.name! }));
    }
    event.stopPropagation();
  }

  onPresetChange(preset: string) {
    this.layoutService.layoutConfig.update((state) => ({ ...state, preset }));
  }

  onMenuModeChange(menuMode: string) {
    this.layoutService.layoutConfig.update((prev) => ({ ...prev, menuMode }));
  }
}
