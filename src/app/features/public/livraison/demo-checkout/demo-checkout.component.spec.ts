import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoCheckoutComponent } from './demo-checkout.component';

describe('DemoCheckoutComponent', () => {
  let component: DemoCheckoutComponent;
  let fixture: ComponentFixture<DemoCheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoCheckoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
