import { N_LEVEL_MAIN_TREE, N_LEVEL_PYQ_TREE } from "./levelExamConfig";

const IELTS_SKILLS = ["Listening", "Reading", "Writing", "Speaking", "Mock Tests"];

/** Normalize string or { name, children } nodes into a consistent shape */
export const normalizeNodes = (nodes) =>
  (nodes || []).map((node) => {
    if (typeof node === "string") {
      return { name: node, children: null };
    }
    const children = node.children;
    return {
      name: node.name,
      children: children
        ? Array.isArray(children) && typeof children[0] === "string"
          ? children
          : normalizeNodes(children)
        : null,
    };
  });

/** Static folder trees per category (legacy / IELTS) */
export const CONTENT_TREES = {
  ielts: normalizeNodes(
    IELTS_SKILLS.map((skill) => ({ name: skill, children: null }))
  ),
};

/** Goethe / JLPT trees (used via levelExamConfig + tab key) */
export const GOETHE_JLPT_MAIN_TREE = normalizeNodes(N_LEVEL_MAIN_TREE);
export const GOETHE_JLPT_PYQ_TREE = normalizeNodes(N_LEVEL_PYQ_TREE);

export const hasContentTree = (categoryKey) => Boolean(CONTENT_TREES[categoryKey]);
