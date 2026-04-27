import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemboursementsAdminComponent } from './remboursements-admin.component';

describe('RemboursementsAdminComponent', () => {
  let component: RemboursementsAdminComponent;
  let fixture: ComponentFixture<RemboursementsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemboursementsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemboursementsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
