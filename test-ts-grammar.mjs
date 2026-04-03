#!/usr/bin/env node

import * as ohm from 'ohm-js';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';

console.log('🔍 Testing TypeScript Grammar\n');

// Compile the TypeScript file to JavaScript
console.log('📦 Compiling TypeScript example...');
try {
  execSync('npx tsc src/data/examples/typescript.ts --module es2020 --target es2020 --outDir /tmp --skipLibCheck', {
    stdio: 'pipe'
  });
  console.log('✅ Compiled successfully\n');
} catch (e) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Import the compiled module
const { typescriptExample } = await import('/tmp/typescript.js');
const grammarText = typescriptExample.grammar;
const sampleInput = typescriptExample.sampleInput;

try {
  const grammar = ohm.grammar(grammarText);
  console.log('✅ Grammar compiled successfully!\n');
  
  // Test the full sample
  console.log('📝 Testing full sample program...\n');
  const matchResult = grammar.match(sampleInput);
  
  if (matchResult.succeeded()) {
    console.log('✅ ✨ Full program parsed successfully! ✨\n');
    console.log('Sample program:');
    console.log('='.repeat(60));
    console.log(sampleInput);
    console.log('='.repeat(60));
    console.log('\n🎉 All tests passed! The TypeScript grammar works correctly!');
    process.exit(0);
  } else {
    console.log('❌ Sample program failed to parse!\n');
    console.log('Error:');
    console.log(matchResult.message);
    console.log('\n');
    
    // Show the problematic line
    const lines = sampleInput.split('\n');
    const errorLine = matchResult.message.match(/Line (\d+)/);
    if (errorLine) {
      const lineNum = parseInt(errorLine[1]) - 1;
      console.log('Problematic section:');
      const start = Math.max(0, lineNum - 2);
      const end = Math.min(lines.length, lineNum + 3);
      for (let i = start; i < end; i++) {
        const marker = i === lineNum ? ' ← ERROR HERE' : '';
        console.log(`${i + 1}: ${lines[i]}${marker}`);
      }
    }
    
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
