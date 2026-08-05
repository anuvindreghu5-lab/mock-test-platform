import { normalizeNodes } from "../config/contentTrees";

/** Walk the tree using folder path segments */
export const getNodesAtPath = (tree, path = []) => {
  let nodes = normalizeNodes(tree);
  for (const segment of path) {
    const current = nodes.find(
      (n) => n.name.toLowerCase() === segment.toLowerCase()
    );
    if (!current) return [];
    if (!current.children) return [];
    nodes =
      typeof current.children[0] === "string"
        ? current.children.map((name) => ({ name, children: null }))
        : normalizeNodes(current.children);
  }
  return nodes;
};

export const getNodeAtPath = (tree, path = []) => {
  if (path.length === 0) return null;
  let nodes = normalizeNodes(tree);
  let node = null;
  for (const segment of path) {
    node = nodes.find((n) => n.name.toLowerCase() === segment.toLowerCase());
    if (!node) return null;
    if (!node.children) return node;
    nodes =
      typeof node.children[0] === "string"
        ? node.children.map((name) => ({ name, children: null }))
        : normalizeNodes(node.children);
  }
  return node;
};

export const isLeafPath = (tree, path) => {
  const node = getNodeAtPath(tree, path);
  return Boolean(node && !node.children);
};

/** Map folder path → subject/chapter fields on MockTest */
export const pathToSubjectChapter = (tree, path) => {
  if (!path.length || !tree) return { subject: null, chapter: null };

  const node = getNodeAtPath(tree, path);
  const isLeaf = node && !node.children;

  if (!isLeaf) return { subject: null, chapter: null };

  if (path.length === 2) {
    return { subject: path[0], chapter: path[1] };
  }

  return { subject: path[0], chapter: "" };
};

export const matchTestsAtPath = (
  tests,
  categoryKey,
  path,
  { tree, testType = "chapter" } = {}
) => {
  const { subject, chapter } = pathToSubjectChapter(tree, path);
  if (!subject) return [];

  return tests.filter((t) => {
    if (t.category !== categoryKey || t.test_type !== testType) return false;
    if (t.subject?.toLowerCase() !== subject.toLowerCase()) return false;
    if (chapter) {
      return t.chapter?.toLowerCase() === chapter.toLowerCase();
    }
    return !t.chapter;
  });
};

export const countTestsUnderNode = (
  tests,
  categoryKey,
  tree,
  path,
  testType = "chapter"
) => {
  const node = getNodeAtPath(tree, path);
  if (!node) return 0;

  if (!node.children) {
    return matchTestsAtPath(tests, categoryKey, path, { tree, testType }).length;
  }

  const childNodes = getNodesAtPath(tree, path);
  return childNodes.reduce(
    (sum, child) =>
      sum +
      countTestsUnderNode(tests, categoryKey, tree, [...path, child.name], testType),
    0
  );
};

export const formatPathLabel = (segment) =>
  segment === "__other__" ? "Other" : segment;
