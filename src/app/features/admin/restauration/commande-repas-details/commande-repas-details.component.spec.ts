import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeRepasDetailsComponent } from './commande-repas-details.component';

describe('CommandeRepasDetailsComponent', () => {
  let component: CommandeRepasDetailsComponent;
  let fixture: ComponentFixture<CommandeRepasDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeRepasDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandeRepasDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
