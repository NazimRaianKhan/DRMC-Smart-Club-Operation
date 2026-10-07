import en from '../src/i18n/en.json';
import bn from '../src/i18n/bn.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkKeys(enObj: any, bnObj: any, path = ''): string[] {
  let missing: string[] = [];
  
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (!bnObj[key] || typeof bnObj[key] !== 'object') {
        missing.push(`${currentPath} (missing object in bn.json)`);
      } else {
        missing = missing.concat(checkKeys(enObj[key], bnObj[key], currentPath));
      }
    } else {
      if (bnObj[key] === undefined) {
        missing.push(`${currentPath} (missing value in bn.json)`);
      }
    }
  }
  
  return missing;
}

const missingKeys = checkKeys(en, bn);

if (missingKeys.length > 0) {
  console.error('❌ Missing keys in bn.json:');
  missingKeys.forEach(k => console.error('  - ' + k));
  process.exit(1);
} else {
  console.log('✅ i18n dictionaries are complete.');
  process.exit(0);
}
