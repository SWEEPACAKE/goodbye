import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Emmanuel } from './emmanuel';

describe('Emmanuel', () => {
  let component: Emmanuel;
  let fixture: ComponentFixture<Emmanuel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Emmanuel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Emmanuel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
