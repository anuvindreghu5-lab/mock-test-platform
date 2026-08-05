import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import { resolveMediaUrl } from "../utils/mediaUrl";

// ✅ Subjects that should render as image-based questions
const IMAGE_SUBJECT_KEYWORDS = [
  "math",
  "physics",
  "chemistry",
  "engineering",
  "electronics",
  "electrical",
  "computer",
  "technology",
  "aptitude",
  "reasoning",
];

const needsImageDisplay = (question) => {
  const subject = (question?.subject || "").toLowerCase().trim();
  return IMAGE_SUBJECT_KEYWORDS.some((keyword) => subject.includes(keyword));
};

export const MathText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          try { return <BlockMath key={i} math={part.slice(2, -2)} />; }
          catch { return <span key={i}>{part}</span>; }
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          try { return <InlineMath key={i} math={part.slice(1, -1)} />; }
          catch { return <span key={i}>{part}</span>; }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const QuestionImage = ({ src, alt, className = "" }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const url = resolveMediaUrl(src);
  if (!url) return null;

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="group relative cursor-zoom-in overflow-hidden rounded-xl"
      >
        <img
          src={url}
          alt={alt || "Question"}
          className={`max-w-full object-contain border border-white/10 bg-white transition-all duration-300 group-hover:opacity-95 ${className}`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
            🔍 Click to expand
          </span>
        </div>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          {/* Close button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-all duration-300 border border-white/10 hover:scale-105 z-[10000]"
          >
            ✕
          </button>
          
          <img
            src={url}
            alt={alt || "Question Fullscreen"}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-white transition-all duration-300 animate-scaleUp"
          />
          
          <p className="text-gray-400 text-sm mt-4 font-medium select-none bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
            Click anywhere to close
          </p>
        </div>
      )}
    </>
  );
};

// ✅ Question body
export const QuestionBody = ({ question }) => {
  const useImage = question?.use_image_display && question?.question_image_url;

  if (useImage) {
    return (
      <div className="space-y-2">
        {/* Only show text if it's not a placeholder */}
        {question?.question_text &&
          !question.question_text.match(/^Question \d+/) && (
          <div className="text-lg font-semibold leading-relaxed">
            <MathText text={question.question_text} />
          </div>
        )}
        {/* ✅ Show ONLY question part of image — crop top 60% */}
        <QuestionImage
          src={question.question_image_url}
          alt={`Question ${question.question_number}`}
          className="max-h-[45vh]"
        />
      </div>
    );
  }

  // Text mode
  return (
    <div className="text-lg md:text-2xl font-semibold leading-relaxed">
      <MathText text={question?.question_text} />
    </div>
  );
};

// ✅ Option body
export const OptionBody = ({ question, option, optionText }) => {
  const key = `option_${option.toLowerCase()}_image_url`;
  const imageUrl = question?.[key];
  const useImage = question?.use_image_display && question?.question_image_url;

  // Has separate option image
  if (imageUrl) {
    return (
      <QuestionImage
        src={imageUrl}
        alt={`Option ${option}`}
        className="max-h-20 mt-1"
      />
    );
  }

  // Has text option
  if (optionText && optionText.trim()) {
    return <MathText text={optionText} />;
  }

  // Image subject — no separate options, just show letter
  if (useImage) {
    return null;
  }

  return <MathText text={optionText} />;
};