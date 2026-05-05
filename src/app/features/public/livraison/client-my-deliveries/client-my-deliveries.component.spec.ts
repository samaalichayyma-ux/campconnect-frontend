import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientMyDeliveriesComponent } from './client-my-deliveries.component';

describe('ClientMyDeliveriesComponent', () => {
  let component: ClientMyDeliveriesComponent;
  let fixture: ComponentFixture<ClientMyDeliveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientMyDeliveriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientMyDeliveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
