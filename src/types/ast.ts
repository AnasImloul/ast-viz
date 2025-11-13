// AST Node structure from Ohm.js parse tree
export interface ASTNode {
  name: string;
  children: ASTNode[];
  value?: string;
  interval?: {
    startIdx: number;
    endIdx: number;
  };
}

// Tree structure for react-d3-tree
export interface TreeNode {
  name: string;
  attributes?: {
    value?: string;
    type?: string;
  };
  interval?: {
    startIdx: number;
    endIdx: number;
  };
  children?: TreeNode[];
}

// Grammar example structure
export interface GrammarExample {
  id: string;
  name: string;
  grammar: string;
  sampleInput: string;
  description: string;
}

// Parse result
export interface ParseResult {
  success: boolean;
  ast?: ASTNode;
  error?: string;
}

