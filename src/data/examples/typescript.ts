import type { GrammarExample } from '@/types/ast';

export const typescriptExample: GrammarExample = {
  id: 'typescript',
  name: 'TypeScript Parser',
  description: 'A simplified TypeScript parser with basic classes, interfaces, and type annotations',
  grammar: `TypeScript {
  Program
    = Statement*

  Statement
    = InterfaceDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | VariableStatement
    | IfStatement
    | ForStatement
    | ReturnStatement
    | ExpressionStatement

  // Interface
  InterfaceDeclaration
    = "interface" Identifier "{" Property* "}"

  Property
    = Identifier TypeAnnotation ";"

  // Class
  ClassDeclaration
    = "class" Identifier "{" ClassMember* "}"

  ClassMember
    = MethodDeclaration
    | PropertyDeclaration

  PropertyDeclaration
    = Identifier TypeAnnotation? ";"

  MethodDeclaration
    = Identifier "(" ParameterList? ")" TypeAnnotation? Block

  // Function
  FunctionDeclaration
    = "function" Identifier "(" ParameterList? ")" TypeAnnotation? Block

  ParameterList
    = nonemptyListOf<Parameter, ",">

  Parameter
    = Identifier TypeAnnotation?

  // Variable
  VariableStatement
    = VariableKeyword Identifier TypeAnnotation? "=" Expression ";"

  VariableKeyword
    = "const" | "let" | "var"

  // Control Flow
  IfStatement
    = "if" "(" Expression ")" Block ("else" Block)?

  ForStatement
    = "for" "(" VariableKeyword Identifier "=" Expression ";" Expression ";" Expression ")" Block

  ReturnStatement
    = "return" Expression? ";"

  ExpressionStatement
    = Expression ";"

  Block
    = "{" Statement* "}"

  // Expressions
  Expression
    = AssignmentExpression

  AssignmentExpression
    = (MemberExpression | Identifier) "=" AssignmentExpression  -- assign
    | BinaryExpression

  BinaryExpression
    = BinaryExpression BinaryOp PrimaryExpression  -- binary
    | PrimaryExpression

  BinaryOp
    = "+" | "-" | "*" | "/" | "==" | "!=" | "<" | ">" | "<=" | ">="

  PrimaryExpression
    = CallExpression  -- call
    | MemberExpression  -- member
    | NumberLiteral  -- number
    | StringLiteral  -- string
    | "this"  -- this
    | Identifier  -- identifier
    | "(" Expression ")"  -- paren

  CallExpression
    = (MemberExpression | Identifier) "(" ArgumentList? ")"

  MemberExpression
    = (MemberExpression | Identifier) "." Identifier  -- dot
    | (MemberExpression | Identifier) "[" Expression "]"  -- bracket

  ArgumentList
    = nonemptyListOf<Expression, ",">

  NumberLiteral
    = digit+ ("." digit+)?

  StringLiteral
    = "\\"" stringChar* "\\""

  stringChar
    = ~("\\"" | "\\\\") any  -- nonEscaped
    | "\\\\" any  -- escaped

  // Type Annotations
  TypeAnnotation
    = ":" Type

  Type
    = "string"  -- string
    | "number"  -- number
    | "boolean"  -- boolean
    | "void"  -- void
    | Identifier  -- named

  // Identifiers
  Identifier
    = ~keyword identifierName

  identifierName
    = identifierStart identifierPart*

  identifierStart
    = letter | "_"

  identifierPart
    = alnum | "_"

  keyword
    = ("interface" | "class" | "function" | "const" | "let" | "var"
      | "if" | "else" | "for" | "return"
      | "string" | "number" | "boolean" | "void") ~identifierPart

  space
    += singleLineComment

  singleLineComment
    = "//" (~"\\n" any)* "\\n"
}`,
  sampleInput: `interface User {
  name: string;
  age: number;
}

class UserManager {
  count: number;
  
  addUser(user: User): void {
    const name = user.name;
    this.count = this.count + 1;
  }
}

function greet(name: string): string {
  return "Hello";
}

let x = 10;
let y = 20;

if (x < y) {
  let result = x + y;
}`,
};

