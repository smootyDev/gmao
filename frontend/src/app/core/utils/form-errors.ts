import { AbstractControl } from '@angular/forms';

export function fieldInvalid(control: AbstractControl | null, submitted: boolean): boolean {
  return !!control && control.invalid && (control.touched || submitted);
}

export function fieldErrorKey(control: AbstractControl | null): string | null {
  const errors = control?.errors;
  if (!errors) {
    return null;
  }
  if (errors['required']) return 'COMMON.VALIDATION.REQUIRED';
  if (errors['email']) return 'COMMON.VALIDATION.EMAIL';
  if (errors['minlength']) return 'COMMON.VALIDATION.MIN_LENGTH';
  if (errors['maxlength']) return 'COMMON.VALIDATION.MAX_LENGTH';
  return null;
}

export function fieldErrorParams(control: AbstractControl | null): Record<string, unknown> {
  const errors = control?.errors;
  return errors?.['minlength'] ?? errors?.['maxlength'] ?? {};
}
