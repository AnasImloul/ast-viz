import * as ohm from 'ohm-js';

const grammar = String.raw`TypeScript {
  Program = Statement*
  
  Statement = ExpressionStatement
  
  ExpressionStatement = Expression ";"
  
  Expression = AssignmentExpression
  
  AssignmentExpression = ConditionalExpression ("=" AssignmentExpression)?
  
  ConditionalExpression = MemberExpression
  
  MemberExpression
    = MemberExpression "." Identifier  -- dot
    | PrimaryExpression  -- primary
  
  PrimaryExpression
    = ArrayLiteral
    | "this"
  
  ArrayLiteral = "[" "]"
  
  Identifier = letter+
  
  space += " " | "\n" | "\t"
}`;

const testInput = `this.users = [];`;

console.log('Testing: this.users = [];\n');

try {
  const g = ohm.grammar(grammar);
  const match = g.match(testInput);
  
  if (match.succeeded()) {
    console.log('✅ SUCCESS! "this.users = [];" parsed correctly!');
  } else {
    console.log('❌ FAILED!');
    console.log(match.message);
  }
} catch (e) {
  console.log('❌ Grammar error:', e.message);
}



