import React from "react";

const FolderCard = ({ title, subtitle, categoryData, onClick, isChapter }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") onClick();
    }}
    className={`${categoryData.bg} border ${categoryData.border} rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all duration-300 group`}
  >
    <div className={`text-4xl mb-3 ${isChapter ? "" : "group-hover:scale-110 transition-transform"}`}>
      {isChapter ? "📄" : "📁"}
    </div>
    <h4 className="text-lg font-black text-white mb-1 capitalize line-clamp-2">{title}</h4>
    <p className="text-xs text-gray-400">{subtitle}</p>
  </div>
);

export default FolderCard;
