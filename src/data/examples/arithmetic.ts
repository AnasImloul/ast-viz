import type { GrammarExample } from '@/types/ast';

export const arithmeticExample: GrammarExample = {
  id: 'arithmetic',
  name: 'Arithmetic Calculator',
  description: 'A simple arithmetic expression parser with support for +, -, *, /, and parentheses',
  grammar: `Arithmetic {
  Expr
    = AddExpr

  AddExpr
    = AddExpr "+" MulExpr  -- plus
    | AddExpr "-" MulExpr  -- minus
    | MulExpr

  MulExpr
    = MulExpr "*" PriExpr  -- times
    | MulExpr "/" PriExpr  -- divide
    | PriExpr

  PriExpr
    = "(" Expr ")"  -- paren
    | number

  number
    = digit+ ("." digit+)?
}`,
  sampleInput: '(10 + 5) * 3 - 8 / 2',
};



