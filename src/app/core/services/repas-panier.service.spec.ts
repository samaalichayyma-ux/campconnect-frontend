import { TestBed } from '@angular/core/testing';

import { RepasPanierService } from './repas-panier.service';

describe('RepasPanierService', () => {
  let service: RepasPanierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RepasPanierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
