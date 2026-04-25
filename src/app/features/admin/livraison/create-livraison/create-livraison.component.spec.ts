import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLivraisonComponent } from './create-livraison.component';

describe('CreateLivraisonComponent', () => {
  let component: CreateLivraisonComponent;
  let fixture: ComponentFixture<CreateLivraisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLivraisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLivraisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
