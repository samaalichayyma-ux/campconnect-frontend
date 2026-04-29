import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tip-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tip-payment-cancel.component.html',
  styleUrl: './tip-payment-cancel.component.css'
})
export class TipPaymentCancelComponent {}