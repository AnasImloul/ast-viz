#!/usr/bin/env tsx

/**
 * TypeScript Grammar Test Suite
 * 
 * This script validates that the TypeScript grammar example:
 * 1. Compiles successfully without errors
 * 2. Parses its sample program correctly
 * 3. Handles all TypeScript features in the sample
 * 
 * Run: npm test:grammar
 */

import * as ohm from 'ohm-js';
import { typescriptExample } from './src/data/examples/typescript.ts';

console.log('🧪 TypeScript Grammar Test Suite');
console.log('='.repeat(70));
console.log();

const grammarText = typescriptExample.grammar;
const sampleInput = typescriptExample.sampleInput;

console.log('📦 Loaded TypeScript example');
console.log(`   Grammar: ${grammarText.split('\n').length} lines`);
console.log(`   Sample: ${sampleInput.split('\n').length} lines`);
console.log();

// Test 1: Grammar Compilation
console.log('📝 Test 1: Compiling Grammar...');
let grammar;
try {
  grammar = ohm.grammar(grammarText);
  console.log('✅ Grammar compiled successfully!');
  
  const rules = Object.keys(grammar.rules).filter(r => !r.startsWith('_'));
  console.log(`   Rules: ${rules.length} total`);
  console.log();
} catch (error: any) {
  console.error('❌ Grammar compilation FAILED!');
  console.error();
  console.error('Error:', error.message);
  console.error();
  process.exit(1);
}

// Test 2: Parse Sample Program
console.log('📝 Test 2: Parsing Sample Program...');
const matchResult = grammar.match(sampleInput);

if (!matchResult.succeeded()) {
  console.error('❌ Sample program FAILED to parse!');
  console.error();
  console.error(matchResult.message);
  console.error();
  
  // Show context
  const lines = sampleInput.split('\n');
  const errorMatch = matchResult.message.match(/Line (\d+)/);
  if (errorMatch) {
    const lineNum = parseInt(errorMatch[1]) - 1;
    console.error('Context:');
    const start = Math.max(0, lineNum - 2);
    const end = Math.min(lines.length, lineNum + 3);
    for (let i = start; i < end; i++) {
      const marker = i === lineNum ? ' ← ERROR' : '';
      console.error(`  ${(i + 1).toString().padStart(3)}: ${lines[i]}${marker}`);
    }
  }
  console.error();
  process.exit(1);
}

console.log('✅ Sample program parsed successfully!');
console.log();

// Test 3: Individual Feature Tests
console.log('📝 Test 3: Testing Individual TypeScript Features...');
console.log();

const featureTests = [
  {
    name: 'Import statement',
    input: 'import { Component } from "react";',
    rule: 'Statement'
  },
  {
    name: 'Interface declaration',
    input: 'interface User { name: string; }',
    rule: 'Statement'
  },
  {
    name: 'Array type annotation',
    input: 'const users: User[];',
    rule: 'VariableDeclarator'
  },
  {
    name: 'Generic class',
    input: 'class Manager<T> { }',
    rule: 'Statement'
  },
  {
    name: 'Class with extends',
    input: 'class Manager extends Component { }',
    rule: 'Statement'
  },
  {
    name: 'Constructor',
    input: 'constructor() { }',
    rule: 'ConstructorDeclaration'
  },
  {
    name: 'this.property assignment',
    input: 'this.users = [];',
    rule: 'Expression'
  },
  {
    name: 'Async method',
    input: 'async addUser() { }',
    rule: 'MethodDeclaration'
  },
  {
    name: 'Arrow function with types',
    input: 'const fn = (x: number): string => "test";',
    rule: 'Statement'
  },
  {
    name: 'Async arrow function',
    input: 'const fn = async (x: number) => x;',
    rule: 'Statement'
  },
  {
    name: 'Object destructuring',
    input: 'const { name, age } = obj;',
    rule: 'Statement'
  },
  {
    name: 'Array destructuring',
    input: 'const [first, second] = arr;',
    rule: 'Statement'
  },
  {
    name: 'Spread operator in array',
    input: 'const arr = [...items, item];',
    rule: 'Statement'
  },
  {
    name: 'Member access chain',
    input: 'user.name',
    rule: 'Expression'
  },
  {
    name: 'Array index access',
    input: 'users[0]',
    rule: 'Expression'
  },
  {
    name: 'Method call',
    input: 'console.log(msg);',
    rule: 'Expression'
  },
  {
    name: 'For loop',
    input: 'for (let i = 0; i < 10; i++) { }',
    rule: 'Statement'
  },
  {
    name: 'Return statement',
    input: 'return this.users[id];',
    rule: 'Statement'
  },
  {
    name: 'Export function',
    input: 'export function test() { }',
    rule: 'Statement'
  },
  {
    name: 'Union type',
    input: 'const val: string | number;',
    rule: 'VariableDeclarator'
  },
  {
    name: 'void type',
    input: 'function test(): void { }',
    rule: 'Statement'
  },
];

let passed = 0;
let failed = 0;
const failures: Array<{name: string, input: string, error: string}> = [];

featureTests.forEach(test => {
  try {
    const result = grammar.match(test.input, test.rule);
    if (result.succeeded()) {
      console.log(`   ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`   ❌ ${test.name}`);
      failed++;
      failures.push({
        name: test.name,
        input: test.input,
        error: result.message.split('\n')[0]
      });
    }
  } catch (e: any) {
    console.log(`   ❌ ${test.name}`);
    failed++;
    failures.push({
      name: test.name,
      input: test.input,
      error: e.message
    });
  }
});

console.log();
console.log('='.repeat(70));
console.log(`📊 Test Results: ${passed}/${featureTests.length} features passed`);
console.log('='.repeat(70));
console.log();

if (failed > 0) {
  console.log('❌ Failed Features:');
  failures.forEach(failure => {
    console.log();
    console.log(`   Feature: ${failure.name}`);
    console.log(`   Input: ${failure.input}`);
    console.log(`   Error: ${failure.error}`);
  });
  console.log();
  process.exit(1);
}

// Final Summary
console.log('🎉 ✨ ALL TESTS PASSED! ✨');
console.log();
console.log('Summary:');
console.log(`  ✓ Grammar compiles successfully`);
console.log(`  ✓ Sample program parses correctly`);
console.log(`  ✓ All ${featureTests.length} TypeScript features work`);
console.log();
console.log('The TypeScript grammar is working correctly!');
console.log();

process.exit(0);



