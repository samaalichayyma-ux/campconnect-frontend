import { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

export const AUTO_CLOSE_ALERT_MS = 5000;

export function withAutoCloseAlert(options: Partial<SweetAlertOptions>): SweetAlertOptions {
  return {
    timer: AUTO_CLOSE_ALERT_MS,
    timerProgressBar: true,
    showConfirmButton: false,
    ...options
  } as SweetAlertOptions;
}

export function buildAutoCloseAlert(
  icon: SweetAlertIcon,
  title: string,
  text: string,
  options: Partial<SweetAlertOptions> = {}
): SweetAlertOptions {
  return withAutoCloseAlert({
    icon,
    title,
    text,
    ...options
  });
}
