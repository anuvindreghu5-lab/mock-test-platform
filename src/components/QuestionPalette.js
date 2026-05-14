import React, { useState } from "react";

const QuestionPalette = ({
  questions,
  currentQuestion,
  answers,
  onSelectQuestion,
}) => {
  const itemsPerPage = 50; // 10 rows * 5 columns
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const selectedQuestions = questions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (qNum) => {
    const answer = answers[qNum];
    
    // 1. If it's the current question being viewed, highlight it but check status
    // 2. If marked for review -> Violet
    if (answer?.marked_for_review) return "bg-violet-600 text-white";
    
    // 3. If answered -> Green
    if (answer?.selected_answer) return "bg-green-500 text-white";
    
    // 4. If skipped (visited but no answer selected) -> Red
    // Note: This assumes your 'answers' object tracks if a question was visited/skipped
    if (answer?.skipped || (answer && !answer.selected_answer)) return "bg-red-500 text-white";

    // 5. Default/Not visited -> Gray
    return "bg-gray-200 text-gray-700";
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow min-w-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Questions</h3>
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-1 px-3 bg-gray-100 rounded-md disabled:opacity-30 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <span className="text-xs font-bold text-blue-600">
            {startIndex + 1} - {Math.min(startIndex + itemsPerPage, questions.length)}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1 px-3 bg-gray-100 rounded-md disabled:opacity-30 hover:bg-gray-200 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 min-h-[420px] content-start">
        {selectedQuestions.map((q, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <button
              key={actualIndex}
              onClick={() => onSelectQuestion(actualIndex)}
              className={`w-10 h-10 rounded-md ${getStatusColor(actualIndex)} 
              font-bold text-sm flex items-center justify-center cursor-pointer 
              transition-all duration-200 hover:brightness-90 ${
                currentQuestion === actualIndex ? "ring-2 ring-offset-2 ring-blue-500" : ""
              }`}
            >
              {actualIndex + 1}
            </button>
          );
        })}
      </div>

      {/* Updated Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-y-2 text-xs font-medium">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-600 rounded mr-2"></div>
          <span>Marked</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
          <span>Not Visited</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;