import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuranceAgentDashboardComponent } from './insurance-agent-dashboard.component';

describe('InsuranceAgentDashboardComponent', () => {
  let component: InsuranceAgentDashboardComponent;
  let fixture: ComponentFixture<InsuranceAgentDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsuranceAgentDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsuranceAgentDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
