import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dylan } from './dylan';

describe('Dylan', () => {
  let component: Dylan;
  let fixture: ComponentFixture<Dylan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dylan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dylan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
