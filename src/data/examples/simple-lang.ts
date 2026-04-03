import type { GrammarExample } from '@/types/ast';

export const simpleLangExample: GrammarExample = {
  id: 'simple-lang',
  name: 'Simple Programming Language',
  description: 'A basic programming language with variables, assignments, and expressions',
  grammar: `SimpleLang {
  Program
    = Statement*

  Statement
    = Assignment  -- assignment
    | Expression ";"  -- expression

  Assignment
    = identifier "=" Expression ";"

  Expression
    = Term (("+" | "-") Term)*

  Term
    = Factor (("*" | "/") Factor)*

  Factor
    = number  -- number
    | string  -- string
    | identifier  -- identifier
    | "(" Expression ")"  -- paren

  string
    = "\\"" character* "\\""

  character
    = ~("\\"" | "\\\\") any  -- nonEscaped
    | "\\\\" any             -- escaped

  identifier
    = letter (letter | digit | "_")*

  number
    = digit+ ("." digit+)?

  space
    += "//" (~"\\n" any)* "\\n"  -- comment
}`,
  sampleInput: `x = 10;
message = "Hello, World!";
name = "Alice";
// This is a comment
y = x * 2 + 5;
result = (x + y) / 3;
greeting = "Welcome to AST Viz";`,
};



