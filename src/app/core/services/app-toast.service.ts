import { Injectable } from '@angular/core';
import { IndividualConfig, ToastrService } from 'ngx-toastr';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

@Injectable({ providedIn: 'root' })
export class AppToastService {
  constructor(private readonly toastr: ToastrService) {}

  success(message: string, title = 'Action complete', config?: Partial<IndividualConfig>): void {
    this.show('success', message, title, config);
  }

  error(message: string, title = 'Something went wrong', config?: Partial<IndividualConfig>): void {
    this.show('error', message, title, config);
  }

  info(message: string, title = 'Heads up', config?: Partial<IndividualConfig>): void {
    this.show('info', message, title, config);
  }

  warning(message: string, title = 'Attention', config?: Partial<IndividualConfig>): void {
    this.show('warning', message, title, config);
  }

  clear(toastId?: number): void {
    this.toastr.clear(toastId);
  }

  private show(
    kind: ToastKind,
    message: string,
    title: string,
    config?: Partial<IndividualConfig>
  ): void {
    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) {
      return;
    }

    const options: Partial<IndividualConfig> = {
      ...config,
      toastClass: `cc-toast ngx-toastr`
    };

    switch (kind) {
      case 'success':
        this.toastr.success(normalizedMessage, title, options);
        break;
      case 'error':
        this.toastr.error(normalizedMessage, title, options);
        break;
      case 'info':
        this.toastr.info(normalizedMessage, title, options);
        break;
      case 'warning':
        this.toastr.warning(normalizedMessage, title, options);
        break;
    }
  }
}
