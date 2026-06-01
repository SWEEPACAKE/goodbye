import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Thomas } from './thomas';

describe('Thomas', () => {
  let component: Thomas;
  let fixture: ComponentFixture<Thomas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Thomas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Thomas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
