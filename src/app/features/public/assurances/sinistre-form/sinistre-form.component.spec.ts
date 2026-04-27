import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinistreFormComponent } from './sinistre-form.component';

describe('SinistreFormComponent', () => {
  let component: SinistreFormComponent;
  let fixture: ComponentFixture<SinistreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SinistreFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinistreFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
