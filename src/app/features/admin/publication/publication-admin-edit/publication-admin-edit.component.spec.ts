import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationAdminEditComponent } from './publication-admin-edit.component';

describe('PublicationAdminEditComponent', () => {
  let component: PublicationAdminEditComponent;
  let fixture: ComponentFixture<PublicationAdminEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationAdminEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationAdminEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
