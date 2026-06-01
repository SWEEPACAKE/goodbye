import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hugo } from './hugo';

describe('Hugo', () => {
  let component: Hugo;
  let fixture: ComponentFixture<Hugo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hugo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hugo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
