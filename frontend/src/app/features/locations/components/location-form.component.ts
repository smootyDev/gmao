import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { Location, LocationService } from '../services/location.service';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, CardModule, InputTextModule, CheckboxModule, SelectModule, TextareaModule, TranslatePipe],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss'
})
export class LocationFormComponent implements OnInit {
  form: FormGroup;
  locations = signal<Location[]>([]);
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly locationService: LocationService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.locationService.get(+idParam).subscribe({
        next: (location) => this.form.patchValue(location),
        error: () => this.router.navigate(['/locations'])
      });
    }
  }

  availableParents(): Location[] {
    return this.locations().filter((location) => location.id !== this.id());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const location = this.form.getRawValue() as Location;
    const operation = this.isEdit() && this.id() !== undefined
      ? this.locationService.update(this.id()!, location)
      : this.locationService.create(location);

    operation.subscribe({
      next: () => this.router.navigate(['/locations']),
      error: () => this.saving.set(false)
    });
  }
}
