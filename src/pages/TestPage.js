import React, { useEffect, useState } from "react";
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

  const parts = text.split(
    /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g
  );

  return (

    <span>

      {parts.map((part, i) => {

        if (
          part.startsWith('$$') &&
          part.endsWith('$$')
        ) {

          try {

            return (
              <BlockMath
                key={i}
                math={part.slice(2, -2)}
              />
            );

          } catch {

            return (
              <span key={i}>
                {part}
              </span>
            );
          }

        } else if (
          part.startsWith('$') &&
          part.endsWith('$')
        ) {

          try {

            return (
              <InlineMath
                key={i}
                math={part.slice(1, -1)}
              />
            );

          } catch {

            return (
              <span key={i}>
                {part}
              </span>
            );
          }
        }

        return (
          <span key={i}>
            {part}
          </span>
        );
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

  const [timeLeft, setTimeLeft] = useState(0);

  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const startTime = Date.now();


  // ─────────────────────────────────────────
  // FETCH TEST
  // ─────────────────────────────────────────

  useEffect(() => {

    fetchTest();

  }, [testId]);


  const fetchTest = async () => {

    try {

      const response = await api.get(
        `/tests/${testId}/`
      );

      setTest(response.data);

      setQuestions(
        response.data.questions || []
      );

      setTimeLeft(
        response.data.total_duration_minutes * 60
      );

    } catch (error) {

      console.error(
        "Error fetching test:",
        error
      );

    } finally {

      setLoading(false);
    }
  };


  // ─────────────────────────────────────────
  // SELECT ANSWER
  // ─────────────────────────────────────────

  const handleSelectAnswer = (option) => {

    setAnswers((prev) => {

      const currentSelection =
        prev[currentQuestion]?.selected_answer;

      const isAlreadySelected =
        currentSelection === option;

      return {

        ...prev,

        [currentQuestion]: {

          ...prev[currentQuestion],

          selected_answer:
            isAlreadySelected
              ? null
              : option,

          marked_for_review: false,
        },
      };
    });
  };


  // ─────────────────────────────────────────
  // SUBMIT TEST
  // ─────────────────────────────────────────

  const handleSubmitTest = async () => {

    const answersData = questions.map(
      (q, idx) => ({

        question_id: q.id,

        selected_answer:
          answers[idx]?.selected_answer || null,
      })
    );

    try {

      const response = await api.post(

        "/results/submit_test/",

        {
          test_id: test.id,

          answers: answersData,

          time_taken: Math.floor(
            (Date.now() - startTime) / 1000
          ),
        }
      );

      navigate(
        `/result/${response.data.id}`
      );

    } catch (error) {

      console.error(error);
    }
  };


  // ─────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────

  if (loading) {

    return (

      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!test || questions.length === 0) {

    return (
      <div className="p-10">
        No questions found.
      </div>
    );
  }


  // ─────────────────────────────────────────
  // CURRENT QUESTION
  // ─────────────────────────────────────────

  const question =
    questions[currentQuestion];

  const currentAnswer =
    answers[currentQuestion];


  // ─────────────────────────────────────────
  // DYNAMIC SUBJECTS
  // ─────────────────────────────────────────

  const subjects = [

    ...new Set(
      questions.map(
        q => q.subject
      )
    )
  ];

  const currentSubject =
    question.subject;


  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────

  return (

    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">


          {/* LEFT SIDE */}

          <div className="lg:col-span-3">

            <div className="bg-white p-6 rounded-lg shadow min-h-[550px] flex flex-col">


              {/* TIMER */}

              <div className="mb-6">

                <Timer
                  totalSeconds={timeLeft}
                  onTimeEnd={handleSubmitTest}
                />

              </div>


              {/* SUBJECT TABS */}

              <div className="flex gap-3 mb-6 overflow-x-auto pb-2">

                {subjects.map((subject) => {

                  const isActive =
                    subject === currentSubject;

                  return (

                    <button
                      key={subject}

                      onClick={() => {

                        const firstQuestionIndex =
                          questions.findIndex(
                            q => q.subject === subject
                          );

                        if (
                          firstQuestionIndex !== -1
                        ) {

                          setCurrentQuestion(
                            firstQuestionIndex
                          );
                        }
                      }}

                      className={`px-5 py-2 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-gray-700 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>


              {/* QUESTION AREA */}

              <div className="flex-grow">

                <div className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">

                  <span className="mr-2">
                    Q{currentQuestion + 1}.
                  </span>

                  <MathText
                    text={question.question_text}
                  />

                </div>


                {/* OPTIONS */}

                <div className="space-y-3">

                  {["A", "B", "C", "D"].map((option) => {

                    const isSelected =
                      currentAnswer?.selected_answer === option;

                    const optionText =
                      question[
                        `option_${option.toLowerCase()}`
                      ];

                    return (

                      <div
                        key={option}

                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-100 bg-white"
                        }`}

                        onClick={() =>
                          handleSelectAnswer(option)
                        }
                      >

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300"
                          }`}
                        >

                          {isSelected && (

                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}

                        </div>

                        <span className="ml-4 font-medium">

                          ({option})

                          {" "}

                          <MathText text={optionText} />

                        </span>

                      </div>
                    );
                  })}
                </div>
              </div>


              {/* BOTTOM NAVIGATION */}

              <div className="mt-8 pt-6 border-t border-gray-100">

                <Navigation

                  currentQuestion={currentQuestion}

                  totalQuestions={questions.length}

                  onPrevious={() =>

                    currentQuestion > 0 &&

                    setCurrentQuestion(
                      currentQuestion - 1
                    )
                  }

                  onNext={() =>

                    currentQuestion < questions.length - 1 &&

                    setCurrentQuestion(
                      currentQuestion + 1
                    )
                  }
                />

                {currentQuestion ===
                  questions.length - 1 && (

                  <button
                    onClick={() =>
                      setShowSubmitModal(true)
                    }

                    className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                  >
                    Finish & Submit Test
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* RIGHT SIDE */}

          <div className="lg:col-span-1 space-y-4">

            <QuestionPalette

              questions={questions}

              currentQuestion={currentQuestion}

              answers={answers}

              onSelectQuestion={
                setCurrentQuestion
              }
            />

            <div className="bg-white p-4 rounded-lg shadow">

              <button
                onClick={() =>
                  setShowSubmitModal(true)
                }

                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-md"
              >
                Submit Exam
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                You can submit at any time.
              </p>

            </div>
          </div>

        </div>
      </div>


      {/* SUBMIT MODAL */}

      {showSubmitModal && (

        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">

            <h2 className="text-xl font-bold mb-4">
              Final Submission
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to end the test?
            </p>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  setShowSubmitModal(false)
                }

                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitTest}

                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
              >
                Yes, Submit
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;