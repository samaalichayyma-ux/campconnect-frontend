import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDeliveryDetailComponent } from './client-delivery-detail.component';

describe('ClientDeliveryDetailComponent', () => {
  let component: ClientDeliveryDetailComponent;
  let fixture: ComponentFixture<ClientDeliveryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientDeliveryDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientDeliveryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
