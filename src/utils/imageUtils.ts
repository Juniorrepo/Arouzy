// Helper function to construct full thumbnail URL
export const getThumbnailUrl = (thumbnail: string): string => {
  // If thumbnail is already a full URL, return it as is
  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return thumbnail;
  }

  // If it's a relative path, construct the full URL
  if (thumbnail.startsWith("/uploads/")) {
    const backendUrl =
      import.meta.env.VITE_API_URL || "https://arouzy.up.railway.app";
    return `${backendUrl}${thumbnail}`;
  }

  // If it's a gradient or other CSS value, return as is
  if (thumbnail.includes("gradient") || thumbnail.includes("#")) {
    return thumbnail;
  }

  // Default fallback
  return thumbnail;
};

// Helper function to check if thumbnail is an image URL
export const isImageUrl = (thumbnail: string): boolean => {
  return (
    thumbnail.startsWith("http://") ||
    thumbnail.startsWith("https://") ||
    thumbnail.startsWith("/uploads/")
  );
};

// Helper function to get fallback gradient
export const getFallbackGradient = (): string => {
  const gradients = [
    "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fad0c4 0%, #f5576c 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ];

  return gradients[Math.floor(Math.random() * gradients.length)];
};
