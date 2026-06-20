import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarTickets } from './gestionar-tickets';

describe('GestionarTickets', () => {
  let component: GestionarTickets;
  let fixture: ComponentFixture<GestionarTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarTickets],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
