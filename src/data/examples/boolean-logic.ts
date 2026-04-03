import type { GrammarExample } from '@/types/ast';

export const booleanLogicExample: GrammarExample = {
  id: 'boolean-logic',
  name: 'Boolean Logic Parser',
  description: 'Parse boolean expressions with AND, OR, NOT operators',
  grammar: `BooleanLogic {
  Expression
    = OrExpr

  OrExpr
    = OrExpr OrOp AndExpr  -- or
    | AndExpr

  AndExpr
    = AndExpr AndOp NotExpr  -- and
    | NotExpr

  NotExpr
    = NotOp PrimaryExpr  -- not
    | PrimaryExpr

  PrimaryExpr
    = "(" Expression ")"  -- paren
    | "true"  -- true
    | "false"  -- false
    | Variable  -- var

  OrOp
    = "OR"

  AndOp
    = "AND"

  NotOp
    = "NOT"

  Variable
    = ~keyword identifier

  keyword
    = ("true" | "false" | "OR" | "AND" | "NOT") ~identifierPart

  identifier
    = identifierStart identifierPart*

  identifierStart
    = letter

  identifierPart
    = letter | digit
}`,
  sampleInput: '(x OR y) AND NOT z OR true',
};



