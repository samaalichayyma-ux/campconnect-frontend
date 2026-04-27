import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssuranceListAdminComponent } from './assurance-list-admin.component';

describe('AssuranceListAdminComponent', () => {
  let component: AssuranceListAdminComponent;
  let fixture: ComponentFixture<AssuranceListAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssuranceListAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssuranceListAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
