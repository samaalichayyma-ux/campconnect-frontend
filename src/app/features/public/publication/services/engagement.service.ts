import { Injectable } from '@angular/core';

type EngagementBucket = 'publication-like' | 'comment-like' | 'publication-view';

@Injectable({
  providedIn: 'root'
})
export class EngagementService {
  private readonly namespace = 'campconnect-engagement-v1';
  private readonly anonymousUserKey = 'anonymous';
  private readonly cache = new Map<string, Set<number>>();

  hasPublicationLike(publicationId: number, email?: string): boolean {
    return this.has('publication-like', publicationId, email);
  }

  markPublicationLike(publicationId: number, email?: string): void {
    this.mark('publication-like', publicationId, email);
  }

  hasCommentLike(commentId: number, email?: string): boolean {
    return this.has('comment-like', commentId, email);
  }

  markCommentLike(commentId: number, email?: string): void {
    this.mark('comment-like', commentId, email);
  }

  hasPublicationView(publicationId: number, email?: string): boolean {
    return this.has('publication-view', publicationId, email);
  }

  markPublicationView(publicationId: number, email?: string): void {
    this.mark('publication-view', publicationId, email);
  }

  private has(bucket: EngagementBucket, entityId: number, email?: string): boolean {
    if (!Number.isFinite(entityId) || entityId <= 0) {
      return false;
    }

    return this.getSet(bucket, email).has(entityId);
  }

  private mark(bucket: EngagementBucket, entityId: number, email?: string): void {
    if (!Number.isFinite(entityId) || entityId <= 0) {
      return;
    }

    const set = this.getSet(bucket, email);
    if (set.has(entityId)) {
      return;
    }

    set.add(entityId);
    this.persist(bucket, email, set);
  }

  private getSet(bucket: EngagementBucket, email?: string): Set<number> {
    const key = this.buildStorageKey(bucket, email);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const parsed = this.readStorageSet(key);
    this.cache.set(key, parsed);
    return parsed;
  }

  private persist(bucket: EngagementBucket, email: string | undefined, value: Set<number>): void {
    const key = this.buildStorageKey(bucket, email);
    this.cache.set(key, value);

    try {
      localStorage.setItem(key, JSON.stringify(Array.from(value)));
    } catch {
      // LocalStorage can fail in private mode or with quota limits.
    }
  }

  private readStorageSet(storageKey: string): Set<number> {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return new Set<number>();
      }

      const decoded = JSON.parse(raw);
      if (!Array.isArray(decoded)) {
        localStorage.removeItem(storageKey);
        return new Set<number>();
      }

      const normalized = decoded
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

      return new Set<number>(normalized);
    } catch {
      localStorage.removeItem(storageKey);
      return new Set<number>();
    }
  }

  private buildStorageKey(bucket: EngagementBucket, email?: string): string {
    return `${this.namespace}:${bucket}:${this.normalizeUserKey(email)}`;
  }

  private normalizeUserKey(email?: string): string {
    const normalized = (email || '').trim().toLowerCase();
    return normalized || this.anonymousUserKey;
  }
}