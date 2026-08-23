import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { USER_ROLE_OPTIONS } from '../../../core/constants/select-options';
import { User, UserService } from '../services/user.service';
import { fieldErrorKey, fieldErrorParams, fieldInvalid } from '../../../core/utils/form-errors';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, CardModule, CheckboxModule, InputTextModule, SelectModule, TagModule, PasswordModule, MessageModule, TranslatePipe],
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  submitted = signal(false);
  roles = USER_ROLE_OPTIONS;

  roleSeverity(role?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (role) {
      case 'ADMIN': return 'contrast';
      case 'MANAGER': return 'info';
      case 'TECH': return 'secondary';
      default: return 'secondary';
    }
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService
  ) {
    this.form = fb.group({
      employeeCode: ['', Validators.required],
      username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      department: [''],
      password: [''],
      role: ['TECH', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.id.set(+id);
      this.userService.get(+id).subscribe({
        next: (user) => this.form.patchValue(user),
        error: () => this.router.navigate(['/users'])
      });
    } else {
      this.form.get('password')?.addValidators(Validators.required);
    }
  }

  isInvalid(name: string): boolean {
    return fieldInvalid(this.form.get(name), this.submitted());
  }

  errorKey(name: string): string | null {
    return fieldErrorKey(this.form.get(name));
  }

  errorParams(name: string): Record<string, unknown> {
    return fieldErrorParams(this.form.get(name));
  }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const user = this.form.getRawValue() as User;
    const operation = this.isEdit() ? this.userService.update(this.id()!, user) : this.userService.create(user);
    operation.subscribe({
      next: () => this.router.navigate(['/users']),
      error: () => this.saving.set(false)
    });
  }
}
