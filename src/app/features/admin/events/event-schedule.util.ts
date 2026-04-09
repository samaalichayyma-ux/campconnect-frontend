import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const ONE_MINUTE_EVENT_DURATION = 1;

export function calculateEventDurationMinutes(
  startTime?: string | null,
  endTime?: string | null
): number | null {
  const startTotalMinutes = parseTimeToMinutes(startTime);
  const endTotalMinutes = parseTimeToMinutes(endTime);

  if (startTotalMinutes === null || endTotalMinutes === null) {
    return null;
  }

  return endTotalMinutes - startTotalMinutes;
}

export function eventScheduleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const durationMinutes = calculateEventDurationMinutes(
      control.get('startTime')?.value,
      control.get('endTime')?.value
    );

    if (durationMinutes === null) {
      return null;
    }

    if (durationMinutes <= 0) {
      return { invalidTimeRange: true };
    }

    if (durationMinutes <= ONE_MINUTE_EVENT_DURATION) {
      return {
        tooShortSchedule: {
          durationMinutes
        }
      };
    }

    return null;
  };
}

export function formatEventDurationLabel(durationMinutes: number | null): string {
  if (durationMinutes === null) {
    return 'Not set';
  }

  if (durationMinutes < 60) {
    return durationMinutes === 1 ? '1 minute' : `${durationMinutes} minutes`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`;

  if (minutes === 0) {
    return hourLabel;
  }

  return `${hourLabel} ${minutes === 1 ? '1 minute' : `${minutes} minutes`}`;
}

export function getEventScheduleValidationMessage(durationMinutes: number | null): string | null {
  if (durationMinutes === null) {
    return null;
  }

  if (durationMinutes <= 0) {
    return 'End time must be after the start time. Choose a later end time and try again.';
  }

  if (durationMinutes <= ONE_MINUTE_EVENT_DURATION) {
    return 'This event is set to last only 1 minute, and that schedule is not accepted. Choose a later end time so the event lasts longer, then try again.';
  }

  return null;
}

export function rewriteScheduleSaveErrorMessage(
  rawMessage: string | null,
  durationMinutes: number | null
): string | null {
  const scheduleValidationMessage = getEventScheduleValidationMessage(durationMinutes);
  if (scheduleValidationMessage) {
    return scheduleValidationMessage;
  }

  const trimmedMessage = rawMessage?.trim();
  if (!trimmedMessage) {
    return null;
  }

  const normalizedMessage = trimmedMessage.toLowerCase();
  const scheduleKeywords = [
    'duration',
    'duree',
    'minute',
    'datedebut',
    'datefin',
    'start time',
    'end time',
    'start',
    'end',
    'before',
    'after'
  ];
  const looksLikeScheduleError = scheduleKeywords.some((keyword) => normalizedMessage.includes(keyword));

  if (!looksLikeScheduleError) {
    return trimmedMessage;
  }

  if (durationMinutes !== null && durationMinutes > 0) {
    return `This event is currently set to last ${formatEventDurationLabel(durationMinutes)}, and that schedule was rejected. Choose a later end time so the event lasts longer, then try again.`;
  }

  return 'End time must be after the start time. Choose a later end time and try again.';
}

function parseTimeToMinutes(value?: string | null): number | null {
  if (typeof value !== 'string' || !value.includes(':')) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return (hours * 60) + minutes;
}
