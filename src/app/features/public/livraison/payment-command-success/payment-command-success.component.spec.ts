import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCommandSuccessComponent } from './payment-command-success.component';

describe('PaymentCommandSuccessComponent', () => {
  let component: PaymentCommandSuccessComponent;
  let fixture: ComponentFixture<PaymentCommandSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCommandSuccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCommandSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
