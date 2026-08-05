import React from "react";
import {
  countTestsUnderNode,
  formatPathLabel,
  getNodesAtPath,
  isLeafPath,
  matchTestsAtPath,
} from "../utils/contentTree";
import FolderCard from "./FolderCard";
import TestCard from "./TestCard";

const ContentTreeBrowser = ({
  tree,
  tests,
  categoryKey,
  categoryData,
  folderPath,
  setFolderPath,
  onStartTest,
  testType = "chapter",
}) => {
  const atLeaf = isLeafPath(tree, folderPath);
  const childNodes = atLeaf ? [] : getNodesAtPath(tree, folderPath);
  const leafTests = atLeaf
    ? matchTestsAtPath(tests, categoryKey, folderPath, { tree, testType })
    : [];

  const goToIndex = (index) => {
    setFolderPath(folderPath.slice(0, index));
  };

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
        <button
          type="button"
          onClick={() => setFolderPath([])}
          className={`hover:text-cyan-400 transition ${folderPath.length === 0 ? "text-white font-semibold" : ""}`}
        >
          All Folders
        </button>
        {folderPath.map((segment, index) => (
          <React.Fragment key={`${segment}-${index}`}>
            <span>›</span>
            {index < folderPath.length - 1 ? (
              <button
                type="button"
                onClick={() => goToIndex(index + 1)}
                className="hover:text-cyan-400 transition capitalize"
              >
                {formatPathLabel(segment)}
              </button>
            ) : (
              <span className="text-white font-semibold capitalize">
                {formatPathLabel(segment)}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      <h3 className="text-2xl font-bold mb-5">
        {atLeaf
          ? `📂 ${formatPathLabel(folderPath[folderPath.length - 1])}`
          : folderPath.length === 0
            ? "📁 Browse Content"
            : `📁 ${formatPathLabel(folderPath[folderPath.length - 1])}`}
      </h3>

      {!atLeaf && childNodes.length === 0 && (
        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          No folders configured yet.
        </div>
      )}

      {!atLeaf && childNodes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {childNodes.map((node) => {
            const path = [...folderPath, node.name];
            const testCount = countTestsUnderNode(tests, categoryKey, tree, path, testType);
            const isChapter = !node.children;
            return (
              <FolderCard
                key={node.name}
                title={node.name}
                subtitle={
                  node.children
                    ? `${testCount} test${testCount !== 1 ? "s" : ""}`
                    : `${testCount} test${testCount !== 1 ? "s" : ""}`
                }
                categoryData={categoryData}
                isChapter={isChapter}
                onClick={() => setFolderPath(path)}
              />
            );
          })}
        </div>
      )}

      {atLeaf && leafTests.length === 0 && (
        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          No tests uploaded for this folder yet. Add tests in Admin with matching subject & chapter.
        </div>
      )}

      {atLeaf && leafTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {leafTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              categoryData={categoryData}
              onStart={() => onStartTest(test.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ContentTreeBrowser;
