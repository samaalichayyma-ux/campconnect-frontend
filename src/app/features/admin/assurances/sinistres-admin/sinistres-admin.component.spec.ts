import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinistresAdminComponent } from './sinistres-admin.component';

describe('SinistresAdminComponent', () => {
  let component: SinistresAdminComponent;
  let fixture: ComponentFixture<SinistresAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SinistresAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinistresAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
