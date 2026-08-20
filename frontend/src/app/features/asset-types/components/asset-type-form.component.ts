import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AssetType, AssetTypeService } from '../services/asset-type.service';
import { ASSET_TYPE_ICONS, assetTypeIconLabel, assetTypeIconColor, normalizeAssetTypeIcon } from '../../../core/utils/asset-type-visual';

@Component({
  selector: 'app-asset-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, CardModule, CheckboxModule, InputTextModule, TextareaModule, SelectModule, TranslatePipe],
  templateUrl: './asset-type-form.component.html',
  styleUrl: './asset-type-form.component.scss'
})
export class AssetTypeFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  iconOptions = ASSET_TYPE_ICONS.map((icon) => ({ label: assetTypeIconLabel(icon), value: icon }));

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly assetTypeService: AssetTypeService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', Validators.required],
      description: [''],
      icon: [''],
      active: [true]
    });
  }

  iconColor(icon: string | undefined): string {
    return assetTypeIconColor(icon);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.assetTypeService.get(+idParam).subscribe({
        next: (assetType) => this.form.patchValue({ ...assetType, icon: normalizeAssetTypeIcon(assetType.icon) }),
        error: () => this.router.navigate(['/asset-types'])
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const assetType = this.form.getRawValue() as AssetType;
    const operation = this.isEdit() && this.id() !== undefined
      ? this.assetTypeService.update(this.id()!, assetType)
      : this.assetTypeService.create(assetType);

    operation.subscribe({
      next: () => this.router.navigate(['/asset-types']),
      error: () => this.saving.set(false)
    });
  }
}
