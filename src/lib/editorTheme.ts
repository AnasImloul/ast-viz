import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

const darkBg = '#0e0c0a';
const darkSurface = '#141210';
const darkSelection = '#3a2518';
const darkActiveLine = '#161412';
const darkCursor = '#e8613a';
const darkFg = '#e8e6e0';
const darkFgMuted = '#8a8880';
const darkBorder = '#242430';

const darkEditorTheme = EditorView.theme(
  {
    '&': {
      color: darkFg,
      backgroundColor: darkBg,
    },
    '.cm-content': {
      caretColor: darkCursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: darkCursor,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: darkSelection,
      },
    '.cm-panels': {
      backgroundColor: darkSurface,
      color: darkFg,
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: `1px solid ${darkBorder}`,
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: `1px solid ${darkBorder}`,
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(232, 97, 58, 0.2)',
      outline: '1px solid rgba(232, 97, 58, 0.4)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(232, 97, 58, 0.35)',
    },
    '.cm-activeLine': {
      backgroundColor: darkActiveLine,
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(232, 97, 58, 0.12)',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(232, 97, 58, 0.25)',
      outline: '1px solid rgba(232, 97, 58, 0.4)',
    },
    '.cm-gutters': {
      backgroundColor: darkSurface,
      color: darkFgMuted,
      border: 'none',
      borderRight: `1px solid ${darkBorder}`,
    },
    '.cm-activeLineGutter': {
      backgroundColor: darkActiveLine,
      color: darkFg,
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: darkFgMuted,
    },
    '.cm-tooltip': {
      border: `1px solid ${darkBorder}`,
      backgroundColor: darkSurface,
      color: darkFg,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: darkSurface,
      borderBottomColor: darkSurface,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: darkSelection,
        color: darkFg,
      },
    },
  },
  { dark: true }
);

const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#e8613a' },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#e8e6e0' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#7a9ab5' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#e8613a' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#e8e6e0' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#c9964c' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: '#7a9ab5' },
  { tag: [tags.meta, tags.comment], color: '#8a8880' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#8a8880', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#e8613a' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#c9964c' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#4caf82' },
  { tag: tags.invalid, color: '#e05555' },
]);

export const darkTheme: Extension = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];

const lightBg = '#f7f5f0';
const lightSurface = '#f0ede6';
const lightSelection = '#e8d5cc';
const lightActiveLine = '#f0ede6';
const lightCursor = '#c9501f';
const lightFg = '#1c1a16';
const lightFgMuted = '#7a756d';
const lightBorder = '#d5d0c6';

const lightEditorTheme = EditorView.theme(
  {
    '&': {
      color: lightFg,
      backgroundColor: lightBg,
    },
    '.cm-content': {
      caretColor: lightCursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: lightCursor,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: lightSelection,
      },
    '.cm-panels': {
      backgroundColor: lightSurface,
      color: lightFg,
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: `1px solid ${lightBorder}`,
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: `1px solid ${lightBorder}`,
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(201, 80, 31, 0.15)',
      outline: '1px solid rgba(201, 80, 31, 0.35)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(201, 80, 31, 0.25)',
    },
    '.cm-activeLine': {
      backgroundColor: lightActiveLine,
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(201, 80, 31, 0.1)',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(201, 80, 31, 0.2)',
      outline: '1px solid rgba(201, 80, 31, 0.35)',
    },
    '.cm-gutters': {
      backgroundColor: lightSurface,
      color: lightFgMuted,
      border: 'none',
      borderRight: `1px solid ${lightBorder}`,
    },
    '.cm-activeLineGutter': {
      backgroundColor: lightActiveLine,
      color: lightFg,
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: lightFgMuted,
    },
    '.cm-tooltip': {
      border: `1px solid ${lightBorder}`,
      backgroundColor: lightSurface,
      color: lightFg,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: lightSurface,
      borderBottomColor: lightSurface,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: lightSelection,
        color: lightFg,
      },
    },
  },
  { dark: false }
);

const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c9501f' },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#1c1a16' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#3a65d4' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#c9501f' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#1c1a16' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#a07030' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: '#3a65d4' },
  { tag: [tags.meta, tags.comment], color: '#7a756d' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#7a756d', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#c9501f' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#a07030' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#2d8a5e' },
  { tag: tags.invalid, color: '#c03030' },
]);

export const lightTheme: Extension = [
  lightEditorTheme,
  syntaxHighlighting(lightHighlightStyle),
];
