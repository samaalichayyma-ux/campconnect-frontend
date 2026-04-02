import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingSiteEditComponent } from './camping-site-edit.component';

describe('CampingSiteEditComponent', () => {
  let component: CampingSiteEditComponent;
  let fixture: ComponentFixture<CampingSiteEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingSiteEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampingSiteEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
