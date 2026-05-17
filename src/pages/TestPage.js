import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Timer from "../components/Timer";
import QuestionPalette from "../components/QuestionPalette";
import Navigation from "../components/Navigation";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ─────────────────────────────────────────────
// MATH TEXT RENDERER
// ─────────────────────────────────────────────
const MathText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try {
            return <BlockMath key={i} math={part.slice(2, -2)} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          try {
            return <InlineMath key={i} math={part.slice(1, -1)} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
const [questions, setQuestions] = useState([]);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answers, setAnswers] = useState({});
const [loading, setLoading] = useState(true);

const [palettePage, setPalettePage] = useState(0);

const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  
  // ✅ Fix double submit
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ Fix time tracking
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const response = await api.get(`/tests/${testId}/`);
      setTest(response.data);
      setQuestions(response.data.questions || []);
      setTimeLeft(response.data.total_duration_minutes * 60);
    } catch (error) {
      console.error("Error fetching test:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // SELECT ANSWER
  // ─────────────────────────────────────────
  const handleSelectAnswer = (option) => {
    setAnswers((prev) => {
      const currentSelection = prev[currentQuestion]?.selected_answer;
      const isAlreadySelected = currentSelection === option;
      return {
        ...prev,
        [currentQuestion]: {
          ...prev[currentQuestion],
          selected_answer: isAlreadySelected ? null : option,
          marked_for_review: prev[currentQuestion]?.marked_for_review || false,
        },
      };
    });
  };

  // ✅ Fix Mark for Review
  const handleMarkForReview = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        marked_for_review: !prev[currentQuestion]?.marked_for_review,
      },
    }));
  };

  // ─────────────────────────────────────────
  // SUBMIT TEST ✅ Fixed double submit
  // ─────────────────────────────────────────
  const handleSubmitTest = useCallback(async () => {
    // Prevent double submit
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    const answersData = questions.map((q, idx) => ({
      question_id: q.id,
      selected_answer: answers[idx]?.selected_answer || null,
    }));

    // ✅ Fix time taken
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const response = await api.post("/results/submit_test/", {
        test_id: test.id,
        answers: answersData,
        time_taken: timeTaken,
      });
      navigate(`/result/${response.data.id}`);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [submitting, questions, answers, test, navigate]);

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

  if (!test || questions.length === 0) {
    return <div className="p-10">No questions found.</div>;
  }

  const question = questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];
  const subjects = [...new Set(questions.map((q) => q.subject))];
  const currentSubject = question.subject;

  return (
<div className="min-h-screen bg-[#0b1120] text-white">
  <div className="max-w-7xl mx-auto p-3 md:p-5">
    
   {/* TOP BAR */}
<div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-4 mb-5 shadow-2xl">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

    {/* LEFT */}
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">
        {test.title}
      </h1>

      <p className="text-gray-400 text-sm mt-1">
        Online Examination
      </p>
    </div>

    {/* TIMER */}
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 rounded-2xl shadow-xl text-center">
      <p className="text-sm text-blue-100 mb-1">
        Time Remaining
      </p>

      <div className="text-3xl md:text-4xl font-bold tracking-widest">
        <Timer
          totalSeconds={timeLeft}
          onTimeEnd={handleSubmitTest}
        />
      </div>
    </div>
  </div>
</div>

    {/* MAIN GRID */}
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

      {/* LEFT SECTION */}
      <div className="xl:col-span-3">

        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-2xl">

          {/* SUBJECTS */}
          <div className="flex gap-3 overflow-x-auto pb-2 mb-6">

            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  const firstQuestionIndex = questions.findIndex(
                    (q) => q.subject === subject
                  );

                  if (firstQuestionIndex !== -1) {
                    setCurrentQuestion(firstQuestionIndex);
                  }
                }}
                className={`px-5 py-2 rounded-2xl text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                  subject === currentSubject
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg"
                    : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* QUESTION */}
          <div className="mb-8">

            <div className="flex items-start gap-3 mb-6">

              <div className="min-w-[45px] h-[45px] rounded-2xl bg-blue-500 flex items-center justify-center font-bold text-lg shadow-lg">
                {currentQuestion + 1}
              </div>

              <div className="text-lg md:text-2xl font-semibold leading-relaxed">
                <MathText text={question.question_text} />
              </div>
            </div>

            {/* OPTIONS */}
            <div className="space-y-4">

              {["A", "B", "C", "D"].map((option) => {

                const isSelected =
                  currentAnswer?.selected_answer === option;

                const optionText =
                  question[`option_${option.toLowerCase()}`];

                return (
                  <div
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    className={`group p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/15 shadow-lg shadow-blue-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >

                    <div className="flex items-center gap-4">

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-400 bg-blue-500"
                            : "border-gray-500"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>

                      <div className="text-base md:text-lg">
                        <span className="font-bold mr-2">
                          ({option})
                        </span>

                        <MathText text={optionText} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REVIEW BUTTON */}
          <button
            onClick={handleMarkForReview}
            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 mb-5 ${
              currentAnswer?.marked_for_review
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-white/5 border border-purple-500 text-purple-300 hover:bg-purple-500/10"
            }`}
          >
            {currentAnswer?.marked_for_review
              ? "✅ Marked for Review"
              : "🔖 Mark for Review"}
          </button>

          {/* NAVIGATION */}
          <div className="flex justify-between gap-4">

            <button
              onClick={() =>
                currentQuestion > 0 &&
                setCurrentQuestion(currentQuestion - 1)
              }
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold"
            >
              ← Previous
            </button>

            <button
              onClick={() =>
                currentQuestion < questions.length - 1 &&
                setCurrentQuestion(currentQuestion + 1)
              }
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-[1.01] transition-all font-semibold shadow-lg"
            >
              Next →
            </button>
          </div>

          {/* FINAL SUBMIT */}
          {currentQuestion === questions.length - 1 && (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="w-full mt-5 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-lg shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              Finish & Submit Test
            </button>
          )}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="space-y-5">

{/* QUESTION PALETTE */}
<div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">

  {/* HEADER */}
  <div className="flex items-center justify-between mb-5">
    
    <h2 className="text-xl font-bold">
      Questions
    </h2>

    <span className="text-sm text-gray-400">
      {currentQuestion + 1}/{questions.length}
    </span>
  </div>

  {/* TOP NAVIGATION */}
  <div className="flex items-center justify-between mb-4">

    {/* LEFT ARROW */}
    <button
      disabled={palettePage === 0}
      onClick={() =>
        setPalettePage((prev) => Math.max(prev - 1, 0))
      }
      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
    >
      ←
    </button>

    {/* PAGE INFO */}
    <span className="text-sm text-gray-400 font-medium">
      {palettePage * 25 + 1} -{" "}
      {Math.min((palettePage + 1) * 25, questions.length)}
    </span>

    {/* RIGHT ARROW */}
    <button
      disabled={(palettePage + 1) * 25 >= questions.length}
      onClick={() =>
        setPalettePage((prev) => prev + 1)
      }
      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
    >
      →
    </button>
  </div>

  {/* QUESTION GRID */}
  <div className="grid grid-cols-5 gap-3">

    {questions
      .slice(palettePage * 25, palettePage * 25 + 25)
      .map((q, i) => {

        const index = palettePage * 25 + i;

        const answer = answers[index];

        let bg =
          "bg-gray-500/20 border border-gray-500/30 text-gray-300";

        // visited but not answered
        if (answer && !answer.selected_answer) {
          bg =
            "bg-red-500 text-white";
        }

        // answered
        if (answer?.selected_answer) {
          bg =
            "bg-green-500 text-white";
        }

        // marked for review
        if (answer?.marked_for_review) {
          bg =
            "bg-purple-600 text-white";
        }

        // current question
        if (index === currentQuestion) {
          bg =
            "bg-blue-500 text-white ring-2 ring-cyan-300 scale-105";
        }

        return (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`h-12 w-12 rounded-xl font-bold transition-all duration-200 ${bg}`}
          >
            {index + 1}
          </button>
        );
      })}
  </div>

  {/* LEGEND */}
  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">

    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
      Answered
    </div>

    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      Visited
    </div>

    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
      Review
    </div>

    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
      Not Visited
    </div>
  </div>
</div>
        {/* SUBMIT CARD */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-lg shadow-xl hover:scale-[1.01] transition-all"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>

          <p className="text-center text-gray-400 text-sm mt-3">
            You can submit anytime
          </p>
        </div>
      </div>
    </div>

    {/* SUBMIT MODAL */}
    {showSubmitModal && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">

          <h2 className="text-2xl font-bold mb-4">
            Final Submission
          </h2>

          <div className="bg-white/5 rounded-2xl p-4 mb-5 space-y-2 text-sm">

            <div className="flex justify-between">
              <span>Answered</span>

              <span className="text-green-400 font-bold">
                {
                  Object.values(answers).filter(
                    (a) => a?.selected_answer
                  ).length
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span>Skipped</span>

              <span className="text-gray-300 font-bold">
                {
                  questions.length -
                  Object.values(answers).filter(
                    (a) => a?.selected_answer
                  ).length
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span>Marked for Review</span>

              <span className="text-purple-400 font-bold">
                {
                  Object.values(answers).filter(
                    (a) => a?.marked_for_review
                  ).length
                }
              </span>
            </div>
          </div>

          <p className="text-gray-400 mb-5">
            Are you sure you want to submit the exam?
          </p>

          <div className="flex gap-3">

            <button
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 font-semibold"
            >
              {submitting ? "Submitting..." : "Yes, Submit"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
};

export default TestPage;