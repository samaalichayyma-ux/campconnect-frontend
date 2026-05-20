import { Injectable } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormationStatsBarItemDto } from '../models/formation-stats.model';

interface FormationConsultationEntry {
  formationId: number;
  title: string;
  count: number;
  updatedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormationConsultationService {
  private readonly storagePrefix = 'campconnect:formation:consultations:';

  constructor(private authService: AuthService) {}

  trackHoverConsultation(formationId: number, title: string): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    const normalizedTitle = this.normalizeTitle(title, formationId);
    const entries = this.readEntries();
    const now = Date.now();

    const existing = entries.get(formationId);
    if (existing) {
      existing.count += 1;
      existing.updatedAt = now;
      if (normalizedTitle) {
        existing.title = normalizedTitle;
      }
    } else {
      entries.set(formationId, {
        formationId,
        title: normalizedTitle,
        count: 1,
        updatedAt: now
      });
    }

    this.writeEntries(entries);
  }

  getConsultationCount(formationId: number): number {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return 0;
    }

    const entry = this.readEntries().get(formationId);
    if (!entry) {
      return 0;
    }

    return Math.max(0, Math.floor(entry.count));
  }

  getTopConsulted(limit = 10): FormationStatsBarItemDto[] {
    const safeLimit = Math.max(1, Math.floor(limit));
    const sortedEntries = Array.from(this.readEntries().values())
      .filter((entry) => entry.count > 0)
      .sort((first, second) => {
        if (second.count !== first.count) {
          return second.count - first.count;
        }
        return second.updatedAt - first.updatedAt;
      })
      .slice(0, safeLimit);

    return sortedEntries.map((entry) => ({
      formationId: entry.formationId,
      title: this.normalizeTitle(entry.title, entry.formationId),
      value: Math.max(0, Math.floor(entry.count))
    }));
  }

  private storageKey(): string {
    const userId = this.authService.getUserId();
    if (userId > 0) {
      return `${this.storagePrefix}id:${userId}`;
    }

    const email = this.authService.getUserEmail().trim().toLowerCase();
    return `${this.storagePrefix}email:${email || 'anonymous'}`;
  }

  private readEntries(): Map<number, FormationConsultationEntry> {
    const raw = localStorage.getItem(this.storageKey());
    if (!raw) {
      return new Map<number, FormationConsultationEntry>();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return new Map<number, FormationConsultationEntry>();
      }

      const result = new Map<number, FormationConsultationEntry>();
      parsed.forEach((item) => {
        const entry = this.toEntry(item);
        if (!entry) {
          return;
        }
        result.set(entry.formationId, entry);
      });

      return result;
    } catch {
      return new Map<number, FormationConsultationEntry>();
    }
  }

  private writeEntries(entries: Map<number, FormationConsultationEntry>): void {
    const serializable = Array.from(entries.values()).map((entry) => ({
      formationId: entry.formationId,
      title: this.normalizeTitle(entry.title, entry.formationId),
      count: Math.max(0, Math.floor(entry.count)),
      updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now()
    }));
    localStorage.setItem(this.storageKey(), JSON.stringify(serializable));
  }

  private toEntry(value: unknown): FormationConsultationEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as {
      formationId?: unknown;
      id?: unknown;
      title?: unknown;
      count?: unknown;
      viewsCount?: unknown;
      value?: unknown;
      updatedAt?: unknown;
    };

    const formationId = this.toPositiveNumber(record.formationId ?? record.id);
    if (!formationId) {
      return null;
    }

    const count = this.toPositiveNumber(record.count ?? record.viewsCount ?? record.value) ?? 0;
    const updatedAt = this.toPositiveNumber(record.updatedAt) ?? Date.now();

    return {
      formationId,
      title: this.normalizeTitle(this.toOptionalText(record.title), formationId),
      count,
      updatedAt
    };
  }

  private normalizeTitle(value: unknown, formationId: number): string {
    const text = this.toOptionalText(value);
    if (text) {
      return text;
    }
    return `Formation #${formationId}`;
  }

  private toOptionalText(value: unknown): string {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }

  private toPositiveNumber(value: unknown): number | null {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }
}
