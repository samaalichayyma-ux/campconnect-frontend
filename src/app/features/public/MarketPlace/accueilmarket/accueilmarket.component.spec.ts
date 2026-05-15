import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccueilmarketComponent } from './accueilmarket.component';

describe('AccueilmarketComponent', () => {
  let component: AccueilmarketComponent;
  let fixture: ComponentFixture<AccueilmarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccueilmarketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccueilmarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
