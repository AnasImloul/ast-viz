import type { ASTNode, TreeNode } from '@/types/ast';

/**
 * Clean AST by removing unnecessary nodes like _iter and _terminal wrappers
 */
function cleanAST(node: ASTNode): ASTNode | null {
  // Remove ALL _iter nodes (they're just iteration wrappers)
  if (node.name === '_iter') {
    // If it has children, flatten them up to parent
    return null;
  }
  
  // Skip _terminal nodes - use their value in the parent
  if (node.name === '_terminal') {
    return null;
  }
  
  // Recursively clean children and flatten
  const cleanedChildren: ASTNode[] = [];
  
  for (const child of node.children) {
    const cleaned = cleanAST(child);
    
    // If child was an _iter, its children are now null, so we need to collect them before cleaning
    if (child.name === '_iter') {
      // Flatten _iter children directly
      for (const iterChild of child.children) {
        const cleanedIterChild = cleanAST(iterChild);
        if (cleanedIterChild) {
          cleanedChildren.push(cleanedIterChild);
        }
      }
    } else if (cleaned) {
      cleanedChildren.push(cleaned);
    }
  }
  
  return {
    ...node,
    children: cleanedChildren,
  };
}

/**
 * Skip through lexical nodes to find the next structural node in a single-child chain
 */
function skipLexicalNodes(node: ASTNode): ASTNode {
  let current = node;
  
  // Skip through any lexical (lowercase) nodes with single children
  while (current.children.length === 1 && isLexicalNode(current)) {
    current = current.children[0];
  }
  
  return current;
}

/**
 * Check if a node is part of a linear path (single child chain, should be collapsed)
 */
function shouldCollapse(node: ASTNode): boolean {
  // Stop collapsing if:
  // - Node has no children (leaf)
  // - Node has multiple children (branching point)
  if (node.children.length !== 1) {
    return false;
  }
  
  // Skip through any lexical nodes to see if there's a structural node continuing the chain
  const nextStructural = skipLexicalNodes(node.children[0]);
  
  // If after skipping lexical nodes we find a structural node with a single child, continue collapsing
  // If we find a leaf or branching node, stop
  if (nextStructural.children.length === 0 || nextStructural.children.length > 1) {
    return false;
  }
  
  // If the next node (after skipping lexical) is structural, continue the chain
  if (!isLexicalNode(nextStructural)) {
    return true;
  }
  
  return false;
}

/**
 * Collapse linear paths in the tree, skipping lexical nodes
 * A linear path is a sequence of structural nodes, possibly separated by lexical nodes
 * This simplifies the tree by collapsing chains into a single node
 */
function collapseLinearPath(node: ASTNode): { name: string; finalNode: ASTNode } {
  const path: string[] = [node.name];
  let current = node;
  
  // Traverse down while we have single children, skipping lexical nodes
  while (current.children.length === 1) {
    const child = current.children[0];
    
    // Skip through lexical nodes
    const nextStructural = skipLexicalNodes(child);
    
    // If we've reached the end (leaf or branching), stop
    if (nextStructural.children.length === 0 || nextStructural.children.length > 1) {
      current = nextStructural;
      if (!isLexicalNode(nextStructural)) {
        path.push(nextStructural.name);
      }
      break;
    }
    
    // If the next structural node is also a single-child structural node, add it to the path
    if (!isLexicalNode(nextStructural)) {
      path.push(nextStructural.name);
      current = nextStructural;
    } else {
      // We've hit a lexical leaf, stop here
      current = nextStructural;
      break;
    }
  }
  
  return {
    name: path.join(' → '),
    finalNode: current,
  };
}

/**
 * Check if a node is a lowercase (lexical) rule
 */
function isLexicalNode(node: ASTNode): boolean {
  return /^[a-z]/.test(node.name);
}

/**
 * Filter and optimize children, hiding lowercase lexical nodes
 */
function optimizeChildren(children: ASTNode[]): TreeNode[] {
  const optimized: TreeNode[] = [];
  
  for (const child of children) {
    // Skip lowercase leaf nodes (they're lexical tokens, just formatting)
    if (isLexicalNode(child) && child.children.length === 0) {
      continue;
    }
    
    optimized.push(optimizeTree(child));
  }
  
  return optimized;
}

/**
 * Convert AST to optimized Tree structure for visualization
 */
export function optimizeTree(ast: ASTNode): TreeNode {
  // Clean the AST first
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // If this is a leaf node, return it as-is
  if (cleaned.children.length === 0) {
    return {
      name: cleaned.name,
      attributes: {
        value: cleaned.value,
        type: 'terminal',
      },
      interval: cleaned.interval,
    };
  }
  
  // If this starts a linear path, collapse it
  if (shouldCollapse(cleaned)) {
    const { name, finalNode } = collapseLinearPath(cleaned);
    
    // If the final node is a leaf, just return the collapsed path
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
    
    // If the final node has children, recursively optimize them (filtering lowercase)
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
  
  // Node has multiple children, keep it and optimize each child (filtering lowercase)
  return {
    name: cleaned.name,
    attributes: {
      value: cleaned.value && cleaned.value.length < 50 ? cleaned.value : undefined,
      type: 'branch',
    },
    interval: cleaned.interval,
    children: optimizeChildren(cleaned.children),
  };
}

/**
 * Convert AST to non-optimized tree (for comparison/debugging)
 * Still filters out lowercase lexical rules for consistency
 */
export function astToTree(ast: ASTNode): TreeNode {
  // Clean the AST first
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Filter out lowercase lexical leaf nodes
  const filteredChildren = cleaned.children
    .filter(child => !(isLexicalNode(child) && child.children.length === 0))
    .map(child => astToTree(child));
  
  return {
    name: cleaned.name,
    attributes: {
      value: cleaned.value,
      type: cleaned.children.length === 0 ? 'terminal' : 'non-terminal',
    },
    interval: cleaned.interval,
    children: filteredChildren,
  };
}

