import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentaireAdminListComponent } from './commentaire-admin-list.component';

describe('CommentaireAdminListComponent', () => {
  let component: CommentaireAdminListComponent;
  let fixture: ComponentFixture<CommentaireAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentaireAdminListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentaireAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
