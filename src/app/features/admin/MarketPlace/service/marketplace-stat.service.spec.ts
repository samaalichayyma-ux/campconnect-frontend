import { TestBed } from '@angular/core/testing';

import { MarketplaceStatService } from './marketplace-stat.service';

describe('MarketplaceStatService', () => {
  let service: MarketplaceStatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarketplaceStatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
