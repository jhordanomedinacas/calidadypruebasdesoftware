import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarLineas } from './gestionar-lineas';

describe('GestionarLineas', () => {
  let component: GestionarLineas;
  let fixture: ComponentFixture<GestionarLineas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarLineas],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarLineas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
