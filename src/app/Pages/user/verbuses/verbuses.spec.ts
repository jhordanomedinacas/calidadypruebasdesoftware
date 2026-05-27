import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Verbuses } from './verbuses';

describe('Verbuses', () => {
  let component: Verbuses;
  let fixture: ComponentFixture<Verbuses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verbuses],
    }).compileComponents();

    fixture = TestBed.createComponent(Verbuses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
