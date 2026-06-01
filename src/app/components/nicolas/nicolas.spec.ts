import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nicolas } from './nicolas';

describe('Nicolas', () => {
  let component: Nicolas;
  let fixture: ComponentFixture<Nicolas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nicolas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nicolas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
