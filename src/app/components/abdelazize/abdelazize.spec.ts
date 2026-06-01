import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Abdelazize } from './abdelazize';

describe('Abdelazize', () => {
  let component: Abdelazize;
  let fixture: ComponentFixture<Abdelazize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Abdelazize]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Abdelazize);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
