import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLivreurLivraisonsComponent } from './my-livreur-livraisons.component';

describe('MyLivreurLivraisonsComponent', () => {
  let component: MyLivreurLivraisonsComponent;
  let fixture: ComponentFixture<MyLivreurLivraisonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyLivreurLivraisonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyLivreurLivraisonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
