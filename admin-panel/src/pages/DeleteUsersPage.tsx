import React, { useState } from 'react';
import SearchInput from '../components/SearchInput';
import DeleteButton from '../components/DeleteButton';
import { mockUsers } from '../services/mockData';
import { getUsergroupBadge } from '../utils/badges';
import { User } from '../types';

const DeleteUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.length > 0) {
      console.log('Deleting users:', selectedUsers);
      alert(`Deleting ${selectedUsers.length} user(s). Content will be preserved.`);
      setSelectedUsers([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search users..."
        />
        <DeleteButton
          onClick={handleDeleteUsers}
          disabled={selectedUsers.length === 0}
          selectedCount={selectedUsers.length}
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
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usergroup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Posts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUsergroupBadge(user.usergroup)}`}>
                      {user.usergroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.joinDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.postsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeleteUsersPage;