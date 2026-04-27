import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCommandCancelComponent } from './payment-command-cancel.component';

describe('PaymentCommandCancelComponent', () => {
  let component: PaymentCommandCancelComponent;
  let fixture: ComponentFixture<PaymentCommandCancelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCommandCancelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCommandCancelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
