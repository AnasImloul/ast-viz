// Pre-defined rule templates for quick grammar building

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'number' | 'string' | 'identifier' | 'expression' | 'list' | 'other';
  ruleName: string;
  alternatives: string[];
  icon: string;
}

export const ruleTemplates: RuleTemplate[] = [
  // Numbers
  {
    id: 'integer',
    name: 'Integer',
    description: 'Whole numbers (e.g., 42, -17, 0)',
    category: 'number',
    ruleName: 'Integer',
    alternatives: ['-? digit+'],
    icon: '🔢',
  },
  {
    id: 'decimal',
    name: 'Decimal Number',
    description: 'Floating point numbers (e.g., 3.14, -0.5)',
    category: 'number',
    ruleName: 'Number',
    alternatives: ['-? digit+ ("." digit+)?'],
    icon: '🔢',
  },
  {
    id: 'hexadecimal',
    name: 'Hexadecimal',
    description: 'Hex numbers (e.g., 0xFF, 0x1A2B)',
    category: 'number',
    ruleName: 'HexNumber',
    alternatives: ['"0x" hexDigit+', '"0X" hexDigit+'],
    icon: '🔢',
  },

  // Strings
  {
    id: 'string-double',
    name: 'String (Double Quotes)',
    description: 'Text in double quotes (e.g., "hello")',
    category: 'string',
    ruleName: 'String',
    alternatives: ['"\\\"" stringChar* "\\""'],
    icon: '📝',
  },
  {
    id: 'string-single',
    name: 'String (Single Quotes)',
    description: "Text in single quotes (e.g., 'hello')",
    category: 'string',
    ruleName: 'String',
    alternatives: ['\'\\\'\' stringChar* "\\\'"'],
    icon: '📝',
  },
  {
    id: 'string-char',
    name: 'String Character',
    description: 'Character inside a string with escape support',
    category: 'string',
    ruleName: 'stringChar',
    alternatives: ['~("\\"" | "\\\\") any', '"\\\\" any'],
    icon: '📝',
  },

  // Identifiers
  {
    id: 'identifier-basic',
    name: 'Identifier',
    description: 'Variable/function names (e.g., myVar, count_1)',
    category: 'identifier',
    ruleName: 'Identifier',
    alternatives: ['letter (letter | digit | "_")*'],
    icon: '🏷️',
  },
  {
    id: 'identifier-camel',
    name: 'Camel Case Identifier',
    description: 'camelCase naming (e.g., myVariable)',
    category: 'identifier',
    ruleName: 'CamelId',
    alternatives: ['lower (letter | digit)*'],
    icon: '🏷️',
  },
  {
    id: 'identifier-pascal',
    name: 'Pascal Case Identifier',
    description: 'PascalCase naming (e.g., MyClass)',
    category: 'identifier',
    ruleName: 'PascalId',
    alternatives: ['upper (letter | digit)*'],
    icon: '🏷️',
  },

  // Expressions
  {
    id: 'binary-expr',
    name: 'Binary Expression',
    description: 'Expression with binary operators (e.g., a + b)',
    category: 'expression',
    ruleName: 'BinaryExpr',
    alternatives: ['Term (Operator Term)*'],
    icon: '➕',
  },
  {
    id: 'paren-expr',
    name: 'Parenthesized Expression',
    description: 'Expression in parentheses (e.g., (a + b))',
    category: 'expression',
    ruleName: 'ParenExpr',
    alternatives: ['"(" Expr ")"'],
    icon: '➕',
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Binary operators (+, -, *, /)',
    category: 'expression',
    ruleName: 'Operator',
    alternatives: ['"+"', '"-"', '"*"', '"/"'],
    icon: '➕',
  },

  // Lists
  {
    id: 'list-comma',
    name: 'Comma-Separated List',
    description: 'Items separated by commas (e.g., a, b, c)',
    category: 'list',
    ruleName: 'List',
    alternatives: ['Item ("," Item)*'],
    icon: '📋',
  },
  {
    id: 'list-nonempty',
    name: 'Non-Empty List',
    description: 'At least one item required',
    category: 'list',
    ruleName: 'NonEmptyList',
    alternatives: ['nonemptyListOf<Item, ",">'],
    icon: '📋',
  },
  {
    id: 'list-optional',
    name: 'Optional List',
    description: 'List that can be empty',
    category: 'list',
    ruleName: 'OptionalList',
    alternatives: ['listOf<Item, ",">'],
    icon: '📋',
  },

  // Other
  {
    id: 'whitespace',
    name: 'Whitespace',
    description: 'Spaces, tabs, newlines',
    category: 'other',
    ruleName: 'ws',
    alternatives: ['space*'],
    icon: '⎵',
  },
  {
    id: 'comment-line',
    name: 'Line Comment',
    description: 'Single line comment (e.g., // comment)',
    category: 'other',
    ruleName: 'lineComment',
    alternatives: ['"//" (~"\\n" any)* "\\n"'],
    icon: '💬',
  },
  {
    id: 'comment-block',
    name: 'Block Comment',
    description: 'Multi-line comment (e.g., /* comment */)',
    category: 'other',
    ruleName: 'blockComment',
    alternatives: ['"/*" (~"*/" any)* "*/"'],
    icon: '💬',
  },
  {
    id: 'boolean',
    name: 'Boolean',
    description: 'True or false values',
    category: 'other',
    ruleName: 'Boolean',
    alternatives: ['"true"', '"false"'],
    icon: '✓',
  },
  {
    id: 'keyword',
    name: 'Keyword',
    description: 'Reserved language keyword',
    category: 'other',
    ruleName: 'Keyword',
    alternatives: ['"if"', '"else"', '"while"', '"for"', '"return"'],
    icon: '🔑',
  },
];

export const templatesByCategory = {
  number: ruleTemplates.filter(t => t.category === 'number'),
  string: ruleTemplates.filter(t => t.category === 'string'),
  identifier: ruleTemplates.filter(t => t.category === 'identifier'),
  expression: ruleTemplates.filter(t => t.category === 'expression'),
  list: ruleTemplates.filter(t => t.category === 'list'),
  other: ruleTemplates.filter(t => t.category === 'other'),
};

export function getRuleTemplate(id: string): RuleTemplate | undefined {
  return ruleTemplates.find(t => t.id === id);
}

