import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getUser, clearTokens } from "../utils/auth";

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentUser = getUser();
      setUser(currentUser);

      const [testsRes, resultsRes] = await Promise.all([
        api.get("/tests/"),
        api.get("/results/my_results/"),
      ]);

      setTests(testsRes.data);

      const allResults = resultsRes.data;
      setResults(allResults.slice(0, 5));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}`);
  };

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  // Calculate stats from results
  const totalCompleted = results.length;
  const totalScore = results.reduce((sum, r) => sum + r.obtained_marks, 0);
  const avgPercentage = results.length > 0
    ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
    : "0";

  if (loading) {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white">
      <div className="text-center">

        <img
          src="/logo.png"
          alt="logo"
          className="w-16 h-16 mx-auto mb-4 animate-pulse"
        />

        <p className="text-cyan-400 text-lg font-semibold">
          Loading...
        </p>

      </div>
    </div>
  );
}

  return (
   <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a,#0f172a)] text-white overflow-hidden relative">

  {/* Background Glow */}
  <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full"></div>
  <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/10 blur-3xl rounded-full"></div>

  {/* Header */}
  <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      
      <div className="flex items-center gap-3">

  <img
    src="/logo.png"
    alt="logo"
    className="w-10 h-10"
  />

  <div>
    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
      RankPilot
    </h1>

    <p className="text-gray-300 text-sm">
      Premium Online Examination Portal
    </p>
  </div>

</div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-gray-300 text-sm">Welcome back</span>
          <span className="font-semibold text-white">
            {user?.username}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 transition-all duration-300 shadow-lg hover:scale-105"
        >
          Logout
        </button>
      </div>
    </div>
  </header>

  <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-blue-500/20 transition-all duration-300">
        <p className="text-gray-300 text-sm mb-2">📘 Tests Available</p>
        <p className="text-4xl font-bold text-blue-400">
          {tests.length}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-green-500/20 transition-all duration-300">
        <p className="text-gray-300 text-sm mb-2">✅ Tests Completed</p>
        <p className="text-4xl font-bold text-green-400">
          {totalCompleted}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-purple-500/20 transition-all duration-300">
        <p className="text-gray-300 text-sm mb-2">🏆 Total Score</p>
        <p className="text-4xl font-bold text-purple-400">
          {totalScore}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-orange-500/20 transition-all duration-300">
        <p className="text-gray-300 text-sm mb-2">📈 Avg Percentage</p>
        <p className="text-4xl font-bold text-orange-400">
          {avgPercentage}%
        </p>
      </div>
    </div>

    {/* Main Sections */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Available Tests */}
      <div>
        <h2 className="text-3xl font-bold mb-6">
          Available Tests
        </h2>

        <div className="space-y-5">

          {tests.length === 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-gray-300">
              No tests available yet!
            </div>
          )}

          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-blue-500/20 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                {test.title}
              </h3>

              <p className="text-gray-300 text-sm mb-5">
                {test.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-5">
                <span>⏱️ {test.total_duration_minutes} mins</span>
                <span>📊 {test.total_questions} questions</span>
                <span>📈 {test.difficulty_level}</span>
              </div>

              <button
                onClick={() => handleStartTest(test.id)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 font-semibold text-white shadow-lg hover:scale-[1.02] hover:shadow-blue-500/40 transition-all duration-300"
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div>
        <h2 className="text-3xl font-bold mb-6">
          Recent Results
        </h2>

        <div className="space-y-5">

          {results.length === 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-gray-300">
              No results yet! Take a test to see your results.
            </div>
          )}

          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-green-500/20 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold text-white mb-5">
                {result.test_title}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">

                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Score</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {result.obtained_marks}/{result.total_marks}
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Percentage</p>
                  <p className="text-3xl font-bold text-green-400">
                    {result.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Correct: {result.correct_answers} | Wrong:{" "}
                {result.wrong_answers} | Skipped:{" "}
                {result.skipped_questions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default Dashboard;