import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-guide-step-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-step-tooltip.component.html',
  styleUrl: './guide-step-tooltip.component.css'
})
export class GuideStepTooltipComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() actionHint = '';
  @Input() tutorial = '';
  @Input() checklist: string[] = [];
  @Input() stepLabel = '';
  @Input() progressPercent = 0;
}
