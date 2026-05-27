import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Todas } from './todas';

describe('Todas', () => {
  let component: Todas;
  let fixture: ComponentFixture<Todas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Todas],
    }).compileComponents();

    fixture = TestBed.createComponent(Todas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
