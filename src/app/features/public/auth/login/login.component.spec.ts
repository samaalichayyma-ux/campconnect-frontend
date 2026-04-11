import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authServiceMock = {
    login: jasmine.createSpy('login').and.returnValue(
      of({
        message: 'Connexion réussie',
        token: 'fake-token',
        role: 'CLIENT',
        requires2FA: false
      })
    ),
    verifyLogin2FA: jasmine.createSpy('verifyLogin2FA').and.returnValue(
      of({
        message: 'Connexion réussie',
        token: 'fake-token',
        role: 'CLIENT'
      })
    ),
    googleLogin: jasmine.createSpy('googleLogin').and.returnValue(
      of({
        message: 'Connexion Google réussie',
        token: 'fake-token',
        role: 'CLIENT'
      })
    ),
    redirectByRole: jasmine.createSpy('redirectByRole')
  };

  const routerMock = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});