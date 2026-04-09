import { inject } from '@angular/core';

import { AppToastService } from '../services/app-toast.service';

export abstract class ToastMessageHost {
  protected readonly appToast = inject(AppToastService);

  private _errorMessage = '';
  private _successMessage = '';

  get errorMessage(): string {
    return this._errorMessage;
  }

  set errorMessage(value: string) {
    const normalizedMessage = this.normalizeMessage(value);
    this._errorMessage = normalizedMessage;

    if (normalizedMessage) {
      this.appToast.error(normalizedMessage, this.errorToastTitle);
    }
  }

  get successMessage(): string {
    return this._successMessage;
  }

  set successMessage(value: string) {
    const normalizedMessage = this.normalizeMessage(value);
    this._successMessage = normalizedMessage;

    if (normalizedMessage) {
      this.appToast.success(normalizedMessage, this.successToastTitle);
    }
  }

  protected get errorToastTitle(): string {
    return 'Something went wrong';
  }

  protected get successToastTitle(): string {
    return 'Action complete';
  }

  protected showErrorToast(message: string, title = this.errorToastTitle): void {
    this.appToast.error(message, title);
  }

  protected showSuccessToast(message: string, title = this.successToastTitle): void {
    this.appToast.success(message, title);
  }

  protected showInfoToast(message: string, title = 'Heads up'): void {
    this.appToast.info(message, title);
  }

  protected showWarningToast(message: string, title = 'Attention'): void {
    this.appToast.warning(message, title);
  }

  private normalizeMessage(value: string): string {
    return String(value || '').trim();
  }
}
