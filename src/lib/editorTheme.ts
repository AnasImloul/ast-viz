import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

const bg = '#020817';
const gutterBg = '#0a1120';
const selection = '#1e3a5f';
const activeLine = '#0d1b2a';
const cursor = '#93c5fd';
const fg = '#e2e8f0';
const fgMuted = '#64748b';
const border = '#1e293b';

const darkEditorTheme = EditorView.theme(
  {
    '&': {
      color: fg,
      backgroundColor: bg,
    },
    '.cm-content': {
      caretColor: cursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: cursor,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: selection,
      },
    '.cm-panels': {
      backgroundColor: gutterBg,
      color: fg,
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: `1px solid ${border}`,
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: `1px solid ${border}`,
    },
    '.cm-searchMatch': {
      backgroundColor: '#2563eb33',
      outline: '1px solid #2563eb66',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#2563eb55',
    },
    '.cm-activeLine': {
      backgroundColor: activeLine,
    },
    '.cm-selectionMatch': {
      backgroundColor: '#1e3a5f44',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#2563eb44',
      outline: '1px solid #2563eb66',
    },
    '.cm-gutters': {
      backgroundColor: gutterBg,
      color: fgMuted,
      border: 'none',
      borderRight: `1px solid ${border}`,
    },
    '.cm-activeLineGutter': {
      backgroundColor: activeLine,
      color: fg,
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: fgMuted,
    },
    '.cm-tooltip': {
      border: `1px solid ${border}`,
      backgroundColor: gutterBg,
      color: fg,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: gutterBg,
      borderBottomColor: gutterBg,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: selection,
        color: fg,
      },
    },
  },
  { dark: true }
);

const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c084fc' },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#e2e8f0' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#93c5fd' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#fb923c' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#e2e8f0' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#fbbf24' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: '#22d3ee' },
  { tag: [tags.meta, tags.comment], color: '#64748b' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#64748b', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#93c5fd' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#fb923c' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#86efac' },
  { tag: tags.invalid, color: '#ef4444' },
]);

export const darkTheme: Extension = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];
