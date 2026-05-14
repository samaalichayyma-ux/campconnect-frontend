import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="admin-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.stroke-width]="strokeWidth"
      [style.width.px]="size"
      [style.height.px]="size"
      aria-hidden="true">
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'public'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18"></path>
          <path d="M12 3a15 15 0 0 1 0 18"></path>
          <path d="M12 3a15 15 0 0 0 0 18"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'dashboard'">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1.5"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1.5"></rect>
          <rect x="3" y="12" width="7" height="9" rx="1.5"></rect>
        </ng-container>

        <ng-container *ngSwitchCase="'users'">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
          <circle cx="9.5" cy="7" r="3"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'assurances'">
          <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"></path>
          <path d="m9.5 12.5 1.75 1.75 3.75-4"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'restaurants'">
          <path d="M4 3v8"></path>
          <path d="M6.5 3v8"></path>
          <path d="M9 3v8"></path>
          <path d="M6.5 11v10"></path>
          <path d="M15 3v8a3 3 0 0 0 3 3"></path>
          <path d="M18 3v18"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'events'">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <path d="M3 10h18"></path>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'calendar'">
          <rect x="3" y="4" width="18" height="17" rx="2"></rect>
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <path d="M3 10h18"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="6.5"></circle>
          <path d="m20 20-4.2-4.2"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'filter'">
          <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'target'">
          <circle cx="12" cy="12" r="8"></circle>
          <circle cx="12" cy="12" r="3.5"></circle>
          <path d="M12 2v3"></path>
          <path d="M12 19v3"></path>
          <path d="M2 12h3"></path>
          <path d="M19 12h3"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'folder'">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'location'">
          <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z"></path>
          <circle cx="12" cy="11" r="2.5"></circle>
        </ng-container>

        <ng-container *ngSwitchCase="'wallet'">
          <path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"></path>
          <path d="M4 9h15"></path>
          <path d="M15 14h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'sort'">
          <path d="m7 6-3-3-3 3"></path>
          <path d="M4 3v18"></path>
          <path d="m17 18 3 3 3-3"></path>
          <path d="M20 21V3"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'list'">
          <path d="M8 6h13"></path>
          <path d="M8 12h13"></path>
          <path d="M8 18h13"></path>
          <path d="M3 6h.01"></path>
          <path d="M3 12h.01"></path>
          <path d="M3 18h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'eye'">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </ng-container>

        <ng-container *ngSwitchCase="'heart'">
          <path d="m12 20-1.35-1.23C5.4 14 2 10.91 2 7.5 2 4.91 4.01 3 6.5 3 8.24 3 9.91 3.81 11 5.08 12.09 3.81 13.76 3 15.5 3 17.99 3 20 4.91 20 7.5c0 3.41-3.4 6.5-8.65 11.27L12 20z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'sparkles'">
          <path d="m12 3 1.25 3.75L17 8l-3.75 1.25L12 13l-1.25-3.75L7 8l3.75-1.25L12 3z"></path>
          <path d="m18.5 13 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"></path>
          <path d="m5.5 14 .7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'arrow-left'">
          <path d="M19 12H5"></path>
          <path d="m12 19-7-7 7-7"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'arrow-right'">
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'menu'">
          <path d="M4 7h16"></path>
          <path d="M4 12h16"></path>
          <path d="M4 17h16"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'plus'">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'minus'">
          <path d="M5 12h14"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'star'">
          <path d="m12 3 2.8 5.67 6.25.91-4.53 4.42 1.07 6.25L12 17.27l-5.59 2.98 1.07-6.25L2.95 9.58l6.25-.91L12 3z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 10v5"></path>
          <path d="M12 7h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'tent'">
          <path d="M4 19 12 5l8 14"></path>
          <path d="M8 19V13h8v6"></path>
          <path d="M12 5v14"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'mountain'">
          <path d="m3 19 7-10 4 5 2-3 5 8"></path>
          <path d="m9 9 1.5-2 2.5 3"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'palette'">
          <path d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 0-4.6h-.6a2.2 2.2 0 0 1-2.2-2.2A2.2 2.2 0 0 1 12.6 12H14a4 4 0 0 0 0-8z"></path>
          <path d="M7 10h.01"></path>
          <path d="M9.5 7.5h.01"></path>
          <path d="M7.5 14h.01"></path>
          <path d="M11 6h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'leaf'">
          <path d="M6 18c6 0 12-4 12-12-8 0-12 6-12 12z"></path>
          <path d="M8 16c2-2 5-5 9-7"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'waves'">
          <path d="M3 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 2-2"></path>
          <path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 2-2"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'music'">
          <path d="M10 18a2 2 0 1 1-4 0c0-1.1.9-2 2-2 .73 0 1.37.39 1.72.97L10 6l8-2v10"></path>
          <path d="M18 16a2 2 0 1 1-4 0c0-1.1.9-2 2-2 .73 0 1.37.39 1.72.97"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'reservations'">
          <path d="M3 9a2 2 0 0 0 0 6v4h18v-4a2 2 0 0 0 0-6V5H3z"></path>
          <path d="M13 5v14"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'formations'">
          <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H10v18H4.5A2.5 2.5 0 0 0 2 23V5.5z"></path>
          <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H14v18h5.5A2.5 2.5 0 0 1 22 23V5.5z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'profile'">
          <path d="M20 21a8 8 0 0 0-16 0"></path>
          <circle cx="12" cy="8" r="4"></circle>
        </ng-container>

        <ng-container *ngSwitchCase="'guides'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m9.5 14.5 1-5 5-1-1 5-5 1z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'edit'">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'delete'">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'upload'">
          <path d="M12 16V4"></path>
          <path d="m7 9 5-5 5 5"></path>
          <path d="M4 20h16"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'download'">
          <path d="M12 4v12"></path>
          <path d="m7 11 5 5 5-5"></path>
          <path d="M4 20h16"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'close'">
          <path d="m6 6 12 12"></path>
          <path d="M18 6 6 18"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'check'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m8.5 12.5 2.5 2.5 4.5-5"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'refund'">
          <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
          <path d="M21 3v6h-6"></path>
          <path d="M8.5 15.5c.55.83 1.58 1.5 2.9 1.5 1.71 0 3.1-1.01 3.1-2.25 0-3-6-1.5-6-4.75 0-1.24 1.39-2.25 3.1-2.25 1.32 0 2.35.67 2.9 1.5"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'warning'">
          <path d="M12 3 2.7 19a1.2 1.2 0 0 0 1.04 1.8h16.52A1.2 1.2 0 0 0 21.3 19L12 3z"></path>
          <path d="M12 9v4.5"></path>
          <path d="M12 17h.01"></path>
        </ng-container>

        <ng-container *ngSwitchCase="'error'">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v5"></path>
          <path d="M12 16h.01"></path>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <circle cx="12" cy="12" r="9"></circle>
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      line-height: 0;
    }

    .admin-icon {
      display: block;
    }
  `]
})
export class AdminIconComponent {
  @Input() name = 'dashboard';
  @Input() size = 20;
  @Input() strokeWidth = 1.8;
}
