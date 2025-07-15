import React, { useState } from 'react';
import SearchInput from '../components/SearchInput';
import DeleteButton from '../components/DeleteButton';
import { mockThreads } from '../services/mockData';
import { getStatusBadge } from '../utils/badges';
import { Thread } from '../types';

const DeletePostsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreads, setSelectedThreads] = useState<number[]>([]);

  const filteredThreads = mockThreads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleThreadSelect = (threadId: number) => {
    setSelectedThreads(prev =>
      prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedThreads(filteredThreads.map(thread => thread.id));
    } else {
      setSelectedThreads([]);
    }
  };

  const handleDeleteThreads = () => {
    if (selectedThreads.length > 0) {
      console.log('Deleting threads:', selectedThreads);
      alert(`Deleting ${selectedThreads.length} thread(s) permanently.`);
      setSelectedThreads([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search threads..."
        />
        <DeleteButton
          onClick={handleDeleteThreads}
          disabled={selectedThreads.length === 0}
          selectedCount={selectedThreads.length}
          label="Delete Selected"
        />
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                    checked={selectedThreads.length === filteredThreads.length && filteredThreads.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Thread Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Photos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Videos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date Posted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Replies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredThreads.map((thread: Thread) => (
                <tr key={thread.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                      checked={selectedThreads.includes(thread.id)}
                      onChange={() => handleThreadSelect(thread.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{thread.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{thread.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{thread.photos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{thread.videos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{thread.datePosted}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(thread.status)}`}>
                      {thread.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{thread.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletePostsPage;