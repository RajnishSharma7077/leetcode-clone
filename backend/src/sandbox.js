import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const JAVA_HOME = process.env.JAVA_HOME || `${process.env.HOME}/.local/jdk-21.0.12.1+1/Contents/Home`;

const normalizeCaseInput = (input) => {
  if (Array.isArray(input)) return [...input];
  if (input && typeof input === 'object') return Object.values(input);
  return [input];
};

const makeJsonComparable = (value) => JSON.stringify(value).replace(/\s+/g, '');

const isTwoSumAnswer = (actual, test) => {
  const input = test.input || {};
  const nums = Array.isArray(input.nums) ? input.nums : [];
  const target = Number(input.target ?? NaN);

  if (!Array.isArray(actual) || actual.length !== 2 || !nums.length || Number.isNaN(target)) {
    return false;
  }

  const first = Number(actual[0]);
  const second = Number(actual[1]);

  if (first < 0 || second < 0 || first >= nums.length || second >= nums.length) {
    return false;
  }

  return nums[first] + nums[second] === target;
};

const isCasePassed = (actual, test) => {
  if (test.input && Array.isArray(test.input.nums) && typeof test.input.target === 'number') {
    return isTwoSumAnswer(actual, test);
  }
  return makeJsonComparable(actual) === makeJsonComparable(test.expected);
};

const runJavaScript = async (code, tests) => {
  const wrapper = `
${code}
const tests = ${JSON.stringify(tests)};
let passed = 0;
for (const test of tests) {
  const args = Array.isArray(test.input) ? [...test.input] : (test.input && typeof test.input === 'object' ? Object.values(test.input) : [test.input]);
  const actual = typeof solve === 'function' ? solve(...args) : (typeof twoSum === 'function' ? twoSum(...args) : null);

  if (actual === null) {
    throw new Error('No solve function found in the submitted JavaScript code.');
  }

  const ok = (() => {
    if (test.input && Array.isArray(test.input.nums) && typeof test.input.target === 'number') {
      const nums = test.input.nums;
      const target = test.input.target;
      return Array.isArray(actual) && actual.length === 2 && actual.every((value) => Number.isInteger(value) && value >= 0 && value < nums.length) && nums[actual[0]] + nums[actual[1]] === target;
    }
    return makeJsonComparable(actual) === makeJsonComparable(test.expected);
  })();

  if (!ok) {
    console.log(JSON.stringify({ verdict: 'wrong-answer', actual, expected: test.expected, total: tests.length, passed }));
    process.exit(0);
  }

  passed += 1;
}
console.log(JSON.stringify({ verdict: 'accepted', passed, total: tests.length }));
function makeJsonComparable(value) {
  return JSON.stringify(value).replace(/\s+/g, '');
}
`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'js-judge-'));
  const filePath = path.join(dir, 'solution.js');
  fs.writeFileSync(filePath, wrapper, 'utf8');

  try {
    const start = Date.now();
    const result = await execFileAsync('node', [filePath], { timeout: 4000, maxBuffer: 1024 * 1024 });
    const duration = Date.now() - start;
    const out = result.stdout ? result.stdout.toString().trim() : '';
    console.debug('[sandbox][js] file=%s duration=%dms stdout=%s', filePath, duration, out.slice(0, 500));
    try {
      const parsed = JSON.parse(out || '{}');
      parsed.runtime_ms = duration;
      return parsed;
    } catch (e) {
      return { verdict: 'runtime-error', message: 'failed to parse runner output', stdout: out, runtime_ms: duration };
    }
  } catch (e) {
    const stdout = e.stdout ? String(e.stdout).slice(0, 2000) : '';
    const stderr = e.stderr ? String(e.stderr).slice(0, 2000) : '';
    console.error('[sandbox][js][error] file=%s message=%s stdout=%s stderr=%s', filePath, e.message, stdout, stderr);
    throw e;
  }
};

const runPython = async (code, tests) => {
  const wrapper = `
import json

tests = ${JSON.stringify(tests)}
${code}
passed = 0
for test in tests:
    args = list(test['input'].values()) if isinstance(test['input'], dict) else test['input']
    actual = solve(*args) if callable(solve) else twoSum(*args)
    if isinstance(test['input'], dict) and 'nums' in test['input'] and 'target' in test['input']:
        nums = test['input']['nums']
        target = test['input']['target']
        ok = isinstance(actual, list) and len(actual) == 2 and all(isinstance(v, int) for v in actual) and 0 <= actual[0] < len(nums) and 0 <= actual[1] < len(nums) and nums[actual[0]] + nums[actual[1]] == target
    else:
        ok = json.dumps(actual, separators=(',', ':')) == json.dumps(test['expected'], separators=(',', ':'))
    if not ok:
        print(json.dumps({"verdict": "wrong-answer", "actual": actual, "expected": test['expected'], "total": len(tests), "passed": passed}))
        raise SystemExit
    passed += 1
print(json.dumps({"verdict": "accepted", "passed": passed, "total": len(tests)}))
`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-judge-'));
  const filePath = path.join(dir, 'solution.py');
  fs.writeFileSync(filePath, wrapper, 'utf8');

  try {
    const start = Date.now();
    const result = await execFileAsync('python3', [filePath], { timeout: 4000, maxBuffer: 1024 * 1024 });
    const duration = Date.now() - start;
    const out = result.stdout ? result.stdout.toString().trim() : '';
    console.debug('[sandbox][py] file=%s duration=%dms stdout=%s', filePath, duration, out.slice(0, 500));
    try {
      const parsed = JSON.parse(out || '{}');
      parsed.runtime_ms = duration;
      return parsed;
    } catch (e) {
      return { verdict: 'runtime-error', message: 'failed to parse runner output', stdout: out, runtime_ms: duration };
    }
  } catch (e) {
    const stdout = e.stdout ? String(e.stdout).slice(0, 2000) : '';
    const stderr = e.stderr ? String(e.stderr).slice(0, 2000) : '';
    console.error('[sandbox][py][error] file=%s message=%s stdout=%s stderr=%s', filePath, e.message, stdout, stderr);
    throw e;
  }
};

const runCpp = async (code, tests) => {
  const firstTest = tests[0] || { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] };
  const input = normalizeCaseInput(firstTest.input);
  const nums = input[0];
  const target = Number(input[1] ?? 0);
  const expected = firstTest.expected;

  const wrapper = `
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
${code}

int main() {
  vector<int> nums = {${nums.map((n) => String(n)).join(', ')}};
  int target = ${target};
  auto result = Solution().twoSum(nums, target);
  vector<int> expected = {${expected.map((value) => String(value)).join(', ')}};

  bool ok = result.size() == 2 && result[0] >= 0 && result[1] >= 0 && result[0] < nums.size() && result[1] < nums.size() && nums[result[0]] + nums[result[1]] == target;

  if (ok) {
    cout << "{\\\"verdict\\\":\\\"accepted\\\",\\\"passed\\\":1,\\\"total\\\":1}" << endl;
    return 0;
  }

  cout << "{\\\"verdict\\\":\\\"wrong-answer\\\",\\\"actual\\\":[";
  for (size_t i = 0; i < result.size(); i++) {
    if (i) cout << ",";
    cout << result[i];
  }
  cout << "],\\\"expected\\\":[";
  for (size_t i = 0; i < expected.size(); i++) {
    if (i) cout << ",";
    cout << expected[i];
  }
  cout << "],\\\"passed\\\":0,\\\"total\\\":1}" << endl;
  return 0;
}
`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp-judge-'));
  const sourcePath = path.join(dir, 'solution.cpp');
  const binaryPath = path.join(dir, 'solution');
  fs.writeFileSync(sourcePath, wrapper, 'utf8');

  try {
    const compileStart = Date.now();
    await execFileAsync('clang++', ['-std=c++17', sourcePath, '-o', binaryPath], { timeout: 8000, maxBuffer: 1024 * 1024 });
    const compileDur = Date.now() - compileStart;
    const start = Date.now();
    const result = await execFileAsync(binaryPath, [], { timeout: 4000, maxBuffer: 1024 * 1024 });
    const execDur = Date.now() - start;
    const out = result.stdout ? result.stdout.toString().trim() : '';
    console.debug('[sandbox][cpp] src=%s compileMs=%d execMs=%d stdout=%s', sourcePath, compileDur, execDur, out.slice(0,500));
    try {
      const parsed = JSON.parse(out || '{}');
      parsed.runtime_ms = execDur;
      parsed.compile_ms = compileDur;
      return parsed;
    } catch (e) {
      return { verdict: 'runtime-error', message: 'failed to parse runner output', stdout: out, runtime_ms: execDur, compile_ms: compileDur };
    }
  } catch (e) {
    const stdout = e.stdout ? String(e.stdout).slice(0, 2000) : '';
    const stderr = e.stderr ? String(e.stderr).slice(0, 2000) : '';
    console.error('[sandbox][cpp][error] src=%s message=%s stdout=%s stderr=%s', sourcePath, e.message, stdout, stderr);
    throw e;
  }
};

const runJava = async (code, tests) => {
  const firstTest = tests[0] || { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] };
  const input = normalizeCaseInput(firstTest.input);
  const nums = input[0];
  const target = Number(input[1] ?? 0);
  const expected = firstTest.expected;

  const wrapper = `
import java.util.*;
${code}
public class Main {
  public static void main(String[] args) {
    int[] nums = {${nums.map((n) => String(n)).join(', ')}};
    int target = ${target};
    int[] result = new Solution().twoSum(nums, target);
    int[] expected = {${expected.map((value) => String(value)).join(', ')}};

    boolean ok = result.length == 2 && result[0] >= 0 && result[1] >= 0 && result[0] < nums.length && result[1] < nums.length && nums[result[0]] + nums[result[1]] == target;
    if (ok) {
      System.out.println("{\\\"verdict\\\":\\\"accepted\\\",\\\"passed\\\":1,\\\"total\\\":1}");
      return;
    }

    String payload = "{\\\"verdict\\\":\\\"wrong-answer\\\",\\\"actual\\\":" + Arrays.toString(result) + ",\\\"expected\\\":" + Arrays.toString(expected) + ",\\\"passed\\\":0,\\\"total\\\":1}";
    System.out.println(payload);
  }
}
`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'java-judge-'));
  const sourcePath = path.join(dir, 'Main.java');
  fs.writeFileSync(sourcePath, wrapper, 'utf8');

  const javaBin = path.join(JAVA_HOME, 'bin', 'java');
  const javacBin = path.join(JAVA_HOME, 'bin', 'javac');

  try {
    const compileStart = Date.now();
    await execFileAsync(javacBin, ['-d', dir, sourcePath], { timeout: 10000, maxBuffer: 1024 * 1024 });
    const compileDur = Date.now() - compileStart;
    const start = Date.now();
    const result = await execFileAsync(javaBin, ['-cp', dir, 'Main'], { timeout: 4000, maxBuffer: 1024 * 1024 });
    const execDur = Date.now() - start;
    const out = result.stdout ? result.stdout.toString().trim() : '';
    console.debug('[sandbox][java] src=%s compileMs=%d execMs=%d stdout=%s', sourcePath, compileDur, execDur, out.slice(0,500));
    try {
      const parsed = JSON.parse(out || '{}');
      parsed.runtime_ms = execDur;
      parsed.compile_ms = compileDur;
      return parsed;
    } catch (e) {
      return { verdict: 'runtime-error', message: 'failed to parse runner output', stdout: out, runtime_ms: execDur, compile_ms: compileDur };
    }
  } catch (e) {
    const stdout = e.stdout ? String(e.stdout).slice(0, 2000) : '';
    const stderr = e.stderr ? String(e.stderr).slice(0, 2000) : '';
    console.error('[sandbox][java][error] src=%s message=%s stdout=%s stderr=%s', sourcePath, e.message, stdout, stderr);
    throw e;
  }
};

export async function executeSubmission({ code, language, problem }) {
  const tests = problem?.testCases || [{ input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] }];

  try {
    if (language === 'javascript') return await runJavaScript(code, tests);
    if (language === 'python') return await runPython(code, tests);
    if (language === 'cpp') return await runCpp(code, tests);
    if (language === 'java') return await runJava(code, tests);

    return { verdict: 'unsupported-language', message: 'Unsupported language selected for judge.' };
  } catch (error) {
    return {
      verdict: 'runtime-error',
      message: error.message,
      stderr: error.stderr ? error.stderr.toString() : ''
    };
  }
}
