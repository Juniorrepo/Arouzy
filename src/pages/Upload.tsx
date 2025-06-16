import React, { useState } from 'react';

const Upload: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<{ file: File; progress: number; status: string; }[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles(selectedFiles);
  };

  const uploadFile = (fileObj: { file: File; progress: number; status: string; }, idx: number) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env.VITE_API_URL}/api/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setFiles((prev) =>
          prev.map((f, i) => (i === idx ? { ...f, progress: percent } : f))
        );
      }
    };

    xhr.onload = () => {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, status: 'done', progress: 100 } : f
        )
      );
    };

    xhr.onerror = () => {
      setFiles((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, status: 'error' } : f))
      );
    };

    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('title', title);
    formData.append('description', description);

    xhr.send(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    files.forEach((fileObj, idx) => uploadFile(fileObj, idx));
  };

  const overallProgress = files.length
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;
  const completedCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-white text-2xl mb-6 text-center">Upload content</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm text-gray-200">Title</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-fuchsia-500"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm text-gray-200">Description</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-fuchsia-500"
              placeholder="Enter description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-200">Upload files</label>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="w-full h-32 bg-gray-700 rounded-md border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400">
                Browse files
              </div>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm">{completedCount}/{files.length} files uploaded</span>
                <span className="text-white text-sm">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className={`w-full py-3 rounded-full text-white ${
              uploading || files.length === 0
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-fuchsia-500 hover:bg-fuchsia-600'
            } transition-colors`}
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload; 