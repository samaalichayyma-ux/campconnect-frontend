import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssuranceDetailsComponent } from './assurance-details.component';

describe('AssuranceDetailsComponent', () => {
  let component: AssuranceDetailsComponent;
  let fixture: ComponentFixture<AssuranceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssuranceDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssuranceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
