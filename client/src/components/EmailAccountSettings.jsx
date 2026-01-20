import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Mail, Server, Shield } from 'lucide-react';
import axios from 'axios';

export default function EmailAccountSettings() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        user: '',
        password: '',
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    });
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get('/api/accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this account?')) return;
        try {
            await axios.delete(`/api/accounts/${id}`);
            fetchAccounts();
        } catch (err) {
            alert('Failed to delete account');
        }
    };

    const handleEdit = (account) => {
        setEditingId(account.id);
        setFormData({
            user: account.user,
            password: '', // Don't show existing password for security
            host: account.host,
            port: account.port,
            tls: account.tls
        });
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ user: '', password: '', host: 'imap.gmail.com', port: 993, tls: true });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const url = editingId
            ? `/api/accounts/${editingId}`
            : '/api/accounts';

        const method = editingId ? 'PUT' : 'POST';

        try {
            if (editingId) {
                await axios.put(url, formData);
            } else {
                await axios.post(url, formData);
            }

            setFormData({ user: '', password: '', host: 'imap.gmail.com', port: 993, tls: true });
            setEditingId(null);
            fetchAccounts();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save account');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                Email Account Settings
            </h1>

            {/* List Accounts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Configured Accounts</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : accounts.length === 0 ? (
                    <p className="text-gray-500 italic">No accounts configured. Application is using .env fallback or no data.</p>
                ) : (
                    <div className="space-y-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{acc.user}</p>
                                        <p className="text-sm text-gray-500 flex items-center">
                                            <Server className="w-3 h-3 mr-1" /> {acc.host}:{acc.port}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(acc)}
                                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                                        title="Edit Configuration"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(acc.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Account Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center justify-between">
                    <span className="flex items-center">
                        {editingId ? <Server className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                        {editingId ? 'Edit Account' : 'Add New Account'}
                    </span>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 underline">
                            Cancel Edit
                        </button>
                    )}
                </h2>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email User</label>
                        <input
                            required
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.user}
                            onChange={e => setFormData({ ...formData, user: e.target.value })}
                            placeholder="user@example.com"
                        />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Host</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.host}
                            onChange={e => setFormData({ ...formData, host: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
                        <input
                            required
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.port}
                            onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="col-span-2">
                        <button
                            type="submit"
                            className={`w-full ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center`}
                        >
                            {editingId ? 'Update & Test Connection' : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" /> Connect Account
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}
