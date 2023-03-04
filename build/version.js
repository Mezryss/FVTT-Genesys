import fs from 'fs';

const systemJsonFile = fs.readFileSync('dist/system.json', { encoding: 'utf8' });
const systemJson = JSON.parse(systemJsonFile);
console.log(systemJson['version']);
