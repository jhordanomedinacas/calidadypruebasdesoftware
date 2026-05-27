import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutasFavoritas } from './rutas-favoritas';

describe('RutasFavoritas', () => {
  let component: RutasFavoritas;
  let fixture: ComponentFixture<RutasFavoritas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutasFavoritas],
    }).compileComponents();

    fixture = TestBed.createComponent(RutasFavoritas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
