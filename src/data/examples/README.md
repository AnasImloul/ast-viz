# Grammar Examples

This directory contains modular grammar examples for the AST Visualizer.

## Structure

Each example is separated into its own file for better maintainability and clarity:

```
examples/
├── index.ts              # Main export file
├── arithmetic.ts         # Arithmetic calculator
├── json.ts              # JSON parser
├── simple-lang.ts       # Simple programming language
├── url.ts               # URL parser
├── csv.ts               # CSV parser
├── email.ts             # Email address validator
├── sql.ts               # SQL SELECT statements
├── markdown.ts          # Markdown parser
├── html.ts              # HTML/XML tag parser
├── boolean-logic.ts     # Boolean logic expressions
└── math-functions.ts    # Mathematical functions
```

## Usage

### Import all examples

```typescript
import { exampleGrammars } from '@/data/examples';
```

### Import specific examples

```typescript
import { arithmeticExample, jsonExample } from '@/data/examples';
```

### Import from individual files

```typescript
import { arithmeticExample } from '@/data/examples/arithmetic';
```

## Adding New Examples

1. Create a new file in this directory (e.g., `new-example.ts`)
2. Export a constant of type `GrammarExample`
3. Import and export it in `index.ts`
4. Update this README

Example:

```typescript
// new-example.ts
import type { GrammarExample } from '@/types/ast';

export const newExample: GrammarExample = {
  id: 'new-example',
  name: 'New Example',
  description: 'Description of the new example',
  grammar: `Grammar { ... }`,
  sampleInput: 'sample input',
};
```

Then in `index.ts`:

```typescript
import { newExample } from './new-example';

export { newExample };

export const exampleGrammars: GrammarExample[] = [
  // ... existing examples
  newExample,
];
```

## Benefits of This Structure

- **Maintainability**: Each example is isolated in its own file
- **Clarity**: Easy to find and modify specific examples
- **Scalability**: Simple to add new examples without cluttering a single file
- **Backward Compatibility**: Existing imports still work via the re-export pattern
- **Type Safety**: Full TypeScript support maintained across all files



