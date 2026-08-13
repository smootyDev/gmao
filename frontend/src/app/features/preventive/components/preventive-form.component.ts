import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { PreventivePlan, PreventivePlanService } from '../services/preventive-plan.service';
import { Asset, AssetService } from '../../assets/services/asset.service';

@Component({
  selector: 'app-preventive-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TextareaModule,
    CheckboxModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './preventive-form.component.html',
  styleUrl: './preventive-form.component.scss'
})
export class PreventiveFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  assets = signal<Asset[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private preventivePlanService: PreventivePlanService,
    private assetService: AssetService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      assetId: [null, Validators.required],
      frequencyDays: [30, [Validators.required, Validators.min(1)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.assetService.list().subscribe((assets) => this.assets.set(assets));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.preventivePlanService.get(+idParam).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.router.navigate(['/preventive'])
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const plan = this.form.getRawValue() as PreventivePlan;
    const operation = this.isEdit() && this.id() !== undefined
      ? this.preventivePlanService.update(this.id()!, plan)
      : this.preventivePlanService.create(plan);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit() ? 'Plan actualizado' : 'Plan creado'
        });
        this.router.navigate(['/preventive']);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el plan'
        });
      }
    });
  }
}
