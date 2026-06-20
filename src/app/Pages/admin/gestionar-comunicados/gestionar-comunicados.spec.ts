import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarComunicados } from './gestionar-comunicados';

describe('GestionarComunicados', () => {
  let component: GestionarComunicados;
  let fixture: ComponentFixture<GestionarComunicados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarComunicados],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarComunicados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
