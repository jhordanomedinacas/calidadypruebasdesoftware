import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Canalatencion } from './canalatencion';

describe('Canalatencion', () => {
  let component: Canalatencion;
  let fixture: ComponentFixture<Canalatencion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Canalatencion],
    }).compileComponents();

    fixture = TestBed.createComponent(Canalatencion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
