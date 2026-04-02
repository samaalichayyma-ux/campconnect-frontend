import { TestBed } from '@angular/core/testing';

import { CommandeRepasService } from './commande-repas.service';

describe('CommandeRepasService', () => {
  let service: CommandeRepasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandeRepasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
