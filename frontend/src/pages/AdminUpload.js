import React, { useState } from "react";
import api, { API_BASE_URL } from "../services/api";
import { examCategories } from "../config/examCategories";
import {
  isLevelExamCategory,
  LEVEL_FOLDER_OPTIONS,
  PYQ_FOLDER_OPTIONS,
  getSkillFoldersForLevel,
  LEVEL_EXAM_TEST_TYPES,
  STANDARD_TEST_TYPES,
} from "../config/levelExamConfig";

const INITIAL_FORM = {
  title: "",
  description: "",
  total_duration_minutes: 60,
  marks_per_correct: 4,
  negative_marking_enabled: false,
  negative_marks: 1,
  category: "",
  test_type: "full",
  subject: "",
  chapter: "",
  year: "",
  difficulty_level: "medium",
};

const selectClass =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400";

const AdminUpload = () => {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [useCustomFolder, setUseCustomFolder] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [uploadMode, setUploadMode] = useState("pdf");
  const [pdfFile, setPdfFile] = useState(null);
  const [answerKeyPage, setAnswerKeyPage] = useState("last");
  const [freePdfMode, setFreePdfMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [testId, setTestId] = useState(null);

  const isLevelExam = isLevelExamCategory(formData.category);
  const skillFolderOptions = formData.subject
    ? getSkillFoldersForLevel(formData.subject)
    : [];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setUseCustomFolder(false);
    setFormData({
      ...formData,
      category,
      subject: "",
      chapter: "",
      year: "",
      test_type: isLevelExamCategory(category) ? "chapter" : "full",
    });
  };

  const handleTestTypeChange = (e) => {
    const test_type = e.target.value;
    setUseCustomFolder(false);
    setFormData({
      ...formData,
      test_type,
      subject: "",
      chapter: "",
      year: test_type === "pyq" ? formData.year : "",
    });
  };

  const handleLevelFolderChange = (e) => {
    const subject = e.target.value;
    setFormData({
      ...formData,
      subject,
      chapter: "",
    });
  };

  const handleSkillFolderChange = (e) => {
    setFormData({
      ...formData,
      chapter: e.target.value,
    });
  };

  const handlePyqFolderChange = (e) => {
    setFormData({
      ...formData,
      subject: e.target.value,
      chapter: "",
    });
  };

  const validateForm = () => {
    if (!formData.title || !formData.category) return "Title and category are required.";

    if (isLevelExam) {
      if (formData.test_type === "chapter") {
        if (!formData.subject) return "Select a level folder.";
        if (!formData.chapter) return "Select a skill folder.";
      }
      if (formData.test_type === "pyq" && !formData.subject) {
        return "Select a PYQ folder (e.g. N5 PYQ).";
      }
    } else if (formData.test_type === "subject" && !formData.subject) {
      return "Subject is required for subject-wise tests.";
    }

    return null;
  };

  const handleCreateTest = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      const cleanedData = {
        ...formData,
        year: formData.year === "" ? null : parseInt(formData.year, 10),
      };
      const response = await api.post("/tests/", cleanedData);
      setTestId(response.data.id);
      setMessage("Test created successfully!");
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.error ||
          JSON.stringify(error.response?.data) ||
          "Error creating test"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!testId) {
      setMessage("Create test first");
      return;
    }
    if (!pdfFile) {
      setMessage("Please select a PDF file");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("pdf_file", pdfFile);
      form.append("answer_key_page", answerKeyPage);
      form.append("skip_gemini", freePdfMode ? "true" : "false");

      const response = await api.post(`/tests/${testId}/upload_pdf/`, form, {
        timeout: 300000,
      });

      setMessage(
        response.data.message ||
          `Uploaded ${response.data.total_questions} questions from PDF (image mode).`
      );
      setPdfFile(null);
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      const serverError =
        (typeof data === "string" && data) ||
        data?.error ||
        data?.detail ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors.join(", ")) ||
        (typeof data === "object" && data !== null
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null);
      setMessage(
        serverError ||
          (error.message === "Network Error"
            ? `Cannot reach the API at ${API_BASE_URL}. If developing locally: run "python manage.py runserver" in backend/, add frontend/.env.local with REACT_APP_API_URL=http://127.0.0.1:8000/api, then restart npm start.`
            : error.message) ||
          "PDF upload failed. Try free mode (checkbox on) or set GEMINI_API_KEY on the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!testId) {
      setMessage("Create test first");
      return;
    }
    setLoading(true);
    try {
      const questions = JSON.parse(jsonText);
      if (!Array.isArray(questions)) {
        setMessage("JSON must be an array");
        setLoading(false);
        return;
      }
      const response = await api.post(`/tests/${testId}/bulk_questions/`, { questions });
      setMessage(response.data.message || "Questions saved successfully!");
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "Invalid JSON or server error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTest = async () => {
    if (!testId) {
      setMessage("No test created");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/tests/${testId}/publish/`);
      setMessage("Test published successfully!");
      setTestId(null);
      setJsonText("");
      setPdfFile(null);
      setUploadMode("pdf");
      setUseCustomFolder(false);
      setFormData({ ...INITIAL_FORM });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "Error publishing test");
    } finally {
      setLoading(false);
    }
  };

  const testTypeOptions = isLevelExam ? LEVEL_EXAM_TEST_TYPES : STANDARD_TEST_TYPES;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 text-white">
      <div className="max-w-3xl mx-auto bg-white/10 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Create Mock Test</h1>
        <p className="text-gray-400 text-sm mb-6">Fill in the details and upload questions</p>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 font-semibold ${
              message.toLowerCase().includes("success")
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        {!testId ? (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Test Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={
                  isLevelExam
                    ? "e.g. N5 Vocabulary Test — Set 1"
                    : "e.g. Kerala PSC LDC 2023 Previous Year Paper"
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the test..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Exam Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className={selectClass}
                >
                  <option value="" className="bg-gray-900">
                    Select Category
                  </option>
                  {examCategories.map((cat) => (
                    <option key={cat.key} value={cat.key} className="bg-gray-900">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                  <option value="other" className="bg-gray-900">
                    📚 Other
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">Test Type *</label>
                <select
                  name="test_type"
                  value={formData.test_type}
                  onChange={handleTestTypeChange}
                  className={selectClass}
                >
                  {testTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLevelExam && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-100">
                <p className="font-semibold mb-1">
                  {formData.category === "goethe" ? "🇩🇪 Goethe" : "🇯🇵 JLPT"} upload
                </p>
                <p className="text-amber-200/80">
                  Choose folders from the list so tests appear in the correct place on the dashboard.
                  Use custom names only if you need a folder that is not in the list yet.
                </p>
              </div>
            )}

            {/* Goethe / JLPT — skill folders (chapter type) */}
            {isLevelExam && formData.test_type === "chapter" && (
              <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-cyan-300 font-semibold text-sm">📁 Goethe / JLPT skill folders</p>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomFolder}
                    onChange={(e) => {
                      setUseCustomFolder(e.target.checked);
                      setFormData({ ...formData, subject: "", chapter: "" });
                    }}
                    className="w-4 h-4"
                  />
                  Type folder names manually (advanced)
                </label>

                {!useCustomFolder ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Level folder *</label>
                      <select
                        value={formData.subject}
                        onChange={handleLevelFolderChange}
                        className={selectClass}
                      >
                        <option value="" className="bg-gray-900">
                          Select level…
                        </option>
                        {LEVEL_FOLDER_OPTIONS.map((name) => (
                          <option key={name} value={name} className="bg-gray-900">
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Skill folder *</label>
                      <select
                        value={formData.chapter}
                        onChange={handleSkillFolderChange}
                        disabled={!formData.subject}
                        className={`${selectClass} disabled:opacity-50`}
                      >
                        <option value="" className="bg-gray-900">
                          {formData.subject ? "Select skill…" : "Select level first"}
                        </option>
                        {skillFolderOptions.map((name) => (
                          <option key={name} value={name} className="bg-gray-900">
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Level (subject) *</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="e.g. N5 Beginner"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Skill (chapter) *</label>
                      <input
                        type="text"
                        name="chapter"
                        value={formData.chapter}
                        onChange={handleInputChange}
                        placeholder="e.g. N5 Vocabulary Test"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {formData.subject && formData.chapter && !useCustomFolder && (
                  <p className="text-xs text-gray-400">
                    Dashboard path: <span className="text-cyan-300">{formData.subject}</span>
                    {" → "}
                    <span className="text-cyan-300">{formData.chapter}</span>
                  </p>
                )}
              </div>
            )}

            {/* Goethe / JLPT — PYQ folders */}
            {isLevelExam && formData.test_type === "pyq" && (
              <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-cyan-300 font-semibold text-sm">📅 PYQ folder</p>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Select PYQ folder *</label>
                  <select
                    value={formData.subject}
                    onChange={handlePyqFolderChange}
                    className={selectClass}
                  >
                    <option value="" className="bg-gray-900">
                      Select PYQ level…
                    </option>
                    {PYQ_FOLDER_OPTIONS.map((name) => (
                      <option key={name} value={name} className="bg-gray-900">
                        {name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    Appears under the <strong>PYQs</strong> tab on the {formData.category === "goethe" ? "Goethe" : "JLPT"} dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Goethe / JLPT — latest & full (no folders) */}
            {isLevelExam && (formData.test_type === "latest" || formData.test_type === "full") && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-300">
                This test will show under the{" "}
                <strong>{formData.test_type === "latest" ? "Latest" : "Full Mock"}</strong> tab. No folder selection needed.
              </div>
            )}

            {/* Other exams — subject / chapter */}
            {!isLevelExam &&
              (formData.test_type === "subject" || formData.test_type === "chapter") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g. Physics, Maths"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  {formData.test_type === "chapter" && (
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Chapter</label>
                      <input
                        type="text"
                        name="chapter"
                        value={formData.chapter}
                        onChange={handleInputChange}
                        placeholder="e.g. Chapter 1 - Motion"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              )}

            {/* Other exams — PYQ year */}
            {!isLevelExam && formData.test_type === "pyq" && (
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g. 2023"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  name="total_duration_minutes"
                  value={formData.total_duration_minutes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Marks Per Correct</label>
                <input
                  type="number"
                  name="marks_per_correct"
                  value={formData.marks_per_correct}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="border border-white/10 p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="negative_marking_enabled"
                  checked={formData.negative_marking_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <label className="font-semibold text-gray-300">Enable Negative Marking</label>
              </div>
              {formData.negative_marking_enabled && (
                <div className="mt-4">
                  <label className="block text-gray-300 font-semibold mb-2">Negative Marks</label>
                  <input
                    type="number"
                    name="negative_marks"
                    value={formData.negative_marks}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Difficulty</label>
              <select
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleInputChange}
                className={selectClass}
              >
                <option value="easy" className="bg-gray-900">
                  Easy
                </option>
                <option value="medium" className="bg-gray-900">
                  Medium
                </option>
                <option value="hard" className="bg-gray-900">
                  Hard
                </option>
              </select>
            </div>

            <button
              onClick={handleCreateTest}
              disabled={!formData.title || !formData.category || loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Test →"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
              <p className="text-green-300 font-semibold">✅ Test Created! ID: {testId}</p>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              <button type="button" onClick={() => setUploadMode("pdf")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${uploadMode === "pdf" ? "bg-gradient-to-r from-amber-500 to-orange-400 text-white" : "text-gray-400 hover:text-white"}`}>📄 Upload PDF</button>
              <button type="button" onClick={() => setUploadMode("json")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${uploadMode === "json" ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white" : "text-gray-400 hover:text-white"}`}>📋 Paste JSON</button>
            </div>

            {uploadMode === "pdf" && (
              <div className="space-y-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={freePdfMode} onChange={(e) => setFreePdfMode(e.target.checked)} className="mt-1 h-4 w-4 rounded" />
                  <span className="text-sm text-green-100"><strong>Free mode (recommended)</strong> — no Gemini API. Splits text PDFs by question number when possible.</span>
                </label>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">PDF file *</label>
                  <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Answer key page</label>
                  <select value={answerKeyPage} onChange={(e) => setAnswerKeyPage(e.target.value)} className={selectClass}>
                    <option value="last" className="bg-gray-900">Last page is answer key</option>
                    <option value="first" className="bg-gray-900">First page is answer key</option>
                    <option value="none" className="bg-gray-900">No separate answer key page</option>
                  </select>
                </div>
                <button type="button" onClick={handleUploadPdf} disabled={!pdfFile || loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50">
                  {loading ? "Processing PDF…" : freePdfMode ? "Upload PDF (free) →" : "Upload PDF (AI) →"}
                </button>
              </div>
            )}

            {uploadMode === "json" && (
              <>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                  <p className="font-semibold mb-2">📋 JSON format</p>
              <pre className="text-xs overflow-x-auto">{`[
  {
    "number": 1,
    "subject": "General Knowledge",
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "type": "mcq",
    "answer": "A"
  }
]`}</pre>
            </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Paste questions JSON</label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste questions JSON here..."
                className="w-full h-[400px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleSaveQuestions}
              disabled={!jsonText || loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save questions from JSON"}
                </button>
              </>
            )}

            <button
              onClick={handlePublishTest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Publishing..." : "✅ Publish Test"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpload;
