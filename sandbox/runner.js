const fs = require('fs');
const os = require('os');
const path = require('path');

const input = process.env.SUBMISSION_INPUT || '{}';
const submission = JSON.parse(input);

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-runner-'));
const sourceFile = path.join(workDir, submission.filename || 'solution.js');

fs.writeFileSync(sourceFile, submission.code || '');

console.log(JSON.stringify({
  ok: true,
  sandbox: 'dockerized-runner',
  workDir,
  file: sourceFile,
  message: 'Code was staged for execution in a sandboxed temp directory.'
}, null, 2));
