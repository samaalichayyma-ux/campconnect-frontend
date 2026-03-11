import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingSitesComponent } from './camping-sites.component';

describe('CampingSitesComponent', () => {
  let component: CampingSitesComponent;
  let fixture: ComponentFixture<CampingSitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingSitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampingSitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
