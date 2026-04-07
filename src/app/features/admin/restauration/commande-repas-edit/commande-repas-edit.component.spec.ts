import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeRepasEditComponent } from './commande-repas-edit.component';

describe('CommandeRepasEditComponent', () => {
  let component: CommandeRepasEditComponent;
  let fixture: ComponentFixture<CommandeRepasEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeRepasEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandeRepasEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
