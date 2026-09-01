import { useEffect, useMemo, useState } from 'react';
import api, { getUserFromStorage, scheduleTokenRefresh } from './api';

const filters = ['All', 'Easy', 'Medium', 'Hard'];
const languageTemplates = {
  javascript: `function solve(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i += 1) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`,
  python: `def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }

        return new int[] {};
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;

        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }

        return {};
    }
};`
};

function App() {
  const [problems, setProblems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(languageTemplates.javascript);
  const [result, setResult] = useState('');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '' });
  const [viewMode, setViewMode] = useState('problems'); // 'problems' | 'leaderboard' | 'profile'

  useEffect(() => {
    api.getProblems(selectedFilter)
      .then((data) => {
        setProblems(data);
        setSelectedProblemId(data[0]?.id ?? null);
      })
      .catch((error) => console.error('Failed to load problems:', error));
  }, [selectedFilter]);

  useEffect(() => {
    setCode(languageTemplates[language]);
    setResult('');
    const storedUser = getUserFromStorage();
    if (storedUser) setUser({ id: storedUser.id, username: storedUser.username, rating: storedUser.rating });
  }, [language]);

  // schedule refresh on app load if token present
  useEffect(() => {
    const stored = getUserFromStorage();
    if (stored) {
      setUser({ id: stored.id, username: stored.username, rating: stored.rating });
      scheduleTokenRefresh();
    }
  }, []);

  const filteredProblems = useMemo(() => {
    if (selectedFilter === 'All') return problems;
    return problems.filter((problem) => problem.difficulty === selectedFilter);
  }, [problems, selectedFilter]);

  useEffect(() => {
    if (!filteredProblems.length) return;
    const selectedExists = filteredProblems.some((problem) => problem.id === selectedProblemId);

    if (!selectedExists) {
      setSelectedProblemId(filteredProblems[0].id);
    }
  }, [filteredProblems, selectedProblemId]);

  const selectedProblem = filteredProblems.find((problem) => problem.id === selectedProblemId) ?? filteredProblems[0] ?? null;

  const handleSubmit = async () => {
    if (!selectedProblem) return;

    try {
      const data = await api.submitSolution({ problemId: selectedProblem.id, language, code });
      // store structured result so UI can render fields
      setResult(data);
      // refresh profile submissions if logged in
      if (user && user.id) {
        const subs = await api.getSubmissions(user.id);
        setSubmissions(subs || []);
      }
    } catch (error) {
      setResult({ verdict: 'error', message: error.message });
    }
  };

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    let poll = null;
    async function load() {
      try {
        const data = await api.getLeaderboard(50);
        setLeaderboard(data || []);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
      }
    }

    // connect websocket for live updates once on mount
    let ws = null;
    try {
      ws = api.connectLeaderboardWS((msg) => {
        if (msg.type === 'leaderboard_init' || msg.type === 'leaderboard_update') {
          setLeaderboard(msg.leaderboard || []);
        }
      });
    } catch (e) {
      console.error('WS connect failed', e);
    }

    if (viewMode === 'leaderboard') {
      load();
      poll = setInterval(load, 10000);
    }
    return () => { if (poll) clearInterval(poll); if (ws) ws.close(); };
  }, [viewMode]);

  // Profile state
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await api.getProfile();
        if (p && p.id) {
          setProfile(p);
          const subs = await api.getSubmissions(p.id);
          setSubmissions(subs || []);
        } else {
          setProfile(null);
          setSubmissions([]);
        }
      } catch (e) {
        console.error('Failed to load profile/submissions', e);
        setProfile(null);
        setSubmissions([]);
      }
    }
    if (viewMode === 'profile') loadProfile();
  }, [viewMode]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-badge">LC</div>
          <div>
            <div className="brand-title">CodeRank</div>
            <div className="brand-subtitle">Practice archive</div>
          </div>
        </div>

        <div className="auth-area">
          {user ? (
            <div className="user-row">
              <div>
                <strong>{user.username}</strong>
                <div className="muted">Rating: {user.rating ?? '1500'}</div>
              </div>
              <div>
                <button className="filter-tab" onClick={async () => {
                  const refresh = localStorage.getItem('refresh');
                  await api.logout(refresh);
                  setUser(null);
                  setViewMode('problems');
                }}>Logout</button>
              </div>
            </div>
          ) : (
            <div className="auth-forms">
              <div className="auth-tabs">
                <button className={authMode === 'login' ? 'filter-tab active' : 'filter-tab'} onClick={() => setAuthMode('login')}>Login</button>
                <button className={authMode === 'register' ? 'filter-tab active' : 'filter-tab'} onClick={() => setAuthMode('register')}>Register</button>
              </div>

              <div className="auth-form">
                <input placeholder="Username" value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} />
                {authMode === 'register' && (
                  <input placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                )}
                <input placeholder="Password" type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="filter-tab" onClick={async () => {
                    try {
                      if (authMode === 'login') {
                        const resp = await api.login(authForm.username, authForm.password);
                        if (resp.access) {
                          // tokens are stored by api.login
                          const decoded = getUserFromStorage();
                          setUser({ id: decoded.id, username: decoded.username, rating: resp.user?.rating });
                          setAuthForm({ username: '', password: '', email: '' });
                        }
                      } else {
                        const resp = await api.register(authForm.username, authForm.password, authForm.email);
                        if (resp.access) {
                          const decoded = getUserFromStorage();
                          setUser({ id: decoded.id, username: decoded.username, rating: resp.user?.rating });
                          setAuthForm({ username: '', password: '', email: '' });
                        }
                      }
                    } catch (err) {
                      alert('Auth failed');
                    }
                  }}>
                    {authMode === 'login' ? 'Login' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button className={viewMode === 'problems' ? 'filter-tab active' : 'filter-tab'} onClick={() => setViewMode('problems')}>Problems</button>
          <button className={viewMode === 'leaderboard' ? 'filter-tab active' : 'filter-tab'} onClick={() => setViewMode('leaderboard')}>Leaderboard</button>
          <button className={viewMode === 'profile' ? 'filter-tab active' : 'filter-tab'} onClick={() => setViewMode('profile')}>Profile</button>
        </div>

        <div className="filter-group" style={{ marginTop: '0.75rem' }}>
          {filters.map((filter) => (
            <button
              key={filter}
              className={selectedFilter === filter ? 'filter-tab active' : 'filter-tab'}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="problem-count">{filteredProblems.length} problems</div>

        <div className="problem-list">
          {filteredProblems.map((problem) => (
            <button
              key={problem.id}
              className={selectedProblem?.id === problem.id ? 'problem-item active' : 'problem-item'}
              onClick={() => { setSelectedProblemId(problem.id); setViewMode('problems'); }}
            >
              <div className="problem-main-row">
                <span className="index">#{problem.id}</span>
                <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
              </div>
              <div className="problem-title">{problem.title}</div>
              <div className="problem-meta">
                <span>{problem.category}</span>
                <span>{problem.leetcodeDifficulty}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="workspace">
        {viewMode === 'leaderboard' && (
          <div className="panel">
            <h2>Leaderboard</h2>
            <ol>
              {leaderboard && leaderboard.length ? leaderboard.map((u) => (
                <li key={u.id}>{u.username} — {u.rating}</li>
              )) : <li>No data</li>}
            </ol>
          </div>
        )}

        {viewMode === 'profile' && (
          <div className="panel">
            <h2>Profile</h2>
            {!profile ? (
              <div>Please login to view profile and submissions.</div>
            ) : (
              <div>
                <div><strong>{profile.username}</strong> — Rating: {profile.rating}</div>
                <h3>Submissions</h3>
                <ul>
                  {submissions && submissions.length ? submissions.map((s) => (
                    <li key={s.id} style={{ marginBottom: '0.4rem' }}>
                      <div><strong>Problem:</strong> {s.problem_id ?? s.problemId}</div>
                      <div><strong>Lang:</strong> {s.language}</div>
                      <div><strong>Verdict:</strong> {s.verdict || s.status}</div>
                      {s.runtime_ms != null && <div><strong>Runtime (ms):</strong> {s.runtime_ms}</div>}
                      {s.compile_ms != null && <div><strong>Compile (ms):</strong> {s.compile_ms}</div>}
                      {s.stderr && s.stderr.length > 0 && <details><summary>Stderr</summary><pre>{s.stderr}</pre></details>}
                      <div className="muted">{new Date(s.created_at).toLocaleString()}</div>
                    </li>
                  )) : <li>No submissions yet</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {viewMode === 'problems' && selectedProblem && (
          <>
            <header className="problem-header">
              <div>
                <p className="eyebrow">Question #{selectedProblem.id}</p>
                <h1>{selectedProblem.title}</h1>
              </div>
              <div className="header-badges">
                <span className={`difficulty-badge ${selectedProblem.difficulty.toLowerCase()}`}>{selectedProblem.difficulty}</span>
                <span className="simple-pill">{selectedProblem.category}</span>
              </div>
            </header>

            <section className="stats-grid">
              <div className="stat-card">
                <span>LeetCode</span>
                <strong>{selectedProblem.leetcodeDifficulty}</strong>
              </div>
              <div className="stat-card">
                <span>Codeforces</span>
                <strong>{selectedProblem.codeforcesDifficulty}</strong>
              </div>
              <div className="stat-card">
                <span>Cases executed</span>
                <strong>{selectedProblem.casesExecuted}</strong>
              </div>
              <div className="stat-card">
                <span>Source</span>
                <strong>{selectedProblem.source}</strong>
              </div>
            </section>

            <section className="content-grid">
              <article className="panel">
                <h3>Problem statement</h3>
                <p>{selectedProblem.description}</p>
                <div className="constraint-box">
                  <strong>Constraints</strong>
                  <span>{selectedProblem.constraints}</span>
                </div>
                <div className="example-box">
                  <h4>Example</h4>
                  <p>
                    <strong>Input:</strong> {selectedProblem.example.input}
                  </p>
                  <p>
                    <strong>Output:</strong> {selectedProblem.example.output}
                  </p>
                  <p>
                    <strong>Why:</strong> {selectedProblem.example.explanation}
                  </p>
                </div>
              </article>

              <article className="panel">
                <h3>Complexity analysis</h3>
                <div className="complexity-row">
                  <span>Time complexity</span>
                  <strong>{selectedProblem.timeComplexity}</strong>
                </div>
                <div className="complexity-row">
                  <span>Space complexity</span>
                  <strong>{selectedProblem.spaceComplexity}</strong>
                </div>
                <div className="complexity-row">
                  <span>Cases executed</span>
                  <strong>{selectedProblem.casesExecuted}</strong>
                </div>
                <div className="complexity-row">
                  <span>Difficulty score</span>
                  <strong>{selectedProblem.rating}</strong>
                </div>
              </article>

              <article className="panel">
                <h3>Hints</h3>
                <ol>
                  {(selectedProblem?.hints ?? []).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              </article>

              <article className="panel">
                <h3>Logic explanation</h3>
                <p>{selectedProblem.explanation}</p>
              </article>
            </section>

            <section className="editor-panel">
              <div className="editor-toolbar">
                <div className="language-switcher">
                  <label htmlFor="language">Language</label>
                  <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <button onClick={handleSubmit}>Run code</button>
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
              />
            </section>

            <section className="result-panel">
              <h3>Judge output</h3>
              {result ? (
                <div className="submission-details">
                  <div><strong>Verdict:</strong> {String(result.verdict)}</div>
                  {result.message && <div><strong>Message:</strong> {result.message}</div>}
                  {result.timeComplexity && <div><strong>Time Complexity:</strong> {result.timeComplexity}</div>}
                  {result.spaceComplexity && <div><strong>Space Complexity:</strong> {result.spaceComplexity}</div>}
                  {result.runtime_ms != null && <div><strong>Runtime (ms):</strong> {result.runtime_ms}</div>}
                  {result.compile_ms != null && <div><strong>Compile (ms):</strong> {result.compile_ms}</div>}
                  {result.casesExecuted != null && <div><strong>Cases executed:</strong> {result.casesExecuted}</div>}
                  {result.stderr && result.stderr.length > 0 && (
                    <div className="stderr-box"><strong>Stderr</strong><pre>{result.stderr}</pre></div>
                  )}

                  {result.details && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Details</strong>
                      <pre style={{ maxHeight: '240px', overflow: 'auto' }}>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <pre>Run a solution to inspect accepted output, time/space analysis, and execution behavior.</pre>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
