import { TestBed } from '@angular/core/testing';

import { NoticiaUsuario } from './noticia-usuario';

describe('NoticiaUsuario', () => {
  let service: NoticiaUsuario;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoticiaUsuario);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
