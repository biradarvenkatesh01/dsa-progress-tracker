import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const difficulties = ['Easy', 'Medium', 'Hard'];
const difficultyToApi = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
};
const difficultyFromApi = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function getProgressBarColor(percent) {
  if (percent >= 100) return '#16a34a';
  if (percent >= 50) return '#eab308';
  return '#dc2626';
}

function normalizeExternalUrl(url) {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    padding: '24px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  card: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow: '0 8px 20px rgba(2, 8, 23, 0.08)',
  },
  progressTrack: {
    width: '100%',
    height: '10px',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  topicCard: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 8px 20px rgba(2, 8, 23, 0.07)',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
};

function difficultyColor(level) {
  if (level === 'Easy') return { bg: '#dcfce7', text: '#166534' };
  if (level === 'Medium') return { bg: '#fef3c7', text: '#92400e' };
  return { bg: '#fee2e2', text: '#991b1b' };
}

function Dashboard() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newProblems, setNewProblems] = useState({});
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [editingProblemData, setEditingProblemData] = useState({
    title: '',
    leetcodeUrl: '',
    difficulty: 'Easy',
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    setError('');
    try {
      const [topicsResponse, problemsResponse] = await Promise.all([
        api.get('/topics/'),
        api.get('/problems/'),
      ]);
      const topicsData = topicsResponse.data || [];
      const problemsData = problemsResponse.data || [];

      const problemsByTopic = problemsData.reduce((acc, problem) => {
        const topicId = problem.topic;
        if (!acc[topicId]) acc[topicId] = [];
        acc[topicId].push({
          id: problem.id,
          title: problem.title,
          leetcode_url: problem.leetcode_url || '',
          difficulty: difficultyFromApi[problem.difficulty] || problem.difficulty,
          solved: !!problem.is_solved,
        });
        return acc;
      }, {});

      const mergedTopics = topicsData.map((topic) => ({
        ...topic,
        problems: problemsByTopic[topic.id] || [],
      }));
      setTopics(mergedTopics);
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || 'Could not load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const totalSolved = useMemo(
    () =>
      topics.reduce(
        (acc, topic) => acc + (topic.problems || []).filter((problem) => problem.solved).length,
        0
      ),
    [topics]
  );

  const totalProblems = useMemo(
    () => topics.reduce((acc, topic) => acc + (topic.problems || []).length, 0),
    [topics]
  );

  const overallPercent = totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const easyStats = useMemo(() => {
    const allProblems = topics.flatMap((topic) => topic.problems || []);
    const easyProblems = allProblems.filter((problem) => problem.difficulty === 'Easy');
    const easySolved = easyProblems.filter((problem) => problem.solved).length;
    return { solved: easySolved, total: easyProblems.length };
  }, [topics]);
  const mediumStats = useMemo(() => {
    const allProblems = topics.flatMap((topic) => topic.problems || []);
    const mediumProblems = allProblems.filter((problem) => problem.difficulty === 'Medium');
    const mediumSolved = mediumProblems.filter((problem) => problem.solved).length;
    return { solved: mediumSolved, total: mediumProblems.length };
  }, [topics]);
  const hardStats = useMemo(() => {
    const allProblems = topics.flatMap((topic) => topic.problems || []);
    const hardProblems = allProblems.filter((problem) => problem.difficulty === 'Hard');
    const hardSolved = hardProblems.filter((problem) => problem.solved).length;
    return { solved: hardSolved, total: hardProblems.length };
  }, [topics]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      const response = await api.post('/topics/', { name: newTopicName.trim() });
      setTopics((prev) => [...prev, { ...response.data, problems: response.data?.problems || [] }]);
      setNewTopicName('');
      setShowModal(false);
    } catch {
      const localTopic = {
        id: Date.now(),
        name: newTopicName.trim(),
        problems: [],
      };
      setTopics((prev) => [...prev, localTopic]);
      setNewTopicName('');
      setShowModal(false);
    }
  };

  const handleAddProblem = async (topicId) => {
    const entry = newProblems[topicId];
    if (!entry?.title?.trim()) return;

    try {
      const response = await api.post('/problems/', {
        title: entry.title.trim(),
        leetcode_url: normalizeExternalUrl(entry.leetcodeUrl),
        topic: topicId,
        difficulty: difficultyToApi[entry.difficulty] || 'easy',
      });
      const created = {
        id: response.data?.id,
        title: response.data?.title,
        leetcode_url: response.data?.leetcode_url || entry.leetcodeUrl?.trim() || '',
        difficulty: difficultyFromApi[response.data?.difficulty] || entry.difficulty,
        solved: !!response.data?.is_solved,
      };
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId
            ? { ...topic, problems: [...(topic.problems || []), { ...created, solved: !!created.solved }] }
            : topic
        )
      );
    } catch {
      const fallbackProblem = {
        id: Date.now(),
        title: entry.title.trim(),
        leetcode_url: normalizeExternalUrl(entry.leetcodeUrl),
        difficulty: entry.difficulty,
        solved: false,
      };
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, problems: [...(topic.problems || []), fallbackProblem] } : topic
        )
      );
    } finally {
      setNewProblems((prev) => ({
        ...prev,
        [topicId]: { title: '', leetcodeUrl: '', difficulty: 'Easy' },
      }));
    }
  };

  const handleToggleSolved = async (topicId, problemId) => {
    let currentSolved = false;
    const targetTopic = topics.find((topic) => topic.id === topicId);
    const targetProblem = targetTopic?.problems?.find((problem) => problem.id === problemId);
    currentSolved = !!targetProblem?.solved;

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              problems: (topic.problems || []).map((problem) =>
                problem.id === problemId ? { ...problem, solved: !problem.solved } : problem
              ),
            }
          : topic
      )
    );

    try {
      await api.patch(`/problems/${problemId}/`, { is_solved: !currentSolved });
    } catch {
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId
            ? {
                ...topic,
                problems: (topic.problems || []).map((problem) =>
                  problem.id === problemId ? { ...problem, solved: currentSolved } : problem
                ),
              }
            : topic
        )
      );
    }
  };

  const handleDeleteTopic = async (topicId) => {
    const previousTopics = topics;
    setTopics((prev) => prev.filter((topic) => topic.id !== topicId));
    try {
      await api.delete(`/topics/${topicId}/`);
    } catch {
      setTopics(previousTopics);
    }
  };

  const startEditTopic = (topic) => {
    setEditingTopicId(topic.id);
    setEditingTopicName(topic.name);
  };

  const handleSaveTopic = async (topicId) => {
    const name = editingTopicName.trim();
    if (!name) return;
    const previousTopics = topics;
    setTopics((prev) => prev.map((topic) => (topic.id === topicId ? { ...topic, name } : topic)));
    setEditingTopicId(null);
    setEditingTopicName('');
    try {
      await api.patch(`/topics/${topicId}/`, { name });
    } catch {
      setTopics(previousTopics);
    }
  };

  const startEditProblem = (problem) => {
    setEditingProblemId(problem.id);
    setEditingProblemData({
      title: problem.title || '',
      leetcodeUrl: problem.leetcode_url || '',
      difficulty: problem.difficulty || 'Easy',
    });
  };

  const handleSaveProblem = async (topicId, problemId) => {
    const title = editingProblemData.title.trim();
    if (!title) return;
    const nextProblem = {
      title,
      leetcode_url: normalizeExternalUrl(editingProblemData.leetcodeUrl),
      difficulty: editingProblemData.difficulty,
    };
    const previousTopics = topics;
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              problems: (topic.problems || []).map((problem) =>
                problem.id === problemId ? { ...problem, ...nextProblem } : problem
              ),
            }
          : topic
      )
    );
    setEditingProblemId(null);
    setEditingProblemData({ title: '', leetcodeUrl: '', difficulty: 'Easy' });
    try {
      await api.patch(`/problems/${problemId}/`, {
        title,
        leetcode_url: normalizeExternalUrl(editingProblemData.leetcodeUrl),
        difficulty: difficultyToApi[editingProblemData.difficulty] || 'easy',
      });
    } catch {
      setTopics(previousTopics);
    }
  };

  const handleDeleteProblem = async (topicId, problemId) => {
    const previousTopics = topics;
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? { ...topic, problems: (topic.problems || []).filter((problem) => problem.id !== problemId) }
          : topic
      )
    );
    try {
      await api.delete(`/problems/${problemId}/`);
    } catch {
      setTopics(previousTopics);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'grid', placeItems: 'center' }}>
        <p style={{ color: '#334155', fontSize: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Student DSA Progress Tracker</h1>
            <p style={{ marginTop: '6px', color: '#64748b' }}>Track your consistency topic by topic.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                background: '#2563eb',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Add Topic
            </button>
            <button
              onClick={handleLogout}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ ...styles.card, border: '1px solid #fecaca', color: '#b91c1c' }}>{error}</div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          <div style={{ ...styles.card, border: '1px solid #cbd5e1' }}>
            <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>Total Problems</p>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: '26px', fontWeight: 700 }}>
              {totalProblems}
            </p>
          </div>
          <div style={{ ...styles.card, border: '1px solid #86efac', background: '#f0fdf4' }}>
            <p style={{ margin: 0, color: '#166534', fontSize: '13px' }}>Easy</p>
            <p style={{ margin: '6px 0 0', color: '#166534', fontSize: '22px', fontWeight: 700 }}>
              {easyStats.solved}/{easyStats.total}
            </p>
          </div>
          <div style={{ ...styles.card, border: '1px solid #fde047', background: '#fefce8' }}>
            <p style={{ margin: 0, color: '#92400e', fontSize: '13px' }}>Medium</p>
            <p style={{ margin: '6px 0 0', color: '#92400e', fontSize: '22px', fontWeight: 700 }}>
              {mediumStats.solved}/{mediumStats.total}
            </p>
          </div>
          <div style={{ ...styles.card, border: '1px solid #fca5a5', background: '#fef2f2' }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>Hard</p>
            <p style={{ margin: '6px 0 0', color: '#991b1b', fontSize: '22px', fontWeight: 700 }}>
              {hardStats.solved}/{hardStats.total}
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong style={{ color: '#0f172a' }}>Overall Progress</strong>
            <span style={{ color: '#475569' }}>
              {totalSolved}/{totalProblems} solved
            </span>
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{
                width: `${overallPercent}%`,
                height: '100%',
                background: getProgressBarColor(overallPercent),
              }}
            />
          </div>
          <p style={{ marginBottom: 0, marginTop: '8px', color: '#64748b' }}>{overallPercent}% completed</p>
        </div>

        {topics.map((topic) => {
          const problems = topic.problems || [];
          const solved = problems.filter((problem) => problem.solved).length;
          const percent = problems.length ? Math.round((solved / problems.length) * 100) : 0;

          return (
            <div key={topic.id} style={styles.topicCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {editingTopicId === topic.id ? (
                    <>
                      <input
                        style={{ ...styles.input, width: '220px' }}
                        value={editingTopicName}
                        onChange={(e) => setEditingTopicName(e.target.value)}
                      />
                      <button
                        onClick={() => handleSaveTopic(topic.id)}
                        style={{
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          background: '#16a34a',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTopicId(null);
                          setEditingTopicName('');
                        }}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          background: '#fff',
                          color: '#334155',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>{topic.name}</h3>
                      <button
                        onClick={() => startEditTopic(topic)}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          background: '#fff',
                          color: '#334155',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        style={{
                          border: 'none',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          background: '#dc2626',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                <span style={{ color: '#64748b', fontSize: '14px' }}>
                  {solved}/{problems.length} solved
                </span>
              </div>

              <div style={{ ...styles.progressTrack, marginTop: '10px' }}>
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: getProgressBarColor(percent),
                  }}
                />
              </div>

              <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  style={{ ...styles.input, flex: '1 1 240px' }}
                  placeholder="Problem title"
                  value={newProblems[topic.id]?.title || ''}
                  onChange={(e) =>
                    setNewProblems((prev) => ({
                      ...prev,
                      [topic.id]: {
                        title: e.target.value,
                        leetcodeUrl: prev[topic.id]?.leetcodeUrl || '',
                        difficulty: prev[topic.id]?.difficulty || 'Easy',
                      },
                    }))
                  }
                />
                <input
                  style={{ ...styles.input, flex: '1 1 280px' }}
                  placeholder="LeetCode URL (optional)"
                  value={newProblems[topic.id]?.leetcodeUrl || ''}
                  onChange={(e) =>
                    setNewProblems((prev) => ({
                      ...prev,
                      [topic.id]: {
                        title: prev[topic.id]?.title || '',
                        leetcodeUrl: e.target.value,
                        difficulty: prev[topic.id]?.difficulty || 'Easy',
                      },
                    }))
                  }
                />
                <select
                  style={{ ...styles.input, width: '140px' }}
                  value={newProblems[topic.id]?.difficulty || 'Easy'}
                  onChange={(e) =>
                    setNewProblems((prev) => ({
                      ...prev,
                      [topic.id]: {
                        title: prev[topic.id]?.title || '',
                        leetcodeUrl: prev[topic.id]?.leetcodeUrl || '',
                        difficulty: e.target.value,
                      },
                    }))
                  }
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAddProblem(topic.id)}
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    background: '#0ea5e9',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Add Problem
                </button>
              </div>

              <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                {problems.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8' }}>No problems yet for this topic.</p>
                ) : (
                  problems.map((problem) => {
                    const colors = difficultyColor(problem.difficulty);
                    return (
                      <div
                        key={problem.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        {editingProblemId === problem.id ? (
                          <div style={{ display: 'grid', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <input
                                style={{ ...styles.input, flex: '1 1 220px' }}
                                value={editingProblemData.title}
                                onChange={(e) =>
                                  setEditingProblemData((prev) => ({ ...prev, title: e.target.value }))
                                }
                              />
                              <input
                                style={{ ...styles.input, flex: '1 1 240px' }}
                                value={editingProblemData.leetcodeUrl}
                                placeholder="LeetCode URL"
                                onChange={(e) =>
                                  setEditingProblemData((prev) => ({ ...prev, leetcodeUrl: e.target.value }))
                                }
                              />
                              <select
                                style={{ ...styles.input, width: '130px' }}
                                value={editingProblemData.difficulty}
                                onChange={(e) =>
                                  setEditingProblemData((prev) => ({ ...prev, difficulty: e.target.value }))
                                }
                              >
                                {difficulties.map((difficulty) => (
                                  <option key={difficulty} value={difficulty}>
                                    {difficulty}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <button
                                onClick={() => handleToggleSolved(topic.id, problem.id)}
                                style={{
                                  border: 'none',
                                  borderRadius: '999px',
                                  padding: '7px 12px',
                                  background: problem.solved ? '#22c55e' : '#64748b',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                {problem.solved ? 'Solved' : 'Unsolved'}
                              </button>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleSaveProblem(topic.id, problem.id)}
                                  style={{
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    background: '#16a34a',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProblemId(null);
                                    setEditingProblemData({ title: '', leetcodeUrl: '', difficulty: 'Easy' });
                                  }}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    background: '#fff',
                                    color: '#334155',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {problem.leetcode_url ? (
                                <a
                                  href={problem.leetcode_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  {problem.title}
                                </a>
                              ) : (
                                <span style={{ color: '#1e293b' }}>{problem.title}</span>
                              )}
                              <span
                                style={{
                                  background: colors.bg,
                                  color: colors.text,
                                  borderRadius: '999px',
                                  padding: '3px 9px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                {problem.difficulty}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleToggleSolved(topic.id, problem.id)}
                                style={{
                                  border: 'none',
                                  borderRadius: '999px',
                                  padding: '7px 12px',
                                  background: problem.solved ? '#22c55e' : '#64748b',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                {problem.solved ? 'Solved' : 'Unsolved'}
                              </button>
                              <button
                                onClick={() => startEditProblem(problem)}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '5px 9px',
                                  background: '#fff',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProblem(topic.id, problem.id)}
                                style={{
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '5px 9px',
                                  background: '#dc2626',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {showModal ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
            }}
          >
            <form
              onSubmit={handleAddTopic}
              style={{
                width: '100%',
                maxWidth: '420px',
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                boxSizing: 'border-box',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#0f172a' }}>Add New Topic</h3>
              <input
                style={styles.input}
                placeholder="e.g. Graphs"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                autoFocus
              />
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
