/** Goethe & JLPT — custom dashboard tabs and folder trees */

export const LEVEL_EXAM_CATEGORIES = ["goethe", "jlpt"];

const LEVELS = [
  { name: "N5 Beginner", code: "N5" },
  { name: "N4 Elementary", code: "N4" },
  { name: "N3 Intermediate", code: "N3" },
  { name: "N2 Advanced", code: "N2" },
  { name: "N1 Expert", code: "N1" },
];

const buildSkillFolders = (code) => [
  `${code} Vocabulary Test`,
  `${code} Grammar Quiz`,
  `${code} Kanji Practice`,
  `${code} Listening Test`,
  `${code} Reading Practice`,
  `${code} Full Mock`,
];

/** Main browse tree: level → skill tests */
export const N_LEVEL_MAIN_TREE = LEVELS.map((level) => ({
  name: level.name,
  children: buildSkillFolders(level.code),
}));

/** PYQ tab: one folder per level */
export const N_LEVEL_PYQ_TREE = LEVELS.map((level) => ({
  name: `${level.code} PYQ`,
  children: null,
}));

export const getLevelExamTabs = (categoryKey) => {
  if (categoryKey === "goethe") {
    return [
      { key: "goethe", label: "🇩🇪 Goethe" },
      { key: "latest", label: "🆕 Latest" },
      { key: "full", label: "📋 Full Mock" },
      { key: "pyq", label: "📅 PYQs" },
    ];
  }
  if (categoryKey === "jlpt") {
    return [
      { key: "jlpt", label: "🇯🇵 JLPT" },
      { key: "latest", label: "🆕 Latest" },
      { key: "full", label: "📋 Full Mock" },
      { key: "pyq", label: "📅 PYQs" },
    ];
  }
  return null;
};

export const getDefaultTabForCategory = (categoryKey) => {
  if (categoryKey === "goethe") return "goethe";
  if (categoryKey === "jlpt") return "jlpt";
  return "latest";
};

export const getTreeForLevelExamTab = (tabKey) => {
  if (tabKey === "goethe" || tabKey === "jlpt") return N_LEVEL_MAIN_TREE;
  if (tabKey === "pyq") return N_LEVEL_PYQ_TREE;
  return null;
};

export const getTestTypeForLevelExamTab = (tabKey) => {
  if (tabKey === "pyq") return "pyq";
  if (tabKey === "goethe" || tabKey === "jlpt") return "chapter";
  if (tabKey === "full") return "full";
  if (tabKey === "latest") return "latest";
  return "chapter";
};

export const isLevelExamBrowseTab = (tabKey) =>
  tabKey === "goethe" || tabKey === "jlpt" || tabKey === "pyq";

export const isLevelExamCategory = (categoryKey) =>
  LEVEL_EXAM_CATEGORIES.includes(categoryKey);

/** Admin upload: level names for dropdown */
export const LEVEL_FOLDER_OPTIONS = LEVELS.map((l) => l.name);

export const PYQ_FOLDER_OPTIONS = N_LEVEL_PYQ_TREE.map((n) => n.name);

export const getSkillFoldersForLevel = (levelName) => {
  const level = LEVELS.find((l) => l.name === levelName);
  if (!level) return [];
  return buildSkillFolders(level.code);
};

export const LEVEL_EXAM_TEST_TYPES = [
  { value: "chapter", label: "📖 Skill folder (level → test type)" },
  { value: "pyq", label: "📅 PYQ folder" },
  { value: "latest", label: "🆕 Latest" },
  { value: "full", label: "📋 Full Mock" },
];

export const STANDARD_TEST_TYPES = [
  { value: "full", label: "📝 Full Mock Test" },
  { value: "latest", label: "🆕 Latest Test" },
  { value: "pyq", label: "📅 Previous Year (PYQ)" },
  { value: "subject", label: "📚 Subject Wise" },
  { value: "chapter", label: "📖 Chapter Wise" },
];
