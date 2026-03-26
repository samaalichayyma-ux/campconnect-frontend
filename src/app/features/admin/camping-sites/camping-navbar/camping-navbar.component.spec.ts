import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingNavbarComponent } from './camping-navbar.component';

describe('CampingNavbarComponent', () => {
  let component: CampingNavbarComponent;
  let fixture: ComponentFixture<CampingNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampingNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampingNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
