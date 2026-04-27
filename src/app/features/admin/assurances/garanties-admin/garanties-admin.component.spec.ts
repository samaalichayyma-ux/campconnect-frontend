import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarantiesAdminComponent } from './garanties-admin.component';

describe('GarantiesAdminComponent', () => {
  let component: GarantiesAdminComponent;
  let fixture: ComponentFixture<GarantiesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GarantiesAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GarantiesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
