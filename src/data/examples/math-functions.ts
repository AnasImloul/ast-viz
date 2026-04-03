import type { GrammarExample } from '@/types/ast';

export const mathFunctionsExample: GrammarExample = {
  id: 'math-functions',
  name: 'Mathematical Functions',
  description: 'Parse mathematical function notation like sin, cos, log, sqrt',
  grammar: `MathFunctions {
  Expression
    = AddExpr

  AddExpr
    = AddExpr "+" MulExpr  -- plus
    | AddExpr "-" MulExpr  -- minus
    | MulExpr

  MulExpr
    = MulExpr "*" PowerExpr  -- times
    | MulExpr "/" PowerExpr  -- divide
    | PowerExpr

  PowerExpr
    = PrimaryExpr "^" PowerExpr  -- power
    | PrimaryExpr

  PrimaryExpr
    = FunctionCall  -- function
    | number  -- number
    | identifier  -- variable
    | "(" Expression ")"  -- paren

  FunctionCall
    = FunctionName "(" listOf<Expression, ","> ")"

  FunctionName
    = "sin" | "cos" | "tan" | "log" | "ln" | "sqrt" | "abs" | "exp" | "atan2"

  identifier
    = letter (letter | digit)*

  number
    = digit+ ("." digit+)?
}`,
  sampleInput: 'sin(x) + cos(2 * y) - sqrt(z^2 + 1)',
};



