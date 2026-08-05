/** Exam category cards on the dashboard home screen */
export const examCategories = [
  { key: "upsc", icon: "🎯", name: "JEE", color: "from-orange-500 to-amber-400", border: "border-orange-500/30", bg: "bg-orange-500/10", group: "exam" },
  { key: "neet", icon: "🏥", name: "NEET", color: "from-green-500 to-emerald-400", border: "border-green-500/30", bg: "bg-green-500/10", group: "exam" },
  { key: "ssc", icon: "📋", name: "SSC CGL", color: "from-yellow-500 to-orange-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", group: "exam" },
  { key: "jee", icon: "⚓️", name: "IMUCET", color: "from-blue-500 to-cyan-400", border: "border-blue-500/30", bg: "bg-blue-500/10", group: "exam" },
  { key: "gate", icon: "⚙️", name: "GATE", color: "from-pink-500 to-rose-400", border: "border-pink-500/30", bg: "bg-pink-500/10", group: "exam" },
  { key: "keam", icon: "🎓", name: "KEAM", color: "from-purple-500 to-violet-400", border: "border-purple-500/30", bg: "bg-purple-500/10", group: "exam" },
  { key: "ielts", icon: "🌍", name: "IELTS", color: "from-indigo-500 to-blue-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10", group: "exam" },
  { key: "jlpt", icon: "🇯🇵", name: "JLPT", color: "from-red-500 to-rose-400", border: "border-red-500/30", bg: "bg-red-500/10", group: "exam" },
  { key: "goethe", icon: "🇩🇪", name: "Goethe", color: "from-amber-500 to-yellow-400", border: "border-amber-500/30", bg: "bg-amber-500/10", group: "exam" },
  { key: "kerala_psc", icon: "📋", name: "CUSAT LET", color: "from-red-500 to-rose-400", border: "border-red-500/30", bg: "bg-red-500/10", group: "exam" },
  { key: "banking", icon: "🏦", name: "Kerala LET", color: "from-teal-500 to-cyan-400", border: "border-teal-500/30", bg: "bg-teal-500/10", group: "exam" },
];

/** NEET, IMUCET, JEE, CUSAT LET, Kerala LET — subject → chapter from uploaded tests */
export const CHAPTER_FOLDER_CATEGORIES = ["jee", "upsc", "neet", "kerala_psc", "banking"];

/** IELTS — static skill folders on Chapter Wise tab */
export const TREE_CATEGORIES = ["ielts"];

export const getCategoryByKey = (key) => examCategories.find((c) => c.key === key);
