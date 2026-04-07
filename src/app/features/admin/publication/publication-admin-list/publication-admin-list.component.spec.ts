import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationAdminListComponent } from './publication-admin-list.component';

describe('PublicationAdminListComponent', () => {
  let component: PublicationAdminListComponent;
  let fixture: ComponentFixture<PublicationAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationAdminListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
