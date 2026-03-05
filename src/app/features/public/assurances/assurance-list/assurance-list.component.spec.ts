import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssuranceListComponent } from './assurance-list.component';

describe('AssuranceListComponent', () => {
  let component: AssuranceListComponent;
  let fixture: ComponentFixture<AssuranceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssuranceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssuranceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
