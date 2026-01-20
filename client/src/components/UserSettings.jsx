import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Shield, User } from 'lucide-react';
import axios from 'axios';

export default function UserSettings() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            await axios.post('/api/users', formData);
            setFormData({ name: '', email: '', password: '' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-purple-600" />
                User Access Management
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* List Users */}
                <div className="col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                        <User className="w-5 h-5 mr-2" /> Existing Users
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading users...</div>
                        ) : !Array.isArray(users) || users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic">No users found.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-purple-100 p-2.5 rounded-full text-purple-600 font-bold text-sm">
                                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Add User Form */}
                <div className="col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
                        <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
                            <Plus className="w-5 h-5 mr-2" /> Add User
                        </h2>

                        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-purple-200 mt-2"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Create User
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
