import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepasAdminComponent } from './repas-admin.component';

describe('RepasAdminComponent', () => {
  let component: RepasAdminComponent;
  let fixture: ComponentFixture<RepasAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepasAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepasAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
