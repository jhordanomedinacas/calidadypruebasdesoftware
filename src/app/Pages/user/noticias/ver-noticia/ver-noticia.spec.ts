import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerNoticia } from './ver-noticia';

describe('VerNoticia', () => {
  let component: VerNoticia;
  let fixture: ComponentFixture<VerNoticia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerNoticia],
    }).compileComponents();

    fixture = TestBed.createComponent(VerNoticia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
