import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SouscriptionsAdminComponent } from './souscriptions-admin.component';

describe('SouscriptionsAdminComponent', () => {
  let component: SouscriptionsAdminComponent;
  let fixture: ComponentFixture<SouscriptionsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SouscriptionsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SouscriptionsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
