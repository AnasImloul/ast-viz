#!/usr/bin/env node

import * as ohm from 'ohm-js';
import fs from 'fs';

// Read and import from source since we need the uncompiled template literals
const examplePath = './src/data/examples/typescript.ts';
const content = fs.readFileSync(examplePath, 'utf8');

// Parse the TypeScript file to extract the grammar
const grammarMatch = content.match(/grammar:\s*`([^]*?)`\s*,/);
const sampleMatch = content.match(/sampleInput:\s*`([^]*?)`\s*,?\s*\}/);

if (!grammarMatch || !sampleMatch) {
  console.error('❌ Could not extract grammar or sample input');
  process.exit(1);
}

const grammarText = grammarMatch[1];
const sampleInput = sampleMatch[1];

console.log('🔍 Testing TypeScript Grammar...\n');
console.log('📝 Grammar has', grammarText.split('\n').filter(l => l.includes('=')).length, 'rules\n');

// Debug: save grammar to file
fs.writeFileSync('./debug-grammar.ohm', grammarText);
console.log('📄 Grammar saved to debug-grammar.ohm for inspection\n');

try {
  // Create the grammar
  const grammar = ohm.grammar(grammarText);
  console.log('✅ Grammar compiled successfully!\n');
  
  // Count rules
  const rules = Object.keys(grammar.rules).filter(r => !r.startsWith('_'));
  console.log(`📊 Grammar Statistics:`);
  console.log(`   - Total rules: ${rules.length}`);
  console.log(`   - Main rules: ${rules.filter(r => r[0] === r[0].toUpperCase()).length}`);
  console.log(`   - Helper rules: ${rules.filter(r => r[0] === r[0].toLowerCase()).length}\n`);
  
  // Parse the sample input
  console.log('🧪 Testing sample input...\n');
  console.log('Sample input (first 200 chars):');
  console.log('─'.repeat(60));
  console.log(sampleInput.substring(0, 200) + '...');
  console.log('─'.repeat(60));
  console.log();
  
  const matchResult = grammar.match(sampleInput);
  
  if (matchResult.succeeded()) {
    console.log('✅ Sample input parsed successfully!\n');
    
    // Try to create a CST to verify structure
    const cst = grammar.trace(sampleInput);
    if (cst) {
      console.log('✅ CST generated successfully!');
      console.log(`   - Parse tree depth: ${cst.toString().split('\n').length} nodes\n`);
    }
    
    // Test individual features
    console.log('🔬 Testing individual TypeScript features:\n');
    
    const tests = [
      { name: 'Import statement', input: 'import { Component } from "react";' },
      { name: 'Interface', input: 'interface User { name: string; age: number; }' },
      { name: 'Class with generics', input: 'class Manager<T> { private items: T[]; }' },
      { name: 'Async function', input: 'async function fetch(): Promise<Data> { return data; }' },
      { name: 'Arrow function', input: 'const add = (a: number, b: number): number => a + b;' },
      { name: 'Destructuring', input: 'const { name, age } = user;' },
      { name: 'Array destructuring', input: 'const [first, second] = [1, 2];' },
      { name: 'Spread operator', input: 'const arr = [...items, newItem];' },
      { name: 'Template literal', input: 'const msg = `Hello, ${name}!`;' },
      { name: 'Ternary operator', input: 'const result = x > 0 ? "positive" : "negative";' },
      { name: 'Try-catch', input: 'try { doSomething(); } catch (e) { console.log(e); }' },
      { name: 'For loop', input: 'for (let i = 0; i < 10; i++) { console.log(i); }' },
      { name: 'Await expression', input: 'const data = await fetchData();' },
      { name: 'Method with modifiers', input: 'public async getData(): Promise<Data> { return data; }' },
      { name: 'Type union', input: 'const value: string | number = 42;' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
      const result = grammar.match(test.input, 'Statement');
      if (result.succeeded()) {
        console.log(`   ✅ ${test.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name}`);
        console.log(`      Failed at: ${result.message}`);
        failed++;
      }
    });
    
    console.log(`\n📊 Feature Tests: ${passed}/${tests.length} passed`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Grammar is working correctly!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed`);
      process.exit(1);
    }
    
  } else {
    console.log('❌ Sample input failed to parse!\n');
    console.log('Error message:');
    console.log(matchResult.message);
    console.log('\nThis suggests the grammar needs adjustments.\n');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}

