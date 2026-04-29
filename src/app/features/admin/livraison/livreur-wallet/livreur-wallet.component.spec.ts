import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreurWalletComponent } from './livreur-wallet.component';

describe('LivreurWalletComponent', () => {
  let component: LivreurWalletComponent;
  let fixture: ComponentFixture<LivreurWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivreurWalletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivreurWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
