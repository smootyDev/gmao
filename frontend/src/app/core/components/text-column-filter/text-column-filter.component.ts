import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-text-column-filter',
  standalone: true,
  imports: [FormsModule, TableModule, InputTextModule, IconFieldModule, InputIconModule, TranslatePipe],
  template: `
    <p-columnFilter [field]="field()" matchMode="contains" [showMenu]="false">
      <ng-template pTemplate="filter" let-value let-filter="filterCallback">
        <p-iconfield [class.w-full]="!width()" [style.width]="width() || null">
          <input pInputText type="text" class="w-full" [ngModel]="value" (ngModelChange)="filter($event)" [placeholder]="placeholder() || ('COMMON.FILTER' | translate)" />
          @if (value) {
            <p-inputicon styleClass="pi pi-times cursor-pointer" style="pointer-events: auto" (click)="filter('')" />
          }
        </p-iconfield>
      </ng-template>
    </p-columnFilter>
  `
})
export class TextColumnFilterComponent {
  field = input.required<string>();
  placeholder = input('');
  width = input('');
}
