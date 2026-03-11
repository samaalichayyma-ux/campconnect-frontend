import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingSiteCreateComponent } from './camping-site-create.component';

describe('CampingSiteCreateComponent', () => {
  let component: CampingSiteCreateComponent;
  let fixture: ComponentFixture<CampingSiteCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingSiteCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampingSiteCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
