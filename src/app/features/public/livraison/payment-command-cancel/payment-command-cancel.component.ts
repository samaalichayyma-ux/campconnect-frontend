import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-command-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-command-cancel.component.html',
  styleUrl: './payment-command-cancel.component.css'
})
export class PaymentCommandCancelComponent {}