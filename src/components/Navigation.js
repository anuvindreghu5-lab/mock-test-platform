import React from "react";

const Navigation = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onMarkReview,
  marked,
}) => {
  return (
    <div className="flex justify-between items-center gap-4 mt-6">
      <button
        onClick={onPrevious}
        disabled={currentQuestion === 0}
        className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-semibold disabled:opacity-50"
      >
        ← Previous
      </button>

      <button
        onClick={onMarkReview}
        className={`px-6 py-2 rounded font-semibold ${
          marked
            ? "bg-yellow-400 text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        {marked ? "Marked for Review ✓" : "Mark for Review"}
      </button>

      {currentQuestion < totalQuestions - 1 ? (
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
        >
          Next →
        </button>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default Navigation;