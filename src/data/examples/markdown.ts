import type { GrammarExample } from '@/types/ast';

export const markdownExample: GrammarExample = {
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
    = HeadingMarker Text nl

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
    = "**" BoldText "**"
    
  BoldText
    = (~"**" any)+

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

  Text
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
};



