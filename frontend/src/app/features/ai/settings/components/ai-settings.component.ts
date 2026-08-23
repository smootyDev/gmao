import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { AiService, AiHealth, AiSettings, AiProviderSettings } from '../../services/ai.service';
import { AiStateService } from '../../services/ai-state.service';

interface AiPreset {
  provider: string;
  baseUrl: string;
  model: string;
  username: string;
}

const AI_PRESETS: Record<string, AiPreset> = {
  mock: { provider: 'mock', baseUrl: '', model: '', username: '' },
  openai: { provider: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', username: '' },
  azure: { provider: 'azure', baseUrl: 'https://<recurso>.openai.azure.com/openai/deployments/<despliegue>', model: 'gpt-4o-mini', username: '' },
  ollama: { provider: 'ollama', baseUrl: 'http://localhost:11434', model: 'llama3.1', username: '' },
  anthropic: { provider: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages', model: 'claude-haiku-4-5-20251001', username: '' },
  google: { provider: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', username: '' },
  opencode: { provider: 'opencode', baseUrl: 'http://localhost:4096', model: '', username: 'opencode' }
};

interface ProviderForm {
  provider: string;
  model: string | null;
  baseUrl: string | null;
  username: string | null;
  apiKey: string;
  apiKeyConfigured: boolean;
  temperature: number | null;
  maxTokens: number | null;
  timeoutMs: number | null;
  isActive: boolean;
  saving: boolean;
  testing: boolean;
}

@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToggleSwitchModule,
    SelectButtonModule,
    TableModule,
    ToastModule,
    TagModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './ai-settings.component.html',
  styleUrl: './ai-settings.component.scss'
})
export class AiSettingsComponent implements OnInit {
  private static readonly VIEW_STORAGE_KEY = 'gmao.ai.settings.view';

  loading = signal(true);
  enabled = signal(true);
  activeProvider = signal('');
  providers = signal<ProviderForm[]>([]);
  health = signal<AiHealth | null>(null);
  viewMode = signal<'grid' | 'list'>(this.initialViewMode());

  viewOptions = [
    { label: 'grid', icon: 'pi pi-th-large', value: 'grid' },
    { label: 'list', icon: 'pi pi-bars', value: 'list' }
  ];

  constructor(
    private readonly aiService: AiService,
    private readonly aiState: AiStateService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.refreshHealth();
    this.load();
  }

  private refreshHealth(): void {
    this.aiState.refresh();
    this.aiService.health().subscribe({
      next: (health) => this.health.set(health),
      error: () => undefined
    });
  }

  onEnabledChange(value: boolean): void {
    this.enabled.set(value);
    this.aiService.updateEnabled(value).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.refreshHealth();
      },
      error: () => {
        this.enabled.set(!value);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
      }
    });
  }

  save(provider: ProviderForm): void {
    provider.saving = true;
    this.aiService.updateSettings({
      provider: provider.provider,
      model: provider.model || null,
      baseUrl: provider.baseUrl || null,
      username: provider.username || null,
      apiKey: provider.apiKey || undefined,
      temperature: provider.temperature,
      maxTokens: provider.maxTokens,
      timeoutMs: provider.timeoutMs
    }).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.refreshHealth();
        provider.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Configuración guardada' });
      },
      error: (error) => {
        provider.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: (error as { error?: { message?: string } })?.error?.message ?? 'No se pudo guardar'
        });
      }
    });
  }

  test(provider: ProviderForm): void {
    provider.testing = true;
    this.aiService.testConnection(provider.provider).subscribe({
      next: (result) => {
        provider.testing = false;
        this.messageService.add({
          severity: result.ok ? 'success' : 'warn',
          summary: result.ok ? 'OK' : 'Error',
          detail: `${result.message} (${result.latencyMs} ms)`
        });
      },
      error: (error) => {
        provider.testing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: (error as { error?: { message?: string } })?.error?.message ?? 'No se pudo probar la conexión'
        });
      }
    });
  }

  activate(provider: ProviderForm): void {
    this.aiService.activate(provider.provider).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.refreshHealth();
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Proveedor activo: ' + provider.provider });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: (error as { error?: { message?: string } })?.error?.message ?? 'No se pudo activar el proveedor'
        });
      }
    });
  }

  isActive(provider: string): boolean {
    return this.activeProvider() === provider;
  }

  setViewMode(value: 'grid' | 'list'): void {
    this.viewMode.set(value);
    try {
      localStorage.setItem(AiSettingsComponent.VIEW_STORAGE_KEY, value);
    } catch {
      // almacenamiento no disponible, se ignora
    }
  }

  private initialViewMode(): 'grid' | 'list' {
    try {
      const saved = localStorage.getItem(AiSettingsComponent.VIEW_STORAGE_KEY);
      return saved === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  }

  private load(): void {
    this.aiService.getSettings().subscribe({
      next: (settings) => this.applySettings(settings),
      error: () => this.loading.set(false)
    });
  }

  private applySettings(settings: AiSettings): void {
    this.enabled.set(settings.enabled);
    this.activeProvider.set(settings.activeProvider);
    this.providers.set(this.buildProviders(settings.providers));
    this.loading.set(false);
  }

  private buildProviders(saved: AiProviderSettings[]): ProviderForm[] {
    return (Object.keys(AI_PRESETS) as string[]).map((key) => {
      const preset = AI_PRESETS[key];
      const existing = saved.find((s) => s.provider === key);
      return {
        provider: key,
        model: (existing?.model ?? preset.model) || null,
        baseUrl: (existing?.baseUrl ?? preset.baseUrl) || null,
        username: (existing?.username ?? preset.username) || null,
        apiKey: '',
        apiKeyConfigured: existing?.apiKeyConfigured ?? false,
        temperature: existing?.temperature ?? 0.2,
        maxTokens: existing?.maxTokens ?? 1000,
        timeoutMs: existing?.timeoutMs ?? 30000,
        isActive: existing?.isActive ?? false,
        saving: false,
        testing: false
      };
    });
  }
}