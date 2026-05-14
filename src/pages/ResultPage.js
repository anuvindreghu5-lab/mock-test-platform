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

      const response = await api.get(
        "/results/result_detail/",
        {
          params: {
            result_id: resultId,
          },
        }
      );

      setResult(response.data);

    } catch (error) {

      console.error(
        "Error fetching result:",
        error
      );

    } finally {

      setLoading(false);
    }
  };


  if (loading)

    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );


  if (!result)

    return (
      <div className="flex items-center justify-center h-screen">
        Result not found
      </div>
    );


  return (

    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-7xl mx-auto">


        {/* HEADER */}

        <div className="bg-white p-6 rounded-lg shadow mb-6">

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {result.test_title}
          </h1>

          <p
            className={`text-lg font-semibold ${
              result.is_passed
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {result.is_passed
              ? "✓ PASSED"
              : "✗ FAILED"}
          </p>

        </div>



        {/* SCORE CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">

            <p className="text-gray-600 text-sm">
              Score
            </p>

            <p className="text-3xl font-bold text-blue-600">
              {result.obtained_marks}/
              {result.total_marks}
            </p>

          </div>


          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-600">

            <p className="text-gray-600 text-sm">
              Percentage
            </p>

            <p className="text-3xl font-bold text-green-600">
              {result.percentage.toFixed(1)}%
            </p>

          </div>


          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-600">

  <p className="text-gray-600 text-sm">
    Time Taken
  </p>

  <p className="text-2xl font-bold text-purple-600">

    {result.time_taken_seconds
      ? `${Math.floor(
          Number(result.time_taken_seconds) / 3600
        )}h ${Math.floor(
          (Number(result.time_taken_seconds) % 3600) / 60
        )}m`
      : "0h 0m"}

  </p>

  <p className="text-sm text-gray-500 mt-2">

    Completed in{" "}

    {result.time_taken_seconds
      ? `${Math.floor(
          Number(result.time_taken_seconds) / 60
        )} minutes`
      : "0 minutes"}

  </p>

</div>

          <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-600">

            <p className="text-gray-600 text-sm">
              Status
            </p>

            <p className="text-2xl font-bold text-orange-600">

              {result.is_passed
                ? "Pass"
                : "Fail"}

            </p>

          </div>

        </div>





        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">


          {/* ANSWER SUMMARY */}

          <div className="bg-white p-6 rounded-lg shadow">

            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Answer Summary
            </h3>

            <div className="space-y-3">

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Total Questions
                </span>

                <span className="font-bold text-gray-800">
                  {result.total_questions}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-600">
                  Attempted
                </span>

                <span className="font-bold text-blue-600">
                  {result.attempted_questions}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-600">
                  Correct
                </span>

                <span className="font-bold text-green-600">
                  {result.correct_answers}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-600">
                  Wrong
                </span>

                <span className="font-bold text-red-600">
                  {result.wrong_answers}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-600">
                  Skipped
                </span>

                <span className="font-bold text-gray-600">
                  {result.skipped_questions}
                </span>

              </div>

            </div>

          </div>



          {/* SUBJECT DISTRIBUTION */}

          <div className="bg-white p-6 rounded-lg shadow h-[500px] overflow-y-auto">

            <h3 className="text-lg font-bold text-gray-800 mb-6 sticky top-0 bg-white pb-4 z-10">
              Subject Distribution
            </h3>

            <div className="space-y-6">

              {Object.entries(
                result.subject_analysis || {}
              ).map(([subject, data]) => {

                const attempted =
                  data.correct +
                  data.wrong;

                const skipped =
                  data.total - attempted;

                const correctPercent =
                  (data.correct / data.total) * 100;

                const wrongPercent =
                  (data.wrong / data.total) * 100;

                const skippedPercent =
                  (skipped / data.total) * 100;

                return (

                  <div
                    key={subject}
                    className="border border-gray-200 rounded-xl p-4"
                  >

                    {/* SUBJECT HEADER */}

                    <div className="flex justify-between items-center mb-4">

                      <h4 className="text-xl font-bold capitalize text-gray-800">
                        {subject}
                      </h4>

                      <span className="text-sm font-semibold text-blue-600">
                        Attempted {attempted}/{data.total}
                      </span>

                    </div>




                    {/* STATS */}

                    <div className="grid grid-cols-3 gap-3 mb-4">

                      <div className="bg-green-50 p-3 rounded-lg text-center">

                        <p className="text-sm text-gray-500">
                          Correct
                        </p>

                        <p className="text-2xl font-bold text-green-600">
                          {data.correct}
                        </p>

                      </div>



                      <div className="bg-red-50 p-3 rounded-lg text-center">

                        <p className="text-sm text-gray-500">
                          Wrong
                        </p>

                        <p className="text-2xl font-bold text-red-600">
                          {data.wrong}
                        </p>

                      </div>



                      <div className="bg-gray-100 p-3 rounded-lg text-center">

                        <p className="text-sm text-gray-500">
                          Skipped
                        </p>

                        <p className="text-2xl font-bold text-gray-700">
                          {skipped}
                        </p>

                      </div>

                    </div>





                    {/* GRAPH */}

                    <div className="w-full h-6 rounded-full overflow-hidden flex">

                      <div
                        className="bg-green-500"
                        style={{
                          width: `${correctPercent}%`,
                        }}
                      />

                      <div
                        className="bg-red-500"
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





                    {/* LEGEND */}

                    <div className="flex gap-4 mt-4 text-sm">

                      <div className="flex items-center gap-2">

                        <div className="w-3 h-3 rounded-full bg-green-500" />

                        <span>Correct</span>

                      </div>

                      <div className="flex items-center gap-2">

                        <div className="w-3 h-3 rounded-full bg-red-500" />

                        <span>Wrong</span>

                      </div>

                      <div className="flex items-center gap-2">

                        <div className="w-3 h-3 rounded-full bg-gray-400" />

                        <span>Skipped</span>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>










        {/* ANSWER REVIEW */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">


          {/* WRONG */}

          <div className="bg-white p-6 rounded-lg shadow">

            <h3 className="text-xl font-bold text-red-600 mb-4">
              Wrong Answers
            </h3>

            <div className="space-y-4 max-h-[700px] overflow-y-auto">

              {result.answers
                .filter(
                  (a) =>
                    a.selected_answer &&
                    !a.is_correct
                )
                .map((answer, idx) => (

                  <div
                    key={idx}
                    className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
                  >

                    <h4 className="font-bold mb-2">

                      {answer.question.question_text}

                    </h4>

                    <p className="text-sm">

                      Your Answer:

                      <span className="font-bold text-red-600 ml-2">
                        {answer.selected_answer}
                      </span>

                    </p>

                    <p className="text-sm mt-1">

                      Correct Answer:

                      <span className="font-bold text-green-600 ml-2">
                        {answer.question.correct_answer}
                      </span>

                    </p>

                  </div>
                ))}

            </div>

          </div>






          {/* CORRECT */}

          <div className="bg-white p-6 rounded-lg shadow">

            <h3 className="text-xl font-bold text-green-600 mb-4">
              Correct Answers
            </h3>

            <div className="space-y-4 max-h-[700px] overflow-y-auto">

              {result.answers
                .filter(
                  (a) =>
                    a.is_correct
                )
                .map((answer, idx) => (

                  <div
                    key={idx}
                    className="border-l-4 border-green-500 bg-green-50 p-4 rounded"
                  >

                    <h4 className="font-bold mb-2">

                      {answer.question.question_text}

                    </h4>

                    <p className="text-sm">

                      Your Answer:

                      <span className="font-bold text-green-600 ml-2">
                        {answer.selected_answer}
                      </span>

                    </p>

                    <p className="text-sm mt-1">

                      Correct Answer:

                      <span className="font-bold text-green-600 ml-2">
                        {answer.question.correct_answer}
                      </span>

                    </p>

                  </div>
                ))}

            </div>

          </div>







          {/* SKIPPED */}

          <div className="bg-white p-6 rounded-lg shadow">

            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Skipped Questions
            </h3>

            <div className="space-y-4 max-h-[700px] overflow-y-auto">

              {result.answers
                .filter(
                  (a) =>
                    !a.selected_answer
                )
                .map((answer, idx) => (

                  <div
                    key={idx}
                    className="border-l-4 border-gray-500 bg-gray-100 p-4 rounded"
                  >

                    <h4 className="font-bold mb-2">

                      {answer.question.question_text}

                    </h4>

                    <p className="text-sm">

                      Status:

                      <span className="font-bold text-gray-700 ml-2">
                        Not Answered
                      </span>

                    </p>

                    <p className="text-sm mt-1">

                      Correct Answer:

                      <span className="font-bold text-green-600 ml-2">
                        {answer.question.correct_answer}
                      </span>

                    </p>

                  </div>
                ))}

            </div>

          </div>

        </div>






        {/* BUTTONS */}

        <div className="flex gap-4">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex-1 bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() =>
              window.print()
            }
            className="flex-1 bg-gray-600 text-white py-3 rounded font-semibold hover:bg-gray-700"
          >
            Print Result
          </button>

        </div>

      </div>

    </div>
  );
};

export default ResultPage;
