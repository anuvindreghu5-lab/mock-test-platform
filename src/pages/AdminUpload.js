import React, { useState } from "react";
import api from "../services/api";

const AdminUpload = () => {

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    total_duration_minutes: 60,
    marks_per_correct: 4,

    // NEGATIVE MARKING
    negative_marking_enabled: false,
    negative_marks: 1,

    category: "",
    difficulty_level: "medium",
  });

  const [jsonText, setJsonText] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [testId, setTestId] = useState(null);


  // ─────────────────────────────
  // INPUT CHANGE
  // ─────────────────────────────

  const handleInputChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };


  // ─────────────────────────────
  // CREATE TEST
  // ─────────────────────────────

  const handleCreateTest = async () => {

    setLoading(true);

    try {

      const response = await api.post(
        "/tests/",
        formData
      );

      setTestId(response.data.id);

      setMessage(
        "Test created successfully!"
      );

    } catch (error) {

      console.log(error);

      setMessage(
        error.response?.data?.error ||
        "Error creating test"
      );

    } finally {

      setLoading(false);
    }
  };


  // ─────────────────────────────
  // SAVE QUESTIONS
  // ─────────────────────────────

  const handleSaveQuestions = async () => {

    if (!testId) {

      setMessage(
        "Create test first"
      );

      return;
    }

    setLoading(true);

    try {

      let questions = JSON.parse(
        jsonText
      );

      if (!Array.isArray(questions)) {

        setMessage(
          "JSON must be an array"
        );

        setLoading(false);

        return;
      }

      const response = await api.post(

        `/tests/${testId}/bulk_questions/`,

        {
          questions,
        }

      );

      setMessage(
        response.data.message ||
        "Questions saved successfully!"
      );

    } catch (error) {

      console.log(error);

      setMessage(
        error.response?.data?.error ||
        "Invalid JSON or server error"
      );

    } finally {

      setLoading(false);
    }
  };


  // ─────────────────────────────
  // PUBLISH TEST
  // ─────────────────────────────

  const handlePublishTest = async () => {

    if (!testId) {

      setMessage(
        "No test created"
      );

      return;
    }

    setLoading(true);

    try {

      await api.post(
        `/tests/${testId}/publish/`
      );

      setMessage(
        "Test published successfully!"
      );

      setTestId(null);

      setJsonText("");

      setFormData({
        title: "",
        description: "",
        total_duration_minutes: 60,
        marks_per_correct: 4,

        negative_marking_enabled: false,
        negative_marks: 1,

        category: "",
        difficulty_level: "medium",
      });

    } catch (error) {

      console.log(error);

      setMessage(
        error.response?.data?.error ||
        "Error publishing test"
      );

    } finally {

      setLoading(false);
    }
  };


  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  return (

    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">

        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Create Mock Test
        </h1>

        {message && (

          <div
            className={`p-4 rounded mb-6 ${
              message.toLowerCase().includes("success")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {!testId ? (

          <div className="space-y-4">

            {/* TITLE */}

            <div>

              <label className="block text-gray-700 font-semibold mb-2">
                Test Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />

            </div>


            {/* DESCRIPTION */}

            <div>

              <label className="block text-gray-700 font-semibold mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                rows="4"
              />

            </div>


            {/* DURATION + MARKS */}

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block text-gray-700 font-semibold mb-2">
                  Duration (minutes)
                </label>

                <input
                  type="number"
                  name="total_duration_minutes"
                  value={formData.total_duration_minutes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />

              </div>

              <div>

                <label className="block text-gray-700 font-semibold mb-2">
                  Marks Per Correct
                </label>

                <input
                  type="number"
                  name="marks_per_correct"
                  value={formData.marks_per_correct}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />

              </div>

            </div>


            {/* NEGATIVE MARKING */}

            <div className="border p-4 rounded bg-gray-50">

              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  name="negative_marking_enabled"
                  checked={formData.negative_marking_enabled}
                  onChange={handleInputChange}
                />

                <label className="font-semibold text-gray-700">
                  Enable Negative Marking
                </label>

              </div>

              {formData.negative_marking_enabled && (

                <div className="mt-4">

                  <label className="block text-gray-700 font-semibold mb-2">
                    Negative Marks
                  </label>

                  <input
                    type="number"
                    name="negative_marks"
                    value={formData.negative_marks}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />

                </div>
              )}

            </div>


            {/* DIFFICULTY + CATEGORY */}

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block text-gray-700 font-semibold mb-2">
                  Difficulty
                </label>

                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="easy">
                    Easy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="hard">
                    Hard
                  </option>

                </select>

              </div>

              <div>

                <label className="block text-gray-700 font-semibold mb-2">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />

              </div>

            </div>


            {/* CREATE BUTTON */}

            <button
              onClick={handleCreateTest}
              disabled={!formData.title || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
            >
              {loading
                ? "Creating..."
                : "Create Test"}
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            <div className="p-4 bg-green-50 border border-green-200 rounded">

              <p className="text-green-800 font-semibold">
                Test Created! ID: {testId}
              </p>

            </div>


            {/* JSON INPUT */}

            <div>

              <label className="block text-gray-700 font-semibold mb-2">
                Paste Questions JSON
              </label>

              <textarea
                value={jsonText}
                onChange={(e) =>
                  setJsonText(e.target.value)
                }
                placeholder="Paste questions JSON here..."
                className="w-full h-[500px] px-4 py-3 border border-gray-300 rounded font-mono text-sm"
              />

            </div>


            {/* SAVE QUESTIONS */}

            <button
              onClick={handleSaveQuestions}
              disabled={!jsonText || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
            >
              {loading
                ? "Saving..."
                : "Save Questions"}
            </button>


            {/* PUBLISH */}

            <button
              onClick={handlePublishTest}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold"
            >
              {loading
                ? "Publishing..."
                : "Publish Test"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminUpload;