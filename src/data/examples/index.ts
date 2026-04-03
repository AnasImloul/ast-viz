import type { GrammarExample } from '@/types/ast';

// Import all examples
import { arithmeticExample } from './arithmetic';
import { jsonExample } from './json';
import { simpleLangExample } from './simple-lang';
import { urlExample } from './url';
import { csvExample } from './csv';
import { emailExample } from './email';
import { sqlExample } from './sql';
import { markdownExample } from './markdown';
import { htmlExample } from './html';
import { booleanLogicExample } from './boolean-logic';
import { mathFunctionsExample } from './math-functions';
import { typescriptExample } from './typescript';

// Export individual examples for direct imports
export {
  arithmeticExample,
  jsonExample,
  simpleLangExample,
  urlExample,
  csvExample,
  emailExample,
  sqlExample,
  markdownExample,
  htmlExample,
  booleanLogicExample,
  mathFunctionsExample,
  typescriptExample,
};

// Export all examples as an array (maintains backward compatibility)
export const exampleGrammars: GrammarExample[] = [
  arithmeticExample,
  jsonExample,
  simpleLangExample,
  urlExample,
  csvExample,
  emailExample,
  sqlExample,
  markdownExample,
  htmlExample,
  booleanLogicExample,
  mathFunctionsExample,
  typescriptExample,
];

