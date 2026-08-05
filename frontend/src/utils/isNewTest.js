/** Test uploaded within the last 7 days */
export const isNewTest = (createdAt) => {
  const days = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  return days <= 7;
};
