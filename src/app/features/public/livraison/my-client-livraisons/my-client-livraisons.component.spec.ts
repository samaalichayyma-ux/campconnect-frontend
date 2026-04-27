import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyClientLivraisonsComponent } from './my-client-livraisons.component';

describe('MyClientLivraisonsComponent', () => {
  let component: MyClientLivraisonsComponent;
  let fixture: ComponentFixture<MyClientLivraisonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyClientLivraisonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyClientLivraisonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
