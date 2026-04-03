import type { GrammarExample } from '@/types/ast';

export const htmlExample: GrammarExample = {
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
};



