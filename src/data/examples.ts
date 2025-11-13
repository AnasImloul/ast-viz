import type { GrammarExample } from '@/types/ast';

export const exampleGrammars: GrammarExample[] = [
  {
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
  },
  {
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
    | "true"   -- true
    | "false"  -- false
    | "null"   -- null

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
    = "\\"" character* "\\""

  character
    = ~("\\"" | "\\\\") any  -- nonEscaped
    | "\\\\" any             -- escaped

  Number
    = "-"? digit+ ("." digit+)?

  space
    += "\\n" | "\\r" | "\\t"
}`,
    sampleInput: `{
  "name": "John",
  "age": 30,
  "active": true,
  "hobbies": ["reading", "coding"]
}`,
  },
  {
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
  },
  {
    id: 'url-parser',
    name: 'URL Parser',
    description: 'Parse and validate URLs with protocol, domain, path, query parameters, and fragments',
    grammar: `URLParser {
  URL
    = Protocol "://" Domain Port? Path? Query? Fragment?

  Protocol
    = "https" | "http" | "ftp" | "ws" | "wss"

  Domain
    = subdomain+ "." topLevelDomain  -- withSubdomain
    | topLevelDomain                 -- simple

  subdomain
    = (alnum | "-")+

  topLevelDomain
    = letter+

  Port
    = ":" PortNumber
   
  PortNumber
    = digit+

  Path
    = "/" Segment*

  Segment
    = (alnum | "-" | "_" | "." | "~")+  -- chars
    | "/" Segment                        -- nested

  Query
    = "?" QueryPair ("&" QueryPair)*

  QueryPair
    = key "=" value

  key
    = (alnum | "-" | "_")+

  value
    = (alnum | "-" | "_" | "%" | "." | "~")*

  Fragment
    = "#" FragmentContent

  FragmentContent
    = (alnum | "-" | "_" | "/")*
}`,
    sampleInput: 'https://example.com:8080/path/to/page?name=John&age=30#section',
  },
  {
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
  },
  {
    id: 'email-parser',
    name: 'Email Address Parser',
    description: 'Validate and parse email addresses with local part and domain',
    grammar: `EmailParser {
  Email
    = LocalPart "@" Domain

  LocalPart
    = LocalChar+ ("." LocalChar+)*

  LocalChar
    = alnum | "_" | "-" | "+"

  Domain
    = Subdomain ("." Subdomain)* "." TopLevel

  Subdomain
    = (alnum | "-")+

  TopLevel
    = letter letter+
}`,
    sampleInput: 'john.doe+test@example.company.com',
  },
  {
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
  },
  {
    id: 'markdown-parser',
    name: 'Markdown Parser',
    description: 'Parse basic Markdown syntax including headings, bold, italic, and links',
    grammar: `Markdown {
  Document
    = Block*

  Block
    = Heading
    | Paragraph
    | BlankLine

  Heading
    = HeadingMarker space+ text nl

  HeadingMarker
    = "###" | "##" | "#"

  Paragraph
    = Inline+ nl

  BlankLine
    = nl

  Inline
    = Bold
    | Italic
    | Link
    | PlainText

  Bold
    = "**" (~"**" any)+ "**"

  Italic
    = "*" (~"*" any)+ "*"

  Link
    = "[" LinkText "]" "(" LinkUrl ")"

  LinkText
    = (~"]" any)+

  LinkUrl
    = (~")" any)+

  PlainText
    = (~(nl | "*" | "[") any)+

  text
    = (~nl any)+

  nl
    = "\\n"

  space
    := " " | "\\t"
}`,
    sampleInput: `# Welcome to Markdown
This is a **bold** statement and *italic* too.
Check out [this link](https://example.com) for more.

## Subheading
More text here.
`,
  },
  {
    id: 'html-tag-parser',
    name: 'HTML/XML Tag Parser',
    description: 'Parse HTML/XML tags with attributes and nested content',
    grammar: `HTMLParser {
  Document
    = Element+

  Element
    = SelfClosingTag  -- selfClosing
    | OpenTag Content* CloseTag  -- withContent

  OpenTag
    = openBracket TagName (Attribute)* closeBracket

  CloseTag
    = openBracket "/" TagName closeBracket

  SelfClosingTag
    = openBracket TagName (Attribute)* "/" closeBracket

  openBracket
    = "<" space*

  closeBracket
    = space* ">"

  TagName
    = tagNameChars

  tagNameChars
    = letter (letter | digit | "-")*

  Attribute
    = AttributeName "=" AttributeValue

  AttributeName
    = attributeNameChars

  attributeNameChars
    = letter (letter | digit | "-")*

  AttributeValue
    = "\\"" attributeValueChars "\\""

  attributeValueChars
    = (~"\\"" any)*

  Content
    = Element  -- element
    | Text  -- text

  Text
    = (~"<" any)+

  space
    := " " | "\\t" | "\\n"
}`,
    sampleInput: `<div class="container">
  <h1>Title</h1>
  <img src="photo.jpg" alt="Photo" />
  <p>Some text content</p>
</div>`,
  },
  {
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
  },
  {
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
  },
];

