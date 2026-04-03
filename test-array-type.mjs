import * as ohm from 'ohm-js';

const grammar = String.raw`TypeScript {
  Program
    = Statement*

  Statement
    = VariableStatement
    | ClassDeclaration

  // Simplified class for testing
  ClassDeclaration
    = "class" Identifier TypeParameters? "{" ClassMember* "}"

  TypeParameters
    = "<" Identifier ">"

  ClassMember
    = PropertyDeclaration

  PropertyDeclaration
    = Modifier* Identifier TypeAnnotation? ";"

  Modifier
    = "private" | "public"

  VariableStatement
    = "const" Identifier "=" Expression ";"

  Expression
    = Identifier

  // No string literals

  // Type Annotations
  TypeAnnotation
    = ":" Type

  Type
    = PrimaryType

  PrimaryType
    = BaseType "[" "]"  -- array
    | Identifier TypeArguments?  -- named

  BaseType
    = Identifier TypeArguments?

  TypeArguments
    = "<" Identifier ">"

  Identifier
    = letter (letter | digit)*

  space
    += "//" (~"\\n" any)* "\\n"  -- comment
    | "/" "*" (~("*" "/") any)* "*" "/"  -- multiLineComment
}`;

// Test with the problematic line
const testInput = `class UserManager<T> {
  private users: User[];
}`;

console.log('Testing simplified TypeScript grammar with array type...\n');
console.log('Input:');
console.log(testInput);
console.log();

try {
  const g = ohm.grammar(grammar);
  const match = g.match(testInput);
  
  if (match.succeeded()) {
    console.log('✅ SUCCESS! Array type User[] parsed correctly!');
  } else {
    console.log('❌ FAILED!');
    console.log(match.message);
  }
} catch (e) {
  console.log('❌ Grammar error:', e.message);
}

