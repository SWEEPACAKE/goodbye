import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nadege } from './nadege';

describe('Nadege', () => {
  let component: Nadege;
  let fixture: ComponentFixture<Nadege>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nadege]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nadege);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
