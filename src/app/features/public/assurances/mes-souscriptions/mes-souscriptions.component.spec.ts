import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesSouscriptionsComponent } from './mes-souscriptions.component';

describe('MesSouscriptionsComponent', () => {
  let component: MesSouscriptionsComponent;
  let fixture: ComponentFixture<MesSouscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesSouscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesSouscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
