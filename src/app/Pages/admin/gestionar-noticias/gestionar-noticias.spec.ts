import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarNoticias } from './gestionar-noticias';

describe('GestionarNoticias', () => {
  let component: GestionarNoticias;
  let fixture: ComponentFixture<GestionarNoticias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarNoticias],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarNoticias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
