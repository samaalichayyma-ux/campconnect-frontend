import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SouscriptionFormComponent } from './souscription-form.component';

describe('SouscriptionFormComponent', () => {
  let component: SouscriptionFormComponent;
  let fixture: ComponentFixture<SouscriptionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SouscriptionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SouscriptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
