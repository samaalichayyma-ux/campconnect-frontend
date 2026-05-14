import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatMarketplaceComponent } from './stat-marketplace.component';

describe('StatMarketplaceComponent', () => {
  let component: StatMarketplaceComponent;
  let fixture: ComponentFixture<StatMarketplaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatMarketplaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatMarketplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
