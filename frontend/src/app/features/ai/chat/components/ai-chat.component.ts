import { Component, OnInit, signal, computed, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { AiService, AiHealth, AiUsage, AiPrioritizeSuggestion, AiSuggestResponse } from '../../services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  usage?: AiUsage;
  meta?: 'chat' | 'suggest' | 'prioritize' | 'summary';
  data?: AiSuggestResponse | AiPrioritizeSuggestion[];
  createdAt: number;
}

const PRIORITY_KEY = (p: number): string => `AI.PRIORITY_${p}`;

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    TagModule,
    ScrollPanelModule,
    TranslatePipe
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  @Input() embedded = false;
  @Output() createWorkOrder = new EventEmitter<void>();

  messages = signal<ChatMessage[]>([]);
  inputText = signal('');
  loading = signal(false);
  health = signal<AiHealth | null>(null);

  suggestVisible = signal(false);
  suggestForm: FormGroup;

  @ViewChild('scrollFrame') private scrollFrame!: ElementRef<HTMLElement>;

  readonly showWelcome = computed(() => this.messages().length === 0);

  chatHeight = computed(() => (this.embedded ? 'min(62vh, 560px)' : 'calc(100vh - 16rem)'));

  constructor(
    private readonly fb: FormBuilder,
    private readonly aiService: AiService,
    private readonly router: Router
  ) {
    this.suggestForm = this.fb.group({
      description: ['', Validators.required],
      assetName: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.refreshHealth();
  }

  refreshHealth(): void {
    this.aiService.health().subscribe({
      next: (health) => this.health.set(health),
      error: () => this.health.set(null)
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  send(): void {
    const text = this.inputText().trim();
    if (text === '' || this.loading()) {
      return;
    }
    this.inputText.set('');
    this.pushUser(text);
    this.loading.set(true);
    this.aiService.chat(text).subscribe({
      next: (response) => {
        this.pushAssistant(response.reply, response.usage, 'chat');
        this.loading.set(false);
      },
      error: (error) => {
        this.pushSystem(this.errorText(error));
        this.loading.set(false);
      }
    });
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }
    keyboardEvent.preventDefault();
    this.send();
  }

  openSuggest(): void {
    this.suggestForm.reset();
    this.suggestVisible.set(true);
  }

  submitSuggest(): void {
    if (this.suggestForm.invalid) {
      this.suggestForm.markAllAsTouched();
      return;
    }
    const raw = this.suggestForm.getRawValue();
    this.suggestVisible.set(false);
    this.loading.set(true);
    this.aiService.suggest({
      description: raw.description,
      assetName: raw.assetName || undefined,
      notes: raw.notes || undefined
    }).subscribe({
      next: (suggestion) => {
        this.pushUser(raw.description);
        this.pushAssistant('', undefined, 'suggest', suggestion);
        this.loading.set(false);
      },
      error: (error) => {
        this.pushSystem(this.errorText(error));
        this.loading.set(false);
      }
    });
  }

  runPrioritize(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.pushUser('(priorizar OTs abiertas)');
    this.aiService.prioritize().subscribe({
      next: (response) => {
        this.pushAssistant('', undefined, 'prioritize', response.suggestions);
        this.loading.set(false);
      },
      error: (error) => {
        this.pushSystem(this.errorText(error));
        this.loading.set(false);
      }
    });
  }

  runSummarize(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.pushUser('(resumen de actividad)');
    this.aiService.summarize('semanal').subscribe({
      next: (response) => {
        this.pushAssistant(response.summary, undefined, 'summary');
        this.loading.set(false);
      },
      error: (error) => {
        this.pushSystem(this.errorText(error));
        this.loading.set(false);
      }
    });
  }

  createWorkOrderFromSuggestion(): void {
    this.router.navigate(['/workorders/new']);
    if (this.embedded) {
      this.createWorkOrder.emit();
    }
  }

  priorityLabel(p: number): string {
    return PRIORITY_KEY(p);
  }

  prioritySeverity(p: number): 'danger' | 'warn' | 'info' | 'secondary' {
    switch (p) {
      case 1: return 'danger';
      case 2: return 'warn';
      case 3: return 'info';
      default: return 'secondary';
    }
  }

  isSuggestData(data?: AiSuggestResponse | AiPrioritizeSuggestion[]): data is AiSuggestResponse {
    return !!data && typeof (data as AiSuggestResponse).title === 'string';
  }

  private pushUser(text: string): void {
    this.messages.update((items) => [...items, { role: 'user', text, createdAt: Date.now() }]);
  }

  private pushAssistant(text: string, usage: AiUsage | undefined, meta: ChatMessage['meta'], data?: ChatMessage['data']): void {
    this.messages.update((items) => [...items, { role: 'assistant', text, usage, meta, data, createdAt: Date.now() }]);
  }

  private pushSystem(text: string): void {
    this.messages.update((items) => [...items, { role: 'system', text, createdAt: Date.now() }]);
  }

  private errorText(error: unknown): string {
    const body = (error as { error?: { message?: string; detail?: string } })?.error;
    const message = body?.message || body?.detail || 'No se pudo procesar la solicitud';
    return message;
  }

  private scrollToBottom(): void {
    if (this.scrollFrame?.nativeElement) {
      const el = this.scrollFrame.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}