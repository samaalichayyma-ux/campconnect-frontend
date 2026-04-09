import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-booking-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-payment-cancel.component.html',
  styleUrl: './booking-payment-cancel.component.css'
})
export class BookingPaymentCancelComponent {}