const natural = require("natural");

function preprocess(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ");
}

function cosineSimilarity(text1, text2) {
  const words1 = preprocess(text1);
  const words2 = preprocess(text2);

  const tfidf = new natural.TfIdf();

  tfidf.addDocument(words1.join(" "));
  tfidf.addDocument(words2.join(" "));

  const vector1 = [];
  const vector2 = [];

  tfidf.listTerms(0).forEach(item => {
    vector1.push(item.tfidf);
  });

  tfidf.listTerms(1).forEach(item => {
    vector2.push(item.tfidf);
  });

  while (vector1.length < vector2.length) vector1.push(0);
  while (vector2.length < vector1.length) vector2.push(0);

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

module.exports = cosineSimilarity;
