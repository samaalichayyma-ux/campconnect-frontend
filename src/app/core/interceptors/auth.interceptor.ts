import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getValidToken();
  const shouldAttachToken = !!token && isBackendApiRequest(req.url) && !isPublicReadRequest(req.method, req.url);

  if (shouldAttachToken) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq).pipe(
      catchError((error) => {
        if (shouldClearAuthOnError(req.url, error?.status)) {
          clearAuthStorage();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};

function isBackendApiRequest(url: string): boolean {
  const path = extractPathname(url);
  if (path.startsWith('/api/')) {
    return true;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

function isPublicReadRequest(method: string, url: string): boolean {
  if (method !== 'GET') {
    return false;
  }

  const path = extractPathname(url);

  return (
    path === '/api/forums' ||
    path.startsWith('/api/forums/') ||
    path.startsWith('/api/publications/forum/')
  );
}

function extractPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function getValidToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  // Quick JWT format check
  const parts = token.split('.');
  if (parts.length !== 3) {
    localStorage.removeItem('token');
    return null;
  }

  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalizedBase64 = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      '='
    );
    const payloadJson = atob(normalizedBase64);
    const payload = JSON.parse(payloadJson) as { exp?: number };

    // Auto-clean expired token
    if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token');
      return null;
    }
  } catch {
    // Keep token if payload cannot be decoded, avoid accidental logout.
    return token;
  }

  return token;
}

function shouldClearAuthOnError(url: string, status: number): boolean {
  // Only an unauthorized response from our backend API invalidates session.
  return status === 401 && isBackendApiRequest(url);
}

function clearAuthStorage(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('nom');
  localStorage.removeItem('email');
  localStorage.removeItem('returnUrl');
}
