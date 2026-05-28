import { FormControl, FormGroup } from '@angular/forms';

import {
  calculateEventDurationMinutes,
  eventScheduleValidator,
  formatEventDurationLabel,
  getEventScheduleValidationMessage,
  rewriteScheduleSaveErrorMessage
} from './event-schedule.util';

describe('event schedule utilities', () => {
  it('calculates event duration in minutes', () => {
    expect(calculateEventDurationMinutes('09:30', '11:00')).toBe(90);
    expect(calculateEventDurationMinutes('09:30', '09:30')).toBe(0);
    expect(calculateEventDurationMinutes('23:30', '00:30')).toBe(-1380);
    expect(calculateEventDurationMinutes(null, '11:00')).toBeNull();
    expect(calculateEventDurationMinutes('bad', '11:00')).toBeNull();
  });

  it('validates invalid and too-short schedules', () => {
    const form = new FormGroup({
      startTime: new FormControl('10:00'),
      endTime: new FormControl('09:59')
    });

    expect(eventScheduleValidator()(form)).toEqual({
      invalidTimeRange: true
    });

    form.patchValue({ endTime: '10:01' });

    expect(eventScheduleValidator()(form)).toEqual({
      tooShortSchedule: {
        durationMinutes: 1
      }
    });

    form.patchValue({ endTime: '10:30' });

    expect(eventScheduleValidator()(form)).toBeNull();
  });

  it('formats schedule labels and rewrites schedule API errors', () => {
    expect(formatEventDurationLabel(null)).toBe('Not set');
    expect(formatEventDurationLabel(1)).toBe('1 minute');
    expect(formatEventDurationLabel(45)).toBe('45 minutes');
    expect(formatEventDurationLabel(60)).toBe('1 hour');
    expect(formatEventDurationLabel(120)).toBe('2 hours');
    expect(formatEventDurationLabel(61)).toBe('1 hour 1 minute');
    expect(formatEventDurationLabel(125)).toBe('2 hours 5 minutes');
    expect(getEventScheduleValidationMessage(null)).toBeNull();
    expect(getEventScheduleValidationMessage(0)).toContain('End time must be after');
    expect(getEventScheduleValidationMessage(1)).toContain('only 1 minute');
    expect(getEventScheduleValidationMessage(30)).toBeNull();
    expect(rewriteScheduleSaveErrorMessage('Duration is invalid', 30)).toContain('30 minutes');
    expect(rewriteScheduleSaveErrorMessage('   ', 30)).toBeNull();
    expect(rewriteScheduleSaveErrorMessage(null, -5)).toContain('End time must be after');
    expect(rewriteScheduleSaveErrorMessage('Organizer is missing', 30)).toBe('Organizer is missing');
  });
});
