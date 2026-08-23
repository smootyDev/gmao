import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AiChatComponent } from './ai-chat.component';
import { AiService } from '../../services/ai.service';

const healthyService = {
  health: () => of({ enabled: true, provider: 'mock', model: null, status: 'ok' }),
  chat: () => of({ reply: 'Respuesta', usage: { tokensIn: 2, tokensOut: 4, latencyMs: 5, estimatedCost: 0 } }),
  suggest: () => of({ title: 'OT', description: 'Desc', priority: 3, estimatedHours: 2, checklist: [] }),
  prioritize: () => of({ suggestions: [] }),
  summarize: () => of({ summary: 'Resumen' })
};

function configure(service: unknown) {
  return TestBed.configureTestingModule({
    imports: [AiChatComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: AiService, useValue: service }
    ]
  }).compileComponents();
}

describe('AiChatComponent', () => {
  beforeEach(async () => {
    await configure(healthyService);
  });

  it('should render the chat header and welcome message', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.querySelector('textarea')).toBeTruthy();
  });

  it('should append a user and an assistant message when sending', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.inputText.set('Hola');
    component.send();
    fixture.detectChanges();
    expect(component.messages().length).toBe(2);
    expect(component.messages()[0].role).toBe('user');
    expect(component.messages()[1].role).toBe('assistant');
    expect(component.messages()[1].usage?.tokensIn).toBe(2);
  });
});

describe('AiChatComponent disabled module', () => {
  beforeEach(async () => {
    await configure({
      ...healthyService,
      chat: () => throwError(() => ({ error: { message: 'Módulo IA deshabilitado' } }))
    });
  });

  it('should show a system message when the module is disabled', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.inputText.set('Hola');
    component.send();
    fixture.detectChanges();
    expect(component.messages().some((m) => m.role === 'system')).toBe(true);
  });
});