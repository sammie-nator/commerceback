const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(
  "/api",
  ""
);

export const imageUrl = (path) => {
  if (!path) return "https://placehold.co/400x400?text=No+Image";
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
};
