import { Injectable, computed, effect, signal } from '@angular/core';
import { $t } from '@primeuix/themes';
import { buildThemePreset, loadPersistedLayoutConfig, THEME_STORAGE_KEY, type LayoutConfig } from './theme';

export type { LayoutConfig };

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  configSidebarVisible: boolean;
  mobileMenuActive: boolean;
  menuHoverActive: boolean;
  activePath: string | null;
}

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly layoutKey = 'gmao_sidebar';

  layoutConfig = signal<LayoutConfig>(loadPersistedLayoutConfig());
  layoutState = signal<LayoutState>(this.loadState());

  theme = computed(() => (this.layoutConfig().darkTheme ? 'dark' : 'light'));

  isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

  isDarkTheme = computed(() => this.layoutConfig().darkTheme);

  getSurface = computed(() => this.layoutConfig().surface);

  isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

  transitionComplete = signal<boolean>(false);

  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => undefined);
    }

    effect(() => {
      const config = this.layoutConfig();
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
      this.toggleDarkMode();
      if (typeof document !== 'undefined') {
        $t().preset(buildThemePreset(config)).use({ useDefaultOptions: true });
      }
    });

    effect(() => {
      const { staticMenuDesktopInactive } = this.layoutState();
      localStorage.setItem(this.layoutKey, JSON.stringify({ staticMenuDesktopInactive }));
    });
  }

  toggleDarkMode(): void {
    const { darkTheme } = this.layoutConfig();
    if (darkTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  onMenuToggle(): void {
    if (this.isDesktop()) {
      if (this.isOverlay()) {
        this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
      } else {
        this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !prev.staticMenuDesktopInactive }));
      }
    } else {
      this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !prev.mobileMenuActive }));
    }
  }

  showConfigSidebar(): void {
    this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
  }

  hideConfigSidebar(): void {
    this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
  }

  hideMenu(): void {
    this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: false, overlayMenuActive: false }));
  }

  isDesktop(): boolean {
    return window.innerWidth > 991;
  }

  isMobile(): boolean {
    return !this.isDesktop();
  }

  private loadState(): LayoutState {
    try {
      const raw = localStorage.getItem(this.layoutKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          staticMenuDesktopInactive: parsed.staticMenuDesktopInactive === true,
          overlayMenuActive: false,
          configSidebarVisible: false,
          mobileMenuActive: false,
          menuHoverActive: false,
          activePath: null
        };
      }
    } catch {
      /* estado almacenado inválido: se ignora */
    }
    return {
      staticMenuDesktopInactive: false,
      overlayMenuActive: false,
      configSidebarVisible: false,
      mobileMenuActive: false,
      menuHoverActive: false,
      activePath: null
    };
  }
}
