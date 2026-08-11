import { Injectable, computed, effect, signal } from '@angular/core';

export interface LayoutConfig {
  preset: string;
  primary: string;
  surface: string | undefined | null;
  darkTheme: boolean;
  menuMode: string;
}

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
  private readonly themeKey = 'gmao_theme';

  layoutConfig = signal<LayoutConfig>(this.loadConfig());
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
      const { darkTheme } = this.layoutConfig();
      localStorage.setItem(this.themeKey, darkTheme ? 'dark' : 'light');
      this.toggleDarkMode();
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

  private loadConfig(): LayoutConfig {
    let darkTheme = false;
    const theme = typeof localStorage !== 'undefined' ? localStorage.getItem(this.themeKey) : null;
    if (theme === 'dark') {
      darkTheme = true;
    }
    return {
      preset: 'Aura',
      primary: 'blue',
      surface: null,
      darkTheme,
      menuMode: 'static'
    };
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
