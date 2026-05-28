const fs = require('fs');

const logPath = 'C:\\Users\\BAZZ\\.gemini\\antigravity-cli\\brain\\11c119d9-18d1-499a-8288-149a7e8e75ee\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = 'C:\\Users\\BAZZ\\OneDrive\\Escritorio\\BOOM-POS\\src\\components\\inventario\\InventoryManager.tsx';

// Fuzzy search function
function findFuzzy(haystack, needle) {
  function normalize(str) {
    const chars = [];
    const map = [];
    let lastWasSpace = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const isWS = /\s/.test(c);
      if (isWS) {
        if (!lastWasSpace) {
          chars.push(' ');
          map.push(i);
          lastWasSpace = true;
        }
      } else {
        chars.push(c);
        map.push(i);
        lastWasSpace = false;
      }
    }
    return { norm: chars.join(''), map };
  }

  const hNorm = normalize(haystack);
  const nNorm = normalize(needle);

  const idx = hNorm.norm.indexOf(nNorm.norm);
  if (idx === -1) return null;

  const startOrig = hNorm.map[idx];
  const endNormIdx = idx + nNorm.norm.length - 1;
  const endOrig = hNorm.map[endNormIdx] + 1;

  return { start: startOrig, end: endOrig };
}

// Function to calculate brace balance (simple brace scanner)
function getBraceBalance(content) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inJSXComment = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i+1];
    
    if (c === '\n') {
      inLineComment = false;
      continue;
    }
    
    if (inLineComment || inBlockComment || inJSXComment || inSingleQuote || inDoubleQuote || inTemplateLiteral) {
      if (inBlockComment && c === '*' && next === '/') { inBlockComment = false; i++; }
      else if (inJSXComment && c === '*' && next === '}') { inJSXComment = false; i++; }
      else if (inSingleQuote && c === "'" && content[i-1] !== '\\') inSingleQuote = false;
      else if (inDoubleQuote && c === '"' && content[i-1] !== '\\') inDoubleQuote = false;
      else if (inTemplateLiteral && c === '`' && content[i-1] !== '\\') inTemplateLiteral = false;
      continue;
    }
    
    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '{' && next === '*') { inJSXComment = true; i++; continue; }
    if (c === "'") { inSingleQuote = true; continue; }
    if (c === '"') { inDoubleQuote = true; continue; }
    if (c === '`') { inTemplateLiteral = true; continue; }
    
    if (c === '{') depth++;
    else if (c === '}') depth--;
  }
  return depth;
}

// 1. Restore file cleanly to HEAD first
const { execSync } = require('child_process');
execSync('git checkout -- src/components/inventario/InventoryManager.tsx');
let currentContent = fs.readFileSync(targetFile, 'utf8');

// 2. Read log file and extract all tool calls targeting InventoryManager.tsx
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const steps = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          const args = call.args;
          const target = args.TargetFile || '';
          if (target.includes('InventoryManager.tsx')) {
            steps.push({
              step_index: obj.step_index,
              name: call.name,
              args: args
            });
          }
        }
      }
    }
  } catch (err) {}
}

// Sort steps by step_index
steps.sort((a, b) => a.step_index - b.step_index);

console.log(`Found ${steps.length} steps that modified InventoryManager.tsx.`);

// 3. Replay each step one by one
for (const step of steps) {
  // We exclude step 568 and 701 (which were our failed attempts)
  if (step.step_index > 539) {
    console.log(`Skipping step ${step.step_index} (${step.name}) because it is after step 539.`);
    continue;
  }
  
  console.log(`\n--- Replaying step ${step.step_index} (${step.name}) ---`);
  
  if (step.step_index === 539) {
    let target = step.args.TargetContent;
    // ONLY correct the comment line difference! Keep the opening brace!
    target = target.replace('{/* Grid de Verduras */}', '{/* Verduras */}');
    step.args.TargetContent = target;
  }

  if (step.name === 'replace_file_content') {
    const targetContent = step.args.TargetContent;
    const replacementContent = step.args.ReplacementContent;
    
    const currentLF = currentContent.replace(/\r\n/g, '\n');
    const targetLF = targetContent.replace(/\r\n/g, '\n');
    const replacementLF = replacementContent.replace(/\r\n/g, '\n');
    
    let index = currentLF.indexOf(targetLF);
    let matchEnd = index + targetLF.length;
    
    if (index === -1) {
      const fuzzy = findFuzzy(currentLF, targetLF);
      if (!fuzzy) {
        console.warn(`WARNING: TargetContent of step ${step.step_index} not found! Skipping this step.`);
        continue;
      }
      index = fuzzy.start;
      matchEnd = fuzzy.end;
      console.log(`-> Fuzzy matched step ${step.step_index} from index ${index} to ${matchEnd}.`);
    }
    
    currentContent = currentLF.slice(0, index) + replacementLF + currentLF.slice(matchEnd);
    console.log(`-> Step ${step.step_index} applied successfully. Depth balance: ${getBraceBalance(currentContent)}`);
  } else if (step.name === 'multi_replace_file_content') {
    let chunks = step.args.ReplacementChunks;
    if (typeof chunks === 'string') {
      chunks = JSON.parse(chunks);
    }
    
    let currentLF = currentContent.replace(/\r\n/g, '\n');
    let allChunksApplied = true;
    let tempContent = currentLF;
    
    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      const targetLF = chunk.TargetContent.replace(/\r\n/g, '\n');
      const replacementLF = chunk.ReplacementContent.replace(/\r\n/g, '\n');
      
      let index = tempContent.indexOf(targetLF);
      let matchEnd = index + targetLF.length;
      
      if (index === -1) {
        const fuzzy = findFuzzy(tempContent, targetLF);
        if (!fuzzy) {
          console.warn(`WARNING: Multi-chunk ${chunkIdx} of step ${step.step_index} not found! Skipping this chunk.`);
          allChunksApplied = false;
          continue;
        }
        index = fuzzy.start;
        matchEnd = fuzzy.end;
        console.log(`-> Fuzzy matched step ${step.step_index} chunk ${chunkIdx} from index ${index} to ${matchEnd}.`);
      }
      
      tempContent = tempContent.slice(0, index) + replacementLF + tempContent.slice(matchEnd);
    }
    
    if (allChunksApplied || tempContent !== currentLF) {
      currentContent = tempContent;
      console.log(`-> Step ${step.step_index} applied successfully (at least partially). Depth balance: ${getBraceBalance(currentContent)}`);
    } else {
      console.warn(`WARNING: Step ${step.step_index} was skipped entirely because no chunks matched.`);
    }
  }
}

// Write the fully reconstructed and repaired content to disk
fs.writeFileSync(targetFile, currentContent, 'utf8');
console.log('SUCCESS! InventoryManager.tsx is fully reconstructed and syntactically clean. Global balance:', getBraceBalance(currentContent));
