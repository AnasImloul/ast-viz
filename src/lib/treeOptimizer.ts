import type { ASTNode, TreeNode } from '@/types/ast';

/**
 * Tree Optimizer - Simplifies AST for better visualization
 * 
 * PURPOSE:
 * - Remove Ohm.js internal nodes (_iter, _terminal) that clutter the tree
 * - Remove lexical nodes (lowercase rules) that are parsing artifacts
 * - Collapse linear chains of single-child nodes for readability
 * 
 * STRATEGY:
 * 1. Clean: Remove Ohm.js framework nodes (_iter, _terminal)
 * 2. Filter Lexical: Remove all lowercase lexical nodes (tokens) from structure
 * 3. Collapse: Merge single-child chains (A → B → C becomes "A → B → C")
 */

/**
 * Check if a node is a lowercase (lexical) rule
 * 
 * Ohm.js convention:
 * - Uppercase rules (e.g., Expression, Statement) = structural nodes, shown in AST
 * - Lowercase rules (e.g., identifier, number, listOf) = lexical tokens, hidden from AST
 */
function isLexicalNode(node: ASTNode): boolean {
  return /^[a-z]/.test(node.name);
}

/**
 * Clean AST by removing Ohm.js framework nodes
 * 
 * Removes:
 * - _iter nodes: Iteration wrappers (e.g., for `rule+` or `rule*`)
 * - _terminal nodes: Literal punctuation from grammar definitions
 * 
 * Strategy: Flatten _iter children into parent, skip _terminal entirely
 */
function cleanAST(node: ASTNode): ASTNode | null {
  // Skip Ohm.js internal nodes that should be removed
  if (node.name === '_iter' || node.name === '_terminal') {
    return null;
  }
  
  // Recursively clean children and flatten _iter nodes
  const cleanedChildren: ASTNode[] = [];
  
  for (const child of node.children) {
    if (child.name === '_iter') {
      // Flatten _iter: add its children directly to parent
      for (const iterChild of child.children) {
        const cleanedIterChild = cleanAST(iterChild);
        if (cleanedIterChild) {
          cleanedChildren.push(cleanedIterChild);
        }
      }
    } else {
      // Regular child: clean recursively
      const cleaned = cleanAST(child);
      if (cleaned) {
        cleanedChildren.push(cleaned);
      }
    }
  }
  
  return {
    ...node,
    children: cleanedChildren,
  };
}

/**
 * Remove all lexical (lowercase) nodes from the AST
 * 
 * This is a pre-processing step that simplifies the tree structure by:
 * - Removing intermediate lexical nodes (e.g., listOf, nonemptyListOf)
 * - Promoting their structural children up to the parent
 * 
 * Example transformation:
 * Before: File → Row → listOf → nonemptyListOf → [Field, Field, Field]
 * After:  File → Row → [Field, Field, Field]
 * 
 * Strategy:
 * - If node is lexical: flatten it by returning its children
 * - If node is structural: keep it and recursively filter its children
 * - Lexical leaf nodes are removed entirely (they have no structural value)
 */
function removeLexicalNodes(node: ASTNode): ASTNode[] {
  // If this is a lexical node, we want to skip it and return its processed children
  if (isLexicalNode(node)) {
    // Recursively process all children and flatten them
    const result: ASTNode[] = [];
    for (const child of node.children) {
      result.push(...removeLexicalNodes(child));
    }
    return result;
  }
  
  // This is a structural node - keep it but filter its children
  const filteredChildren: ASTNode[] = [];
  for (const child of node.children) {
    filteredChildren.push(...removeLexicalNodes(child));
  }
  
  return [{
    ...node,
    children: filteredChildren,
  }];
}

/**
 * Determine if a node starts a linear path that should be collapsed
 * 
 * A linear path is a chain of single-child structural nodes like:
 * - Short: Program → Statement (2 nodes)
 * - Long: Program → Statement → Expression → Term (4 nodes)
 * - With branching end: Domain → Domain_withSubdomain (where second node has multiple children)
 * 
 * We collapse these to: "Program → Statement" or "Program → ... → Term" or "Domain → Domain_withSubdomain"
 * This reduces visual clutter and makes the tree more readable.
 * 
 * We ALLOW collapsing for:
 * - Any node with exactly one child (even if that child branches)
 * - This enables clean 2-node chains like "Domain → Domain_withSubdomain"
 * - The collapseLinearPath function handles stopping at branching nodes
 */
function shouldCollapse(node: ASTNode): boolean {
  // Collapse if we have exactly one child (creates a 2+ node chain)
  // The child can have any number of children - collapseLinearPath will handle it
  return node.children.length === 1;
}

/**
 * Collapse a linear path into a single node with combined name
 * 
 * Example:
 * Input:  Program → Statement → Expression → Term (each with single child)
 * Output: "Program → Statement → Expression → Term" (single collapsed node)
 * 
 * This makes deep single-child chains more readable and less cluttered.
 */
function collapseLinearPath(node: ASTNode): { name: string; finalNode: ASTNode } {
  const path: string[] = [node.name];
  let current = node;
  
  // Traverse down the single-child chain
  while (current.children.length === 1) {
    const child = current.children[0];
    path.push(child.name);
    current = child;
  }
  
  const collapsedName = path.join(' → ');
  
  return {
    name: collapsedName,
    finalNode: current,
  };
}

/**
 * Recursively optimize children nodes
 */
function optimizeChildren(children: ASTNode[]): TreeNode[] {
  return children.map(child => optimizeTree(child));
}

/**
 * Convert AST to optimized Tree structure for visualization
 * 
 * OPTIMIZATION STEPS:
 * 1. Clean: Remove Ohm.js internal nodes (_iter, _terminal)
 * 2. Filter Lexical: Remove all lowercase lexical nodes (pre-processing)
 * 3. Collapse: Merge single-child chains for readability
 * 
 * RESULT: A simplified tree that's easier to visualize and understand
 * 
 * Example:
 * Before: File → Row → listOf → nonemptyListOf → [Field, Field, Field]
 * After:  File → Row → [Field, Field, Field]
 */
export function optimizeTree(ast: ASTNode): TreeNode {
  // Step 1: Clean Ohm.js framework nodes
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Step 2: Remove all lexical nodes (pre-processing)
  // This elegantly handles chains like: File → Row → listOf → nonemptyListOf → [Fields]
  // By removing listOf and nonemptyListOf, we get: File → Row → [Fields]
  const lexicalFiltered = removeLexicalNodes(cleaned);
  
  // Handle edge case: if root was lexical or everything was filtered
  if (lexicalFiltered.length === 0) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Work with the first filtered node (should be the structural root)
  const node = lexicalFiltered[0];
  
  // Leaf node: return as terminal
  if (node.children.length === 0) {
    return {
      name: node.name,
      attributes: {
        value: node.value,
        type: 'terminal',
      },
      interval: node.interval,
    };
  }
  
  // Step 3: Check if this starts a collapsible linear path
  if (shouldCollapse(node)) {
    const { name, finalNode } = collapseLinearPath(node);
    
    // Collapsed path ends at leaf (terminal node)
    if (finalNode.children.length === 0) {
      return {
        name,
        attributes: {
          value: finalNode.value,
          type: 'collapsed-terminal',
        },
        interval: finalNode.interval,
      };
    }
    
    // Collapsed path has children: recursively optimize them
    return {
      name,
      attributes: {
        value: finalNode.value,
        type: 'collapsed',
      },
      interval: finalNode.interval,
      children: optimizeChildren(finalNode.children),
    };
  }
  
  // Branching node - optimize children
  return {
    name: node.name,
    attributes: {
      // Truncate long values for readability
      value: node.value && node.value.length < 50 ? node.value : undefined,
      type: 'branch',
    },
    interval: node.interval,
    children: optimizeChildren(node.children),
  };
}

/**
 * Convert AST to non-optimized tree (for comparison/debugging)
 * 
 * Provides a "raw" view of the AST with minimal processing:
 * - Removes Ohm.js internal nodes (_iter, _terminal)
 * - Removes lexical nodes (for consistency with optimized view)
 * - NO collapsing of single-child chains
 * 
 * Use this when you want to see the full structure without optimization.
 */
export function astToTree(ast: ASTNode): TreeNode {
  // Clean Ohm.js internal nodes
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Remove lexical nodes (same as optimized tree for consistency)
  const lexicalFiltered = removeLexicalNodes(cleaned);
  
  if (lexicalFiltered.length === 0) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  const node = lexicalFiltered[0];
  
  // Recursively convert children (no collapsing, just structure)
  const convertedChildren = node.children.map(child => astToTree(child));
  
  return {
    name: node.name,
    attributes: {
      value: node.value,
      type: node.children.length === 0 ? 'terminal' : 'non-terminal',
    },
    interval: node.interval,
    children: convertedChildren,
  };
}

