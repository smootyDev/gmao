import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FilterOption } from '../../models/filter-option';

@Component({
  selector: 'app-dropdown-column-filter',
  standalone: true,
  imports: [FormsModule, TableModule, SelectModule, TranslatePipe],
  template: `
    <p-columnFilter [field]="field()" matchMode="equals" [showMenu]="false">
      <ng-template pTemplate="filter" let-value let-filter="filterCallback">
        <p-select
          [ngModel]="value"
          [options]="options()"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          [placeholder]="placeholder()"
          styleClass="w-full"
          (onChange)="filter($event.value)"
        >
          <ng-template let-option pTemplate="item">{{ option.label | translate }}</ng-template>
          <ng-template let-option pTemplate="selectedItem">{{ option ? (option.label | translate) : '' }}</ng-template>
        </p-select>
      </ng-template>
    </p-columnFilter>
  `
})
export class DropdownColumnFilterComponent {
  field = input.required<string>();
  options = input<FilterOption[]>([]);
  placeholder = input('');
}
