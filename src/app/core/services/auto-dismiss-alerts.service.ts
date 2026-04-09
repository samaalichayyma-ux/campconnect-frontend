import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AutoDismissAlertsService {
  private readonly selector = '[data-auto-dismiss]';
  private readonly defaultDelayMs = 5000;
  private readonly fadeDurationMs = 180;

  private observer: MutationObserver | null = null;
  private dismissTimers = new WeakMap<HTMLElement, number>();
  private fadeTimers = new WeakMap<HTMLElement, number>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone
  ) {}

  init(): void {
    if (this.observer || !this.document?.body || typeof MutationObserver === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.scanElement(this.document.body);

      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => this.scanNode(node));
            continue;
          }

          if (mutation.type === 'characterData') {
            this.resetClosestAlert(mutation.target);
          }
        }
      });

      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  private scanNode(node: Node): void {
    if (node instanceof HTMLElement) {
      this.scanElement(node);
      return;
    }

    this.resetClosestAlert(node);
  }

  private scanElement(element: HTMLElement): void {
    if (element.matches(this.selector)) {
      this.scheduleDismiss(element);
    }

    element.querySelectorAll<HTMLElement>(this.selector).forEach((match) => {
      this.scheduleDismiss(match);
    });
  }

  private resetClosestAlert(node: Node): void {
    const element = node.parentElement?.closest<HTMLElement>(this.selector);
    if (element) {
      this.scheduleDismiss(element);
    }
  }

  private scheduleDismiss(element: HTMLElement): void {
    if (!element.isConnected) {
      return;
    }

    this.clearTimers(element);
    element.classList.remove('app-auto-dismissing', 'app-auto-dismissed');
    element.removeAttribute('hidden');
    element.removeAttribute('aria-hidden');

    const delay = this.getDelay(element);
    const dismissTimer = window.setTimeout(() => {
      if (!element.isConnected) {
        return;
      }

      element.classList.add('app-auto-dismissing');

      const fadeTimer = window.setTimeout(() => {
        if (!element.isConnected) {
          return;
        }

        element.classList.add('app-auto-dismissed');
        element.setAttribute('hidden', '');
        element.setAttribute('aria-hidden', 'true');
      }, this.fadeDurationMs);

      this.fadeTimers.set(element, fadeTimer);
    }, delay);

    this.dismissTimers.set(element, dismissTimer);
  }

  private clearTimers(element: HTMLElement): void {
    const dismissTimer = this.dismissTimers.get(element);
    if (dismissTimer !== undefined) {
      window.clearTimeout(dismissTimer);
      this.dismissTimers.delete(element);
    }

    const fadeTimer = this.fadeTimers.get(element);
    if (fadeTimer !== undefined) {
      window.clearTimeout(fadeTimer);
      this.fadeTimers.delete(element);
    }
  }

  private getDelay(element: HTMLElement): number {
    const rawDelay = Number(element.dataset['autoDismiss']);
    return Number.isFinite(rawDelay) && rawDelay > 0 ? rawDelay : this.defaultDelayMs;
  }
}
