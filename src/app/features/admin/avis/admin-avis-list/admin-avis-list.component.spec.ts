import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAvisListComponent } from './admin-avis-list.component';

describe('AdminAvisListComponent', () => {
  let component: AdminAvisListComponent;
  let fixture: ComponentFixture<AdminAvisListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAvisListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAvisListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
