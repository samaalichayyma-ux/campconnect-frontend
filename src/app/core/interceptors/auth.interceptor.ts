import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔍 Auth interceptor called for:', req.url);
  const token = localStorage.getItem('token');
  console.log('📦 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

  if (token) {
    console.log('✅ Adding Authorization header to request');
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  console.log('⚠️ No token found, request will go without Authorization header');
  return next(req);
};