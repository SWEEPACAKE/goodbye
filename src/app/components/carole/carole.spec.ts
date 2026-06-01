import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Carole } from './carole';

describe('Carole', () => {
  let component: Carole;
  let fixture: ComponentFixture<Carole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Carole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
