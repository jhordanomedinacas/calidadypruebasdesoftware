import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Verestaciones } from './verestaciones';

describe('Verestaciones', () => {
  let component: Verestaciones;
  let fixture: ComponentFixture<Verestaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verestaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Verestaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
