# AST Visualizer

A powerful, interactive web application for visualizing Abstract Syntax Trees (ASTs) with a no-code visual grammar builder powered by [Ohm.js](https://ohmjs.org/).

## 🌟 Features

### Visual Grammar Builder
- **No-Code Interface**: Build complex grammars visually without writing Ohm.js syntax
- **Drag & Drop**: Reorder rules effortlessly with intuitive drag-and-drop
- **Token Composer**: Visual chip-based system for building rule alternatives
- **Rule Templates**: Quick-start with pre-built patterns for common use cases
- **Collapsible Rules**: Keep your workspace organized by collapsing rules you're not editing
- **Two-Way Sync**: Seamlessly switch between visual builder and code editor
- **Smart Validation**: Real-time grammar validation with helpful error messages

### AST Visualization
- **Interactive Tree View**: Explore your parsed AST with an interactive node-link diagram
- **Tree Optimization**: Toggle between full tree and optimized views
  - Automatic collapsing of single-child chains
  - Hide lexical (lowercase) rules for cleaner structure
  - Real-time compression metrics
- **Interval Highlighting**: Click any AST node to highlight its corresponding text in the source
- **Node Inspector**: View detailed information about selected nodes
- **Zoom & Pan**: Navigate large trees with smooth zoom and pan controls

### Syntax Highlighting
- **Grammar-Aware**: Syntax highlighting that adapts to your custom grammar
- **Real-Time**: Instant visual feedback as you type
- **Semantic Tokens**: Intelligent highlighting of complete tokens (strings, numbers, identifiers)

### Grammar Analysis
- **Dependency Graph**: Visualize rule dependencies with an auto-layouted graph
- **Smart Suggestions**: AI-powered recommendations for improving your grammar
- **Complexity Analysis**: Understand which rules are simple, medium, or complex
- **Left Recursion Detection**: Automatically identify potential issues

### Built-In Examples
Ready-to-use grammar examples for:
- JSON Parser
- Simple Programming Language
- Arithmetic Expressions
- CSV Parser
- URL Parser
- Email Parser
- SQL Queries
- Markdown
- HTML Parser
- Boolean Logic
- Math Functions
- CSS Selectors
- INI Config Files

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.19+ or v22.12+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ast-viz

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Usage

### Creating a Grammar

1. **Visual Builder** (`/grammar/builder`)
   - Click "Add Rule" to create a new grammar rule
   - Use the alternative composer to define rule patterns
   - Drag chips to reorder tokens
   - Add case labels for alternatives with inconsistent arity
   - Collapse rules to keep your workspace tidy

2. **Code Editor** (`/grammar/code`)
   - Write Ohm.js grammar syntax directly
   - Syntax highlighting and line numbers included
   - Changes sync automatically with the visual builder

3. **Load an Example**
   - Select from the dropdown to load pre-built grammars
   - Modify and experiment with existing examples

### Visualizing the AST

1. Navigate to the **Visualize** page
2. Enter your sample input text in the program text editor
3. Click **Parse** to generate the AST
4. Interact with the tree:
   - Click nodes to see details and highlight source intervals
   - Toggle "Optimize Tree" to simplify the visualization
   - Use "Fit to Screen" to auto-zoom
   - Switch to fullscreen for a larger view

### Understanding Rule Types

- **Uppercase rules** (e.g., `Expression`, `Statement`): Structural/syntactic rules that appear in the AST
- **Lowercase rules** (e.g., `identifier`, `number`): Lexical/token rules that are hidden in optimized view

## 🏗️ Project Structure

```
ast-viz/
├── src/
│   ├── components/          # React components
│   │   ├── GrammarBuilder.tsx       # Visual grammar builder
│   │   ├── AlternativeComposer.tsx  # Token chip composer
│   │   ├── TreeView.tsx             # AST visualization
│   │   ├── SyntaxHighlightedEditor.tsx  # Syntax-highlighted input
│   │   ├── RuleDependencyGraph.tsx  # Rule dependency visualization
│   │   └── ui/                      # Reusable UI components
│   ├── context/
│   │   └── GrammarContext.tsx       # Global state management
│   ├── lib/
│   │   ├── parser.ts                # Grammar parsing & AST generation
│   │   ├── treeOptimizer.ts         # AST optimization logic
│   │   └── grammarAnalysis.ts       # Grammar analysis utilities
│   ├── pages/                       # Route components
│   ├── data/
│   │   ├── examples.ts              # Pre-built grammar examples
│   │   └── ruleTemplates.ts         # Rule templates
│   └── types/                       # TypeScript type definitions
├── public/                          # Static assets
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Routing**: React Router 7
- **Styling**: Tailwind CSS + shadcn/ui components
- **Grammar Engine**: Ohm.js
- **Tree Visualization**: Cytoscape.js
- **Graph Visualization**: ReactFlow + Dagre
- **Code Editor**: CodeMirror 6
- **Drag & Drop**: dnd-kit
- **Animation**: Framer Motion
- **Build Tool**: Vite

## 🎨 Key Concepts

### Ohm.js Conventions
- Rules starting with **uppercase** are syntactic (structural)
- Rules starting with **lowercase** are lexical (terminals)
- Use `=` for defining rules, `+=` to extend, `:=` to override
- Case labels (`-- labelName`) handle alternatives with different arity

### AST Optimization
The optimizer automatically:
- Collapses single-child chains of structural nodes
- Skips over lexical nodes to continue structural chains
- Hides lowercase (lexical) rules in optimized view
- Preserves interval information for source mapping

### Deterministic IDs
All rules and alternatives use deterministic IDs:
- Format: `rule-{grammarName}-{ruleName}`
- Ensures collapsed state persists across route changes
- Unique across different grammars

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Ohm.js](https://ohmjs.org/) - The amazing grammar parsing library
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible UI components
- [Cytoscape.js](https://js.cytoscape.org/) - Graph visualization library

## 📧 Support

For questions or issues, please open an issue on GitHub.

---

**Made with ❤️ for developers and educators**
