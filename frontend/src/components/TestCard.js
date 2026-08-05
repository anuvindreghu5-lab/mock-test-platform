import React from "react";
import { isNewTest } from "../utils/isNewTest";

const TestCard = ({ test, categoryData, onStart }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-blue-500/20 transition-all duration-300">
    <div className="flex items-start justify-between mb-3">
      <h3 className="text-xl font-bold text-white flex-1 mr-2">{test.title}</h3>
      <div className="flex gap-2 flex-shrink-0">
        {isNewTest(test.created_at) && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
            New
          </span>
        )}
        {test.year && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${categoryData.bg} border ${categoryData.border} text-gray-300`}>
            {test.year}
          </span>
        )}
      </div>
    </div>
    {test.description && <p className="text-gray-400 text-sm mb-4">{test.description}</p>}
    <div className="flex flex-wrap gap-3 text-sm text-gray-300 mb-5">
      <span>⏱️ {test.total_duration_minutes} mins</span>
      <span>📊 {test.total_questions} questions</span>
      <span>📈 {test.difficulty_level}</span>
      {test.subject && <span>📚 {test.subject}</span>}
      {test.chapter && <span>📖 {test.chapter}</span>}
    </div>
    <button
      onClick={onStart}
      className={`w-full py-3 rounded-2xl bg-gradient-to-r ${categoryData.color} font-semibold text-white shadow-lg hover:scale-[1.02] transition-all duration-300`}
    >
      Start Test →
    </button>
  </div>
);

export default TestCard;
