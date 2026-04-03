import type { GrammarExample } from '@/types/ast';

export const csvExample: GrammarExample = {
  id: 'csv-parser',
  name: 'CSV Parser',
  description: 'Parse CSV (Comma-Separated Values) files with quoted fields and escape sequences',
  grammar: `CSV {
  File
    = Row (nl Row)*

  Row
    = listOf<Field, ",">

  Field
    = quotedField  -- quoted
    | unquotedField  -- unquoted

  quotedField
    = "\\"" quotedContent* "\\""

  quotedContent
    = ~("\\"" | "\\n") any  -- regular
    | "\\"\\""              -- escapedQuote

  unquotedField
    = (~("," | "\\n" | "\\"") any)+

  nl
    = "\\r\\n" | "\\n"

  space
    := " " | "\\t"
}`,
  sampleInput: `name,age,city
John Doe,30,New York
Alice,25,London
Bob,35,San Francisco
Charlie Chuck Brown,40,Chicago`,
};



