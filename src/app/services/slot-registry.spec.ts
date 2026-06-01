import { TestBed } from '@angular/core/testing';

import { SlotRegistry } from './slot-registry';

describe('SlotRegistry', () => {
  let service: SlotRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlotRegistry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
