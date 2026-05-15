import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailpanierComponent } from './detailpanier.component';

describe('DetailpanierComponent', () => {
  let component: DetailpanierComponent;
  let fixture: ComponentFixture<DetailpanierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailpanierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailpanierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
