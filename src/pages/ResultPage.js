import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const ResultPage = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await api.get("/results/result_detail/", {
        params: { result_id: resultId },
      });

      setResult(response.data);
    } catch (error) {
      console.error("Error fetching result:", error);
    } finally {
      setLoading(false);
    }
  };

  // OPTION TEXT
const getOptionText = (question, answer) => {
  if (!answer || !question) return "Not Answered";
  return answer;
};
  // FORMAT TIME
  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;

    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white text-2xl">
        Loading...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white text-2xl">
        Result not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a,#0f172a)] p-4 md:p-6 text-white relative overflow-x-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* HEADER */}
        <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {result.test_title}
          </h1>

          <div
            className={`inline-flex items-center px-5 py-2 rounded-2xl text-sm font-bold ${
              result.is_passed
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {result.is_passed ? "✅ PASSED" : "❌ FAILED"}
          </div>
        </div>

        {/* SCORE CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <p className="text-gray-300 text-sm mb-2">🎯 Score</p>

            <h2 className="text-4xl font-bold text-blue-400">
              {result.obtained_marks}/{result.total_marks}
            </h2>
          </div>

          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <p className="text-gray-300 text-sm mb-2">📈 Percentage</p>

            <h2 className="text-4xl font-bold text-green-400">
              {result.percentage.toFixed(1)}%
            </h2>
          </div>

          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <p className="text-gray-300 text-sm mb-2">⏱ Time Taken</p>

            <h2 className="text-3xl font-bold text-purple-400">
              {formatTime(Number(result.time_taken_seconds))}
            </h2>
          </div>

          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <p className="text-gray-300 text-sm mb-2">🏆 Status</p>

            <h2
              className={`text-3xl font-bold ${
                result.is_passed ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.is_passed ? "Pass" : "Fail"}
            </h2>
          </div>
        </div>

        {/* SUMMARY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* ANSWER SUMMARY */}
          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <h2 className="text-2xl font-bold mb-6">
              📊 Answer Summary
            </h2>

            <div className="space-y-4">

              {[
                {
                  label: "Total Questions",
                  value: result.total_questions,
                  color: "text-white",
                },
                {
                  label: "Attempted",
                  value: result.attempted_questions,
                  color: "text-blue-400",
                },
                {
                  label: "Correct",
                  value: result.correct_answers,
                  color: "text-green-400",
                },
                {
                  label: "Wrong",
                  value: result.wrong_answers,
                  color: "text-red-400",
                },
                {
                  label: "Skipped",
                  value: result.skipped_questions,
                  color: "text-gray-300",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 rounded-2xl p-4 flex items-center justify-between"
                >
                  <span className="text-gray-300">
                    {item.label}
                  </span>

                  <span className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SUBJECT DISTRIBUTION */}
          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl h-[500px] overflow-y-auto">

            <h2 className="text-2xl font-bold mb-6 sticky top-0pb-4 z-10">
               Subject Distribution
            </h2>

            <div className="space-y-6">

              {Object.entries(result.subject_analysis || {}).map(
                ([subject, data]) => {
                  const attempted = data.correct + data.wrong;
                  const skipped = data.total - attempted;

                  const correctPercent =
                    (data.correct / data.total) * 100;

                  const wrongPercent =
                    (data.wrong / data.total) * 100;

                  const skippedPercent =
                    (skipped / data.total) * 100;

                  return (
                    <div
                      key={subject}
                      className="bg-white/5 border border-white/10 rounded-3xl p-5"
                    >

                      <div className="flex items-center justify-between mb-5">

                        <h3 className="text-2xl font-bold capitalize">
                          {subject}
                        </h3>

                        <span className="text-sm text-blue-400 font-semibold">
                          Attempted {attempted}/{data.total}
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/10 mb-5">

                        <div
                          className="bg-green-400"
                          style={{
                            width: `${correctPercent}%`,
                          }}
                        />

                        <div
                          className="bg-red-400"
                          style={{
                            width: `${wrongPercent}%`,
                          }}
                        />

                        <div
                          className="bg-gray-400"
                          style={{
                            width: `${skippedPercent}%`,
                          }}
                        />
                      </div>

                      {/* STATS */}
                      <div className="flex flex-wrap gap-4 text-sm">

                        <div className="flex items-center gap-2 text-green-300">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          Correct: {data.correct}
                        </div>

                        <div className="flex items-center gap-2 text-red-300">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          Wrong: {data.wrong}
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          Skipped: {skipped}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* ANSWER REVIEW */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

          {/* WRONG ANSWERS */}
          <div className="bg-white/10 border border-red-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-red-400 mb-5">
              ❌ Wrong Answers (
              {
                result.answers.filter(
                  (a) => a.selected_answer && !a.is_correct
                ).length
              }
              )
            </h2>

            <div className="space-y-5 max-h-[700px] overflow-y-auto pr-2">

              {result.answers
  .map((answer, originalIdx) => ({ ...answer, originalIdx }))
  .filter((a) => a.selected_answer && !a.is_correct)
  .map((answer, idx) => (
    <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
      <h4 className="text-lg font-bold mb-4">
        Q{answer.originalIdx + 1}. {answer.question.question_text}
      </h4>

                    <div className="space-y-3">

                      <div className="bg-red-500/10 rounded-2xl p-3 border border-red-500/20">
                        <p className="text-xs text-gray-400 mb-1">
                          Your Answer
                        </p>

                        <p className="text-red-300 font-semibold">
                          ❌{" "}
                          {getOptionText(
                            answer.question,
                            answer.selected_answer
                          )}
                        </p>
                      </div>

                      <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20">
                        <p className="text-xs text-gray-400 mb-1">
                          Correct Answer
                        </p>

                        <p className="text-green-300 font-semibold">
                          ✅{" "}
                          {getOptionText(
                            answer.question,
                            answer.question.correct_answer
                          )}
                        </p>
                      </div>

                      {answer.question.explanation && (
                        <div className="bg-blue-500/10 rounded-2xl p-3 border border-blue-500/20">

                          <p className="text-xs text-gray-400 mb-1">
                            Explanation
                          </p>

                          <p className="text-blue-200 text-sm">
                            {answer.question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* CORRECT ANSWERS */}
          <div className="bg-white/10 border border-green-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-green-400 mb-5">
              ✅ Correct Answers (
              {
                result.answers.filter((a) => a.is_correct)
                  .length
              }
              )
            </h2>

            <div className="space-y-5 max-h-[700px] overflow-y-auto pr-2">

              {result.answers
  .map((answer, originalIdx) => ({ ...answer, originalIdx }))
  .filter((a) => a.is_correct)
  .map((answer, idx) => (
    <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
      <h4 className="text-lg font-bold mb-4">
        Q{answer.originalIdx + 1}. {answer.question.question_text}
      </h4>
                    <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20">

                      <p className="text-xs text-gray-400 mb-1">
                        Your Answer
                      </p>

                      <p className="text-green-300 font-semibold">
                        ✅{" "}
                        {getOptionText(
                          answer.question,
                          answer.selected_answer
                        )}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* SKIPPED */}
          <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-gray-300 mb-5">
              ⏭️ Skipped Questions (
              {
                result.answers.filter(
                  (a) => !a.selected_answer
                ).length
              }
              )
            </h2>

            <div className="space-y-5 max-h-[700px] overflow-y-auto pr-2">

              {result.answers
  .map((answer, originalIdx) => ({ ...answer, originalIdx }))
  .filter((a) => !a.selected_answer)
  .map((answer, idx) => (
    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h4 className="text-lg font-bold mb-4">
        Q{answer.originalIdx + 1}. {answer.question.question_text}
      </h4>

                    <div className="space-y-3">

                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">

                        <p className="text-xs text-gray-400 mb-1">
                          Your Answer
                        </p>

                        <p className="text-gray-300 font-semibold">
                          ⏭️ Not Answered
                        </p>
                      </div>

                      <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20">

                        <p className="text-xs text-gray-400 mb-1">
                          Correct Answer
                        </p>

                        <p className="text-green-300 font-semibold">
                          ✅{" "}
                          {getOptionText(
                            answer.question,
                            answer.question.correct_answer
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col md:flex-row gap-4">

          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 font-semibold shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl font-semibold hover:bg-white/20 transition-all duration-300"
          >
            Print Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
