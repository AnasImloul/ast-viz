import type { GrammarExample } from '@/types/ast';

export const sqlExample: GrammarExample = {
  id: 'sql-select',
  name: 'SQL SELECT Statement',
  description: 'Parse basic SQL SELECT statements with WHERE clause',
  grammar: `SQL {
  SelectStatement
    = "SELECT" Columns "FROM" TableName WhereClause?

  Columns
    = "*"  -- star
    | listOf<ColumnName, ",">  -- list

  ColumnName
    = identifier

  TableName
    = identifier

  WhereClause
    = "WHERE" Condition

  Condition
    = identifier Operator Value

  Operator
    = "=" | "!=" | ">" | "<" | ">=" | "<="

  Value
    = StringLiteral  -- string
    | number  -- number

  StringLiteral
    = "'" (~"'" any)* "'"

  identifier
    = letter (letter | digit | "_")*

  number
    = digit+

  space
    += "\\n" | "\\t"
}`,
  sampleInput: `SELECT name, age, email FROM users WHERE age > 18`,
};



