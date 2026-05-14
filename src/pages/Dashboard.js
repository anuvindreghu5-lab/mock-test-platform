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
      console.log("TEST RESPONSE:", testsRes.data);

      setTests(testsRes.data);
      setResults(resultsRes.data.slice(0, 5)); // Last 5 results
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

  if (loading)
    return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">📚 Mock Text</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Tests Available</p>
            <p className="text-3xl font-bold text-blue-600">{tests.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Tests Completed</p>
            <p className="text-3xl font-bold text-green-600">{user?.total_tests_taken || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Score</p>
            <p className="text-3xl font-bold text-purple-600">{user?.total_score || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Avg Percentage</p>
            <p className="text-3xl font-bold text-orange-600">
              {results.length > 0
                ? (
                    results.reduce((sum, r) => sum + r.percentage, 0) /
                    results.length
                  ).toFixed(1)
                : "0"}%
            </p>
          </div>
        </div>

        {/* Available Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Tests</h2>
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {test.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {test.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span>⏱️ {test.total_duration_minutes} mins</span>
                    <span>📊 {test.total_questions} questions</span>
                    <span>📈 {test.difficulty_level}</span>
                  </div>
                  <button
                    onClick={() => handleStartTest(test.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Results</h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-white p-6 rounded-lg shadow"
                >
                  <h3 className="font-bold text-gray-800 mb-2">
                    {result.test_title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {result.obtained_marks}/{result.total_marks}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Percentage</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
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