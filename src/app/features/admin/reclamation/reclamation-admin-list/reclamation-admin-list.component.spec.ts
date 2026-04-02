import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReclamationAdminListComponent } from './reclamation-admin-list.component';

describe('ReclamationAdminListComponent', () => {
  let component: ReclamationAdminListComponent;
  let fixture: ComponentFixture<ReclamationAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReclamationAdminListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReclamationAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
