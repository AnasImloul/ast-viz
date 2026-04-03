import type { GrammarExample } from '@/types/ast';

export const jsonExample: GrammarExample = {
  id: 'json',
  name: 'Simple JSON Parser',
  description: 'A JSON parser that handles objects, arrays, strings, numbers, booleans, and null',
  grammar: `SimpleJSON {
  JSON
    = Value

  Value
    = Object
    | Array
    | String
    | Number
    | Boolean
    | Null

  Object
    = "{" Properties? "}"

  Properties
    = Property ("," Property)*

  Property
    = String ":" Value

  Array
    = "[" Elements? "]"

  Elements
    = Value ("," Value)*

  String
    = "\\"" StringContent "\\""

  StringContent
    = character*

  character
    = ~("\\"" | "\\\\") any  -- nonEscaped
    | "\\\\" any  -- escaped

  Number
    = "-" ? digit+ ("." digit+)?

  Boolean
    = "true"
    | "false"

  Null
    = "null"

  space
    += "\\n"
    | "\\r"
    | "\\t"
}`,
  sampleInput: `{
  "name": "John",
  "age": 30,
  "active": true,
  "hobbies": ["reading", "coding"]
}`,
};



