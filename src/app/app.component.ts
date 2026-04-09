import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AutoDismissAlertsService } from './core/services/auto-dismiss-alerts.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'campconnect-frontend';

  constructor(private readonly autoDismissAlertsService: AutoDismissAlertsService) {
    this.autoDismissAlertsService.init();
  }
}
