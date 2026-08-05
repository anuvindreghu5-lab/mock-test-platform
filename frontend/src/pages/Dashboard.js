import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getUser, clearTokens } from "../utils/auth";
import {
  examCategories,
  CHAPTER_FOLDER_CATEGORIES,
  TREE_CATEGORIES,
} from "../config/examCategories";
import { CONTENT_TREES, GOETHE_JLPT_MAIN_TREE, GOETHE_JLPT_PYQ_TREE } from "../config/contentTrees";
import {
  LEVEL_EXAM_CATEGORIES,
  getLevelExamTabs,
  getDefaultTabForCategory,
  getTestTypeForLevelExamTab,
  isLevelExamBrowseTab,
} from "../config/levelExamConfig";
import ContentTreeBrowser from "../components/ContentTreeBrowser";
import FolderCard from "../components/FolderCard";
import TestCard from "../components/TestCard";
import { isNewTest } from "../utils/isNewTest";

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState("latest");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const navigate = useNavigate();

  const resetFolderBrowse = () => {
    setSelectedSubject(null);
    setSelectedChapter(null);
    setFolderPath([]);
  };

  const hasChapterFolders = (categoryKey) =>
    CHAPTER_FOLDER_CATEGORIES.includes(categoryKey);

  const hasContentTree = (categoryKey) => TREE_CATEGORIES.includes(categoryKey);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const currentUser = getUser();
      setUser(currentUser);
      const [testsRes, resultsRes] = await Promise.all([
        api.get("/tests/"),
        api.get("/results/my_results/"),
      ]);
      setTests(testsRes.data);
      setResults(resultsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { clearTokens(); navigate("/"); };

  // ── Filters ──
  const getTestsByCategory = (categoryKey) =>
    tests.filter(t => t.category === categoryKey);

  const getTestsByType = (categoryKey, type) =>
    tests.filter(t => t.category === categoryKey && t.test_type === type);

  // ✅ Latest = tests uploaded in last 7 days (any type)
  const getFilteredTests = (categoryKey, type) => {
    if (type === "latest") {
      return getTestsByCategory(categoryKey)
        .filter(t => isNewTest(t.created_at))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return getTestsByType(categoryKey, type);
  };

  const getSubjects = (categoryKey) => {
    const subjectTests = tests.filter(
      t => t.category === categoryKey && t.test_type === "subject" && t.subject
    );
    return [...new Set(subjectTests.map(t => t.subject))];
  };

  const getChapters = (categoryKey, subject) =>
    tests.filter(t => t.category === categoryKey && t.subject === subject && t.test_type === "subject");

  // Chapter Wise folder helpers (NEET, IMUCET, JEE)
  const getChapterWiseTests = (categoryKey) =>
    tests.filter(t => t.category === categoryKey && t.test_type === "chapter");

  const getChapterWiseSubjects = (categoryKey) => {
    const chapterTests = getChapterWiseTests(categoryKey).filter(t => t.subject);
    return [...new Set(chapterTests.map(t => t.subject))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  };

  const getChapterWiseChapters = (categoryKey, subject) => {
    const chapterTests = getChapterWiseTests(categoryKey).filter(t => t.subject === subject);
    const named = [...new Set(chapterTests.map(t => t.chapter).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    if (chapterTests.some(t => !t.chapter)) named.push("__other__");
    return named;
  };

  const getChapterWiseTestsInFolder = (categoryKey, subject, chapterKey) =>
    getChapterWiseTests(categoryKey).filter(t => {
      if (t.subject !== subject) return false;
      if (chapterKey === "__other__") return !t.chapter;
      return t.chapter === chapterKey;
    });

  // ── Stats ──
  const totalCompleted = results.length;
  const totalScore = results.reduce((sum, r) => sum + r.obtained_marks, 0);
  const avgPercentage = results.length > 0
    ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <img src="/rankpilot-logo.png" alt="logo" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-cyan-400 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "latest", label: "🆕 Latest" },
    { key: "pyq", label: "📅 Previous Year" },
    { key: "subject", label: "📖 Subject Wise" },
    { key: "chapter", label: "📝 Chapter Wise" },
    { key: "full", label: "📋 Full Mock" },
  ];

  const tabTitles = {
    latest: "🆕 Latest Tests",
    pyq: "📅 Previous Year Questions",
    chapter: "📝 Chapter Wise Tests",
    full: "📋 Full Mock Tests",
  };

  const categoryData = examCategories.find(c => c.key === selectedCategory);
  const isLevelExam = LEVEL_EXAM_CATEGORIES.includes(selectedCategory);
  const categoryTabs = isLevelExam ? getLevelExamTabs(selectedCategory) : tabs;
  const activeTree =
    isLevelExam && isLevelExamBrowseTab(selectedTestType)
      ? selectedTestType === "pyq"
        ? GOETHE_JLPT_PYQ_TREE
        : GOETHE_JLPT_MAIN_TREE
      : hasContentTree(selectedCategory)
        ? CONTENT_TREES[selectedCategory]
        : null;

  const renderCategoryGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
      {examCategories.map((cat) => {
        const catTests = getTestsByCategory(cat.key);
        const newTests = catTests.filter((t) => isNewTest(t.created_at));
        return (
          <div
            key={cat.key}
            onClick={() => {
              setSelectedCategory(cat.key);
              setSelectedTestType(getDefaultTabForCategory(cat.key));
              resetFolderBrowse();
              setActiveView("category");
            }}
            className={`${cat.bg} border ${cat.border} rounded-3xl p-5 cursor-pointer hover:scale-105 transition-all duration-300 group relative`}
          >
            {newTests.length > 0 && (
              <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                🆕 {newTests.length} New
              </span>
            )}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
              {cat.icon}
            </div>
            <h3 className="text-lg font-black text-white mb-1">{cat.name}</h3>
            <p className="text-xs text-gray-400">{catTests.length} tests available</p>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a,#0f172a)] text-white overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/10 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="logo" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">RankAura</h1>
              <p className="text-gray-300 text-xs">Premium Online Examination Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-gray-300 text-sm">Welcome back</span>
              <span className="font-semibold text-white">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 transition-all duration-300 shadow-lg hover:scale-105">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {[
            { label: "📘 Tests Available", value: tests.length, color: "text-blue-400" },
            { label: "✅ Tests Completed", value: totalCompleted, color: "text-green-400" },
            { label: "🏆 Total Score", value: totalScore, color: "text-purple-400" },
            { label: "📈 Avg Percentage", value: `${avgPercentage}%`, color: "text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-gray-300 text-sm mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ─── HOME VIEW ─── */}
        {activeView === "home" && (
          <>
            <h2 className="text-3xl font-bold mb-4">Exams</h2>
            {renderCategoryGrid()}

            <h2 className="text-3xl font-bold mb-6">Recent Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.length === 0 && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-gray-300 col-span-2">
                  No results yet! Take a test to see your results.
                </div>
              )}
              {results.map((result) => (
                <div 
                  key={result.id} 
                  onClick={() => navigate(`/result/${result.id}`)}
                  className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-white mb-4">{result.test_title}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-gray-400 text-sm mb-1">Score</p>
                      <p className="text-2xl font-bold text-blue-400">{result.obtained_marks}/{result.total_marks}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-gray-400 text-sm mb-1">Percentage</p>
                      <p className="text-2xl font-bold text-green-400">{result.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    ✅ Correct: {result.correct_answers} | ❌ Wrong: {result.wrong_answers} | ⏭️ Skipped: {result.skipped_questions}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── CATEGORY VIEW ─── */}
        {activeView === "category" && categoryData && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <button onClick={() => setActiveView("home")} className="hover:text-cyan-400 transition">Dashboard</button>
              <span>›</span>
              <span className="text-white font-semibold">{categoryData.name}</span>
            </div>

            <div className={`${categoryData.bg} border ${categoryData.border} rounded-3xl p-6 mb-8 flex items-center gap-4`}>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryData.color} flex items-center justify-center text-3xl`}>
                {categoryData.icon}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{categoryData.name}</h2>
                <p className="text-gray-400">{getTestsByCategory(selectedCategory).length} tests available</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setSelectedTestType(tab.key); resetFolderBrowse(); setActiveView("category"); }}
                  className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                    selectedTestType === tab.key
                      ? `bg-gradient-to-r ${categoryData.color} text-white shadow-lg`
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subject Wise (not on Goethe / JLPT) */}
            {!isLevelExam && selectedTestType === "subject" && (
              <>
                <h3 className="text-2xl font-bold mb-5">Select Subject</h3>
                {getSubjects(selectedCategory).length === 0 ? (
                  <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                    No subject wise tests available yet!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getSubjects(selectedCategory).map((subject) => {
                      const chapters = getChapters(selectedCategory, subject);
                      return (
                        <div
                          key={subject}
                          onClick={() => { setSelectedSubject(subject); setActiveView("subject"); }}
                          className={`${categoryData.bg} border ${categoryData.border} rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all duration-300`}
                        >
                          <div className="text-3xl mb-3">📖</div>
                          <h4 className="text-lg font-black text-white mb-1 capitalize">{subject}</h4>
                          <p className="text-xs text-gray-400">{chapters.length} tests</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Goethe / JLPT folder browse + PYQs */}
            {isLevelExam && isLevelExamBrowseTab(selectedTestType) && activeTree && (
              <ContentTreeBrowser
                tree={activeTree}
                tests={tests}
                categoryKey={selectedCategory}
                categoryData={categoryData}
                folderPath={folderPath}
                setFolderPath={setFolderPath}
                testType={getTestTypeForLevelExamTab(selectedTestType)}
                onStartTest={(id) => navigate(`/test/${id}`)}
              />
            )}

            {/* Chapter Wise (other exams) */}
            {!isLevelExam && selectedTestType === "chapter" && (
              <>
                {hasContentTree(selectedCategory) && CONTENT_TREES[selectedCategory] ? (
                  <ContentTreeBrowser
                    tree={CONTENT_TREES[selectedCategory]}
                    tests={tests}
                    categoryKey={selectedCategory}
                    categoryData={categoryData}
                    folderPath={folderPath}
                    setFolderPath={setFolderPath}
                    testType="chapter"
                    onStartTest={(id) => navigate(`/test/${id}`)}
                  />
                ) : (
              <>
                {hasChapterFolders(selectedCategory) && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
                    <button type="button" onClick={resetFolderBrowse} className={`hover:text-cyan-400 transition ${!selectedSubject ? "text-white font-semibold" : ""}`}>All Subjects</button>
                    {selectedSubject && (<><span>›</span><button type="button" onClick={() => setSelectedChapter(null)} className={`hover:text-cyan-400 transition capitalize ${!selectedChapter ? "text-white font-semibold" : ""}`}>{selectedSubject}</button></>)}
                    {selectedChapter && (<><span>›</span><span className="text-white font-semibold capitalize">{selectedChapter === "__other__" ? "Other" : selectedChapter}</span></>)}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-5">
                  {hasChapterFolders(selectedCategory)
                    ? selectedChapter ? `📂 ${selectedChapter === "__other__" ? "Other" : selectedChapter}` : selectedSubject ? `📁 ${selectedSubject} — Chapters` : "📁 Select Subject"
                    : "📝 Chapter Wise Tests"}
                </h3>
                {getChapterWiseTests(selectedCategory).length === 0 ? (
                  <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                    No chapter wise tests available yet!
                  </div>
                ) : hasChapterFolders(selectedCategory) ? (
                  <>
                    {!selectedSubject && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getChapterWiseSubjects(selectedCategory).map((subject) => {
                          const chapterCount = getChapterWiseChapters(selectedCategory, subject).length;
                          const testCount = getChapterWiseTests(selectedCategory).filter(t => t.subject === subject).length;
                          return (
                            <FolderCard
                              key={subject}
                              title={subject}
                              subtitle={`${chapterCount} chapter${chapterCount !== 1 ? "s" : ""} · ${testCount} test${testCount !== 1 ? "s" : ""}`}
                              categoryData={categoryData}
                              onClick={() => { setSelectedSubject(subject); setSelectedChapter(null); }}
                            />
                          );
                        })}
                      </div>
                    )}
                    {selectedSubject && !selectedChapter && (
                      getChapterWiseChapters(selectedCategory, selectedSubject).length === 0 ? (
                        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">No chapters in this subject yet!</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {getChapterWiseChapters(selectedCategory, selectedSubject).map((chapterKey) => {
                            const chapterLabel = chapterKey === "__other__" ? "Other" : chapterKey;
                            const testCount = getChapterWiseTestsInFolder(selectedCategory, selectedSubject, chapterKey).length;
                            return (
                              <FolderCard
                                key={chapterKey}
                                title={chapterLabel}
                                subtitle={`${testCount} test${testCount !== 1 ? "s" : ""}`}
                                categoryData={categoryData}
                                onClick={() => setSelectedChapter(chapterKey)}
                                isChapter
                              />
                            );
                          })}
                        </div>
                      )
                    )}
                    {selectedSubject && selectedChapter && (
                      getChapterWiseTestsInFolder(selectedCategory, selectedSubject, selectedChapter).length === 0 ? (
                        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">No tests in this chapter yet!</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {getChapterWiseTestsInFolder(selectedCategory, selectedSubject, selectedChapter).map((test) => (
                            <TestCard key={test.id} test={test} categoryData={categoryData} onStart={() => navigate(`/test/${test.id}`)} />
                          ))}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {getTestsByType(selectedCategory, "chapter").map((test) => (
                      <TestCard key={test.id} test={test} categoryData={categoryData} onStart={() => navigate(`/test/${test.id}`)} />
                    ))}
                  </div>
                )}
              </>
                )}
              </>
            )}

            {/* Latest / Full (Goethe & JLPT) */}
            {isLevelExam && (selectedTestType === "latest" || selectedTestType === "full") && (
              <>
                <h3 className="text-2xl font-bold mb-5">
                  {selectedTestType === "latest" ? "🆕 Latest Tests" : "📋 Full Mock Tests"}
                </h3>
                {getFilteredTests(selectedCategory, selectedTestType).length === 0 ? (
                  <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                    {selectedTestType === "latest" ? "No new tests in last 7 days!" : "No full mock tests yet!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {getFilteredTests(selectedCategory, selectedTestType).map((test) => (
                      <TestCard key={test.id} test={test} categoryData={categoryData} onStart={() => navigate(`/test/${test.id}`)} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Latest / PYQ / Full (other exams) */}
            {!isLevelExam && selectedTestType !== "subject" && selectedTestType !== "chapter" && (
              <>
                <h3 className="text-2xl font-bold mb-5">{tabTitles[selectedTestType] || "Tests"}</h3>
                {getFilteredTests(selectedCategory, selectedTestType).length === 0 ? (
                  <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                    {selectedTestType === "latest" ? "No new tests in last 7 days!" : "No tests available yet!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {getFilteredTests(selectedCategory, selectedTestType).map((test) => (
                      <TestCard key={test.id} test={test} categoryData={categoryData} onStart={() => navigate(`/test/${test.id}`)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── SUBJECT VIEW ─── */}
        {activeView === "subject" && categoryData && selectedSubject && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
              <button onClick={() => setActiveView("home")} className="hover:text-cyan-400 transition">Dashboard</button>
              <span>›</span>
              <button onClick={() => { setActiveView("category"); setSelectedTestType("subject"); }} className="hover:text-cyan-400 transition">{categoryData.name}</button>
              <span>›</span>
              <span className="text-white font-semibold capitalize">{selectedSubject}</span>
            </div>

            <div className={`${categoryData.bg} border ${categoryData.border} rounded-3xl p-6 mb-8`}>
              <h2 className="text-3xl font-black text-white capitalize mb-1">{selectedSubject}</h2>
              <p className="text-gray-400">{getChapters(selectedCategory, selectedSubject).length} tests available</p>
            </div>

            <h3 className="text-2xl font-bold mb-5">📖 Chapter Wise Tests</h3>
            {getChapters(selectedCategory, selectedSubject).length === 0 ? (
              <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                No chapters available yet!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {getChapters(selectedCategory, selectedSubject).map((test) => (
                  <TestCard key={test.id} test={test} categoryData={categoryData} onStart={() => navigate(`/test/${test.id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default Dashboard;