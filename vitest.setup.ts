import { applyJsdomExtended } from '@whenessel/jsdom-extended';

// Применяем расширения jsdom для всех тестов
if (typeof window !== 'undefined') {
  applyJsdomExtended(window);
}

