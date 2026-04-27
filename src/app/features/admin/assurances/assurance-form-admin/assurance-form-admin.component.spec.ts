import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssuranceFormAdminComponent } from './assurance-form-admin.component';

describe('AssuranceFormAdminComponent', () => {
  let component: AssuranceFormAdminComponent;
  let fixture: ComponentFixture<AssuranceFormAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssuranceFormAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssuranceFormAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
