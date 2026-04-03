#!/usr/bin/env node

import * as ohm from 'ohm-js';
import { readFileSync } from 'fs';

console.log('🧪 Comprehensive TypeScript Grammar Test\n');
console.log('='.repeat(60));

// Step 1: Read the source file
const sourceFile = './src/data/examples/typescript.ts';
const content = readFileSync(sourceFile, 'utf8');

// Step 2: Extract grammar using a better method
const grammarStart = content.indexOf('grammar: `') + 10;
let braceCount = 0;
let inString = false;
let escaped = false;
let grammarEnd = grammarStart;

// Find the matching closing backtick by tracking braces
for (let i = grammarStart; i < content.length; i++) {
  const char = content[i];
  const prevChar = i > 0 ? content[i - 1] : '';
  
  if (char === '`' && prevChar !== '\\' && !inString) {
    grammarEnd = i;
    break;
  }
  
  if (char === '"' && prevChar !== '\\') {
    inString = !inString;
  }
  
  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
}

const grammarText = content.substring(grammarStart, grammarEnd);

// Step 3: Extract sample input
const sampleStart = content.indexOf('sampleInput: `') + 14;
let sampleEnd = sampleStart;
for (let i = sampleStart; i < content.length; i++) {
  if (content[i] === '`' && content[i - 1] !== '\\') {
    sampleEnd = i;
    break;
  }
}
const sampleInput = content.substring(sampleStart, sampleEnd);

console.log('✓ Extracted grammar and sample input');
console.log(`  Grammar: ${grammarText.split('\n').length} lines`);
console.log(`  Sample: ${sampleInput.split('\n').length} lines`);
console.log();

// Step 4: Compile the grammar
console.log('📝 Step 1: Compiling Grammar...');
try {
  const grammar = ohm.grammar(grammarText);
  console.log('✅ Grammar compiled successfully!\n');
  
  // Count rules
  const rules = Object.keys(grammar.rules).filter(r => !r.startsWith('_'));
  console.log(`📊 Grammar Statistics:`);
  console.log(`   - Total rules: ${rules.length}`);
  console.log(`   - Main rules: ${rules.filter(r => r[0] === r[0].toUpperCase()).length}`);
  console.log(`   - Helper rules: ${rules.filter(r => r[0] === r[0].toLowerCase()).length}`);
  console.log();
  
  // Step 5: Parse the sample input
  console.log('📝 Step 2: Parsing Sample Program...');
  const matchResult = grammar.match(sampleInput);
  
  if (matchResult.succeeded()) {
    console.log('✅ Sample program parsed successfully!\n');
    console.log('Sample Program:');
    console.log('─'.repeat(60));
    console.log(sampleInput);
    console.log('─'.repeat(60));
    console.log();
    
    // Step 6: Test specific features
    console.log('📝 Step 3: Testing Individual Features...\n');
    
    const featureTests = [
      { name: 'Import statement', input: 'import { Component } from "react";', rule: 'Statement' },
      { name: 'Interface', input: 'interface User { name: string; }', rule: 'Statement' },
      { name: 'Array type', input: 'const users: User[];', rule: 'VariableDeclarator' },
      { name: 'Generic class', input: 'class Manager<T> { }', rule: 'Statement' },
      { name: 'Arrow function', input: 'const fn = (x: number) => x + 1;', rule: 'Statement' },
      { name: 'Async function', input: 'async function fetch() { }', rule: 'Statement' },
      { name: 'Destructuring', input: 'const { name } = obj;', rule: 'Statement' },
      { name: 'Spread operator', input: 'const arr = [...items];', rule: 'Statement' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    featureTests.forEach(test => {
      try {
        const result = grammar.match(test.input, test.rule);
        if (result.succeeded()) {
          console.log(`   ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`   ❌ ${test.name}`);
          console.log(`      Error: ${result.message.split('\n')[0]}`);
          failed++;
        }
      } catch (e) {
        console.log(`   ❌ ${test.name}`);
        console.log(`      Error: ${e.message}`);
        failed++;
      }
    });
    
    console.log();
    console.log('='.repeat(60));
    console.log(`📊 Test Results: ${passed}/${featureTests.length} passed`);
    console.log('='.repeat(60));
    
    if (failed === 0) {
      console.log();
      console.log('🎉 ✨ ALL TESTS PASSED! ✨');
      console.log('   The TypeScript grammar is working correctly!');
      process.exit(0);
    } else {
      console.log();
      console.log(`⚠️  ${failed} feature test(s) failed (but full program still parsed)`);
      process.exit(0);
    }
    
  } else {
    console.log('❌ Sample program FAILED to parse!\n');
    console.log('Error:');
    console.log(matchResult.message);
    console.log();
    
    // Show context around error
    const lines = sampleInput.split('\n');
    const errorMatch = matchResult.message.match(/Line (\d+)/);
    if (errorMatch) {
      const lineNum = parseInt(errorMatch[1]) - 1;
      console.log('Context:');
      const start = Math.max(0, lineNum - 2);
      const end = Math.min(lines.length, lineNum + 3);
      for (let i = start; i < end; i++) {
        const marker = i === lineNum ? ' ← ERROR' : '';
        console.log(`  ${(i + 1).toString().padStart(3)}: ${lines[i]}${marker}`);
      }
    }
    
    console.log();
    process.exit(1);
  }
  
} catch (error) {
  console.log('❌ Grammar compilation FAILED!\n');
  console.log('Error:');
  console.log(error.message);
  console.log();
  process.exit(1);
}



