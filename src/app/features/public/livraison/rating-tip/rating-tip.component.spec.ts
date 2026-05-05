import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingTipComponent } from './rating-tip.component';

describe('RatingTipComponent', () => {
  let component: RatingTipComponent;
  let fixture: ComponentFixture<RatingTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingTipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatingTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
