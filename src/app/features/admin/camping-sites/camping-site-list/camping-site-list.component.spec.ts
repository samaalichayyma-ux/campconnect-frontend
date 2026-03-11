import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingSiteListComponent } from './camping-site-list.component';

describe('CampingSiteListComponent', () => {
  let component: CampingSiteListComponent;
  let fixture: ComponentFixture<CampingSiteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingSiteListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampingSiteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
