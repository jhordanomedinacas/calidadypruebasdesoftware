import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Preguntasfrecuentes } from './preguntasfrecuentes';

describe('Preguntasfrecuentes', () => {
  let component: Preguntasfrecuentes;
  let fixture: ComponentFixture<Preguntasfrecuentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preguntasfrecuentes],
    }).compileComponents();

    fixture = TestBed.createComponent(Preguntasfrecuentes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
