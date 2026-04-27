import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentAssuranceListComponent } from './agent-assurance-list.component';

describe('AgentAssuranceListComponent', () => {
  let component: AgentAssuranceListComponent;
  let fixture: ComponentFixture<AgentAssuranceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentAssuranceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentAssuranceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
