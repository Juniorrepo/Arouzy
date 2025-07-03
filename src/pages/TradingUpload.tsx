import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tradingService } from "../services/api";

const TradingUpload: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (file) formData.append("file", file);
      await tradingService.uploadTradingContent(formData);
      setSuccess(true);
      setTimeout(() => navigate("/trading"), 1200);
    } catch (err) {
      let errorMsg = "Failed to upload trading content.";
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        errorMsg =
          (err.response.data as { message?: string }).message || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-primary-500">
        Upload Trading Content
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-dark-800 p-6 rounded-lg shadow-lg flex flex-col gap-5"
      >
        <div>
          <label className="block text-gray-300 mb-2 font-medium">Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded bg-dark-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2 rounded bg-dark-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File (image or video)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            required
            className="block w-full text-gray-300"
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && (
          <div className="text-green-500 text-sm">
            Trading content uploaded!
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 mt-2 rounded bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
};

export default TradingUpload;
