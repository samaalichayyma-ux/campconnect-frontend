import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuranceAgentLayoutComponent } from './insurance-agent-layout.component';

describe('InsuranceAgentLayoutComponent', () => {
  let component: InsuranceAgentLayoutComponent;
  let fixture: ComponentFixture<InsuranceAgentLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsuranceAgentLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsuranceAgentLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
