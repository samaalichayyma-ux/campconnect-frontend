import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteBookingComponent } from './site-booking.component';

describe('SiteBookingComponent', () => {
  let component: SiteBookingComponent;
  let fixture: ComponentFixture<SiteBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteBookingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
