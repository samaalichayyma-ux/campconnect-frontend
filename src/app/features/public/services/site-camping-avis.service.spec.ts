import { TestBed } from '@angular/core/testing';

import { SiteCampingAvisService } from './site-camping-avis.service';

describe('SiteCampingAvisService', () => {
  let service: SiteCampingAvisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteCampingAvisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
