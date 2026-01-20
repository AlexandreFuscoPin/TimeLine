import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Mail, Calendar, User, Hash, Clock, ChevronRight, ChevronDown, ChevronUp, BellOff, AlertTriangle, X, Users, Settings, Save, Eye, EyeOff, LogOut, Shield } from 'lucide-react';
import EmailAccountSettings from './components/EmailAccountSettings';
import UserSettings from './components/UserSettings';

import Login from './pages/Login';

function App() {
    // Auth State
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('authUser') || 'null'));

    const [view, setView] = useState('timeline'); // 'timeline' | 'settings-accounts' | 'settings-companies'
    const [accountsData, setAccountsData] = useState([]); // Array of { account: string, groups: [] }
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [groups, setGroups] = useState([]); // This will now typically hold the *current* account's groups or be derived
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [collapsedCompanies, setCollapsedCompanies] = useState({});

    // Auth Effect: Set Axios Header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('authToken', token);
            localStorage.setItem('authUser', JSON.stringify(currentUser));
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        }
    }, [token, currentUser]);

    // Initial Data Load Effect (Only if authed)
    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token]);

    const handleLogin = (newToken, newUser) => {
        setToken(newToken);
        setCurrentUser(newUser);
    };

    const handleLogout = () => {
        setToken(null);
        setCurrentUser(null);
    };


    // Company Map State
    const [companyMap, setCompanyMap] = useState({});
    const [groupConfigs, setGroupConfigs] = useState({});

    // Unfollow Modal State
    const [unfollowModalOpen, setUnfollowModalOpen] = useState(false);
    const [groupToUnfollow, setGroupToUnfollow] = useState(null);

    // Email Detail Modal State
    const [selectedEmail, setSelectedEmail] = useState(null);

    // Involved People Modal State
    const [involvedModalOpen, setInvolvedModalOpen] = useState(false);
    const [involvedPeople, setInvolvedPeople] = useState([]);

    // Summary Modal State
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [emailsRes, companiesRes, configsRes] = await Promise.all([
                axios.get('/api/emails'),
                axios.get('/api/companies'),
                axios.get('/api/group-configs')
            ]);

            // Handle new structure: [{ account, groups, error }, ...]
            const allAccounts = emailsRes.data;
            setAccountsData(allAccounts);

            // Set init selected account if not set
            if (!selectedAccount && allAccounts.length > 0) {
                setSelectedAccount(allAccounts[0].account);
            }

            setCompanyMap(companiesRes.data);
            setGroupConfigs(configsRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Derived groups for the current view
    useEffect(() => {
        if (selectedAccount && accountsData.length > 0) {
            const found = accountsData.find(a => a.account === selectedAccount);
            if (found) {
                setGroups(found.groups || []);
                // If this account has a fetch error, we could set it to display
                if (found.error) setError(`Error fetching for ${found.account}: ${found.error}`);
                else setError(null);
            }
        } else if (accountsData.length > 0 && !selectedAccount) {
            // Fallback to first
            setSelectedAccount(accountsData[0].account);
        }
    }, [selectedAccount, accountsData]);

    // ... existing functions (toggleGroup, openUnfollowModal, etc.)

    const handleGenerateSummary = async (groupTag) => {
        setSummaryModalOpen(true);
        setIsGeneratingSummary(true);
        setCurrentSummary('');
        setSummaryError(null);

        try {
            const response = await axios.post(`/api/groups/${encodeURIComponent(groupTag)}/summary`);
            if (response.data.summary.startsWith("Error:")) {
                setSummaryError(response.data.summary);
            } else {
                setCurrentSummary(response.data.summary);
            }
        } catch (err) {
            console.error("Summary failed", err);
            setSummaryError("Failed to connect to AI service.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const closeSummaryModal = () => {
        setSummaryModalOpen(false);
        setCurrentSummary('');
        setSummaryError(null);
    };

    // ... existing render code

    // In the return statement, inside the group mapping (around line 351 in original):
    <button
        onClick={(e) => {
            e.stopPropagation();
            handleGenerateSummary(group.tag);
        }}
        className="mr-2 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors self-start mt-1"
        title="Gerar Resumo (IA)"
    >
        <div className="relative">
            <Save className="w-5 h-5" />
            {/* Changed icon to FileText in render, using Save as placeholder if FileText not imported. 
                                                Actually let's use a document icon or similar. 
                                                'FileText' is standard for summary. I need to make sure I import it or use an existing one.
                                                Checking imports: Mail, Calendar, User, Hash, Clock, ChevronRight, ChevronDown, ChevronUp, BellOff, AlertTriangle, X, Users, Settings, Save, Eye, EyeOff
                                                I will add FileText to imports.
                                            */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
        </div>
    </button>

    // ... existing Unfollow button

    // ... and at the end, add the Summary Modal:

    {/* Summary Modal */ }
    {
        summaryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div
                    className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Resumo Inteligente</h2>
                                <p className="text-sm text-slate-500 font-medium">Gerado por IA (Gemini Pro)</p>
                            </div>
                        </div>
                        <button
                            onClick={closeSummaryModal}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar leading-relaxed">
                        {isGeneratingSummary ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium animate-pulse">Analisando e-mails...</p>
                            </div>
                        ) : summaryError ? (
                            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center">
                                <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
                                <p className="font-bold mb-1">Não foi possível gerar o resumo.</p>
                                <p className="text-sm opacity-80">{summaryError}</p>
                                {summaryError.includes("GEMINI_API_KEY") && (
                                    <div className="mt-4 text-xs bg-white p-3 rounded border border-red-100 text-left w-full max-w-md">
                                        <strong>Developer Note:</strong> Please add your API Key to <code>server/.env</code>:
                                        <pre className="mt-2 bg-slate-50 p-2 rounded">GEMINI_API_KEY=your_key_here</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="prose prose-slate max-w-none">
                                <div className="whitespace-pre-wrap text-slate-700 text-lg">
                                    {currentSummary}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/30 rounded-b-3xl flex justify-end">
                        <button
                            onClick={closeSummaryModal}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    useEffect(() => {
        loadData();
    }, []);

    const toggleGroup = (groupTag) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupTag]: !prev[groupTag]
        }));
    };

    const openUnfollowModal = (groupTag) => {
        setGroupToUnfollow(groupTag);
        setUnfollowModalOpen(true);
    };

    const closeUnfollowModal = () => {
        setUnfollowModalOpen(false);
        setGroupToUnfollow(null);
    };

    const handleUnfollow = async (deleteData) => {
        if (!groupToUnfollow) return;
        try {
            setLoading(true);
            setUnfollowModalOpen(false);
            await axios.post(`/api/groups/${encodeURIComponent(groupToUnfollow)}/unfollow`, {
                deleteData
            });
            window.location.reload();
        } catch (err) {
            console.error('Failed to unfollow', err);
            setLoading(false);
        }
    };

    const openEmailDetail = (email) => {
        setSelectedEmail(email);
    };

    const closeEmailDetail = () => {
        setSelectedEmail(null);
    };

    const extractEmails = (text, fromField) => {
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const potentialMatches = (text || '').match(emailRegex) || [];

        const senderMatch = (fromField || '').match(emailRegex);
        if (senderMatch) potentialMatches.push(senderMatch[0]);

        const uniqueEmails = [...new Set(potentialMatches
            .map(e => e.toLowerCase())
            .filter(e => !/\.(png|jpg|jpeg|gif|bmp|webp)@/i.test(e))
            .filter(e => !/^(image|cid)[0-9._-]*@/i.test(e))
        )];
        return uniqueEmails;
    };

    const handleShowInvolved = (e, email) => {
        e.stopPropagation();
        const emails = extractEmails(email.text, email.from);
        setInvolvedPeople(emails);
        setInvolvedModalOpen(true);
    };

    const closeInvolvedModal = () => {
        setInvolvedModalOpen(false);
        setInvolvedPeople([]);
    };

    // --- Company Logic ---

    const updateCompanySetting = async (domain, name, ignored, responsible) => {
        try {
            const response = await axios.post('/api/companies', { domain, name, ignored, responsible });
            setCompanyMap(response.data);
        } catch (err) {
            console.error("Failed to update company", err);
        }
    };

    const updateGroupConfig = async (groupTag, responsible) => {
        try {
            const response = await axios.post(`/api/groups/${encodeURIComponent(groupTag)}/config`, { responsible });
            setGroupConfigs(response.data);
        } catch (err) {
            console.error("Failed to update group config", err);
        }
    };

    const getSbsPeople = () => {
        const people = new Set();
        groups.forEach(group => {
            group.emails.forEach(email => {
                const extracted = extractEmails(email.text, email.from);
                extracted.forEach(e => {
                    if (e.includes('@sbsempreendimentos.com.br')) {
                        people.add(e.toLowerCase());
                    }
                });
            });
        });
        return Array.from(people).sort();
    };

    // Helper Component for Responsible Selection
    const ResponsibleSelector = ({ current, onSelect }) => {
        const [isOpen, setIsOpen] = useState(false);
        const sbsPeople = getSbsPeople();

        return (
            <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50 hover:border-slate-300"
                >
                    <User className="w-4 h-4" />
                    <span className="max-w-[150px] truncate">
                        {current ? current.split('@')[0].replace('.', ' ') : 'Definir Responsável'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 overflow-hidden">
                            <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => { onSelect(null); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50"
                                >
                                    Ninguém
                                </button>
                                {sbsPeople.length > 0 ? (
                                    sbsPeople.map(email => (
                                        <button
                                            key={email}
                                            onClick={() => { onSelect(email); setIsOpen(false); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            {email.split('@')[0].replace('.', ' ')}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-xs text-slate-400 italic">Nenhum email SBS encontrado</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const getAllDomains = () => {
        const domains = new Set();
        groups.forEach(group => {
            group.emails.forEach(email => {
                const emails = extractEmails(email.text, email.from);
                emails.forEach(e => {
                    const domain = e.split('@')[1];
                    if (domain) domains.add(domain.toLowerCase());
                });
            });
        });
        // Also include manually added domains from map
        Object.keys(companyMap).forEach(d => domains.add(d));
        return Array.from(domains).sort();
    };

    const getCompanyBadge = (domain) => {
        const setting = companyMap[domain];
        if (setting && setting.ignored) return null;
        return {
            domain,
            displayName: (setting && setting.name) ? setting.name : domain
        };
    };

    const isGeneric = (domain) => {
        const generics = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'live.com', 'msn.com', 'icloud.com', 'uol.com.br',
            'bol.com.br', 'terra.com.br', 'ig.com.br', 'aol.com', 'protonmail.com'
        ];
        return generics.includes(domain);
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
                                    Email Timeline
                                </h1>
                                <p className="text-xs text-slate-500 font-medium tracking-wide">INTELLIGENT TRACKING</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="hidden md:flex items-center mr-4 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200">
                                <User className="w-4 h-4 text-slate-500 mr-2" />
                                <span className="text-sm font-medium text-slate-600">{currentUser?.name || currentUser?.email}</span>
                            </div>

                            <button
                                onClick={() => setView('timeline')}
                                className={`p-2 rounded-xl transition-all duration-200 ${view === 'timeline'
                                    ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="Timeline View"
                            >
                                <Calendar className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setView('settings-accounts')}
                                className={`p-2 rounded-xl transition-all duration-200 ${view === 'settings-accounts'
                                    ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="Email Accounts"
                            >
                                <Users className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setView('settings-companies')}
                                className={`p-2 rounded-xl transition-all duration-200 ${view === 'settings-companies'
                                    ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="Company Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setView('settings-users')}
                                className={`p-2 rounded-xl transition-all duration-200 ${view === 'settings-users'
                                    ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="User Management"
                            >
                                <Shield className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-slate-200 mx-2"></div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Indicator */}
                <div className="flex justify-end mb-6">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 inline-flex items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 border-r border-slate-100 mr-2">Status</span>
                        <div className="flex items-center space-x-2 px-1">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                            <span className="text-sm font-medium text-slate-700">{loading ? 'Syncing...' : error ? 'Error' : 'Live'}</span>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 border border-red-100 flex items-center shadow-sm">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                {
                    view === 'settings-accounts' && (
                        <div className="space-y-8">
                            <EmailAccountSettings />
                        </div>
                    )
                }

                {
                    view === 'settings-users' && (
                        <div className="space-y-8">
                            <UserSettings />
                        </div>
                    )
                }

                {
                    view === 'settings-companies' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-800">Company Domain Management</h2>
                                <p className="text-slate-500 mt-2">Assign friendly names to domains or hide irrelevant ones.</p>
                            </div>
                            <div className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 uppercase font-semibold text-slate-400 text-xs tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-4">Domain</th>
                                                <th className="px-8 py-4">Friendly Name / Alias</th>
                                                <th className="px-8 py-4 text-center">Visibility</th>
                                                <th className="px-8 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {getAllDomains().map(domain => {
                                                const setting = companyMap[domain] || {};
                                                const isIgnored = setting.ignored;

                                                // Auto-detect generic status for suggestion
                                                const generic = isGeneric(domain);

                                                return (
                                                    <tr key={domain} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-4 font-mono font-medium text-slate-700">{domain}</td>
                                                        <td className="px-8 py-4">
                                                            <div className="flex items-center max-w-xs bg-slate-100 rounded-lg p-1 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                                                <input
                                                                    type="text"
                                                                    className="bg-transparent border-none text-slate-800 text-sm w-full px-2 py-1 outline-none font-medium placeholder:font-normal placeholder:text-slate-400"
                                                                    placeholder="Enter alias..."
                                                                    value={setting.name || ''}
                                                                    onChange={(e) => updateCompanySetting(domain, e.target.value, !!setting.ignored)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-4 text-center">
                                                            <button
                                                                onClick={() => updateCompanySetting(domain, setting.name || '', !isIgnored)}
                                                                className={`p-2 rounded-lg transition-colors ${isIgnored ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                                title={isIgnored ? "Click to Show" : "Click to Hide"}
                                                            >
                                                                {isIgnored ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            {generic && !isIgnored && !setting.name && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    Generic Provider
                                                                </span>
                                                            )}
                                                            {setting.name && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Aliased: {setting.name}
                                                                </span>
                                                            )}
                                                            {isIgnored && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                                    Hidden
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    view === 'timeline' && (
                        /* Timeline View */
                        <div className="space-y-6">
                            {/* Account Tabs */}
                            {accountsData.length > 1 && (
                                <div className="flex space-x-2 bg-slate-200 p-1 rounded-xl w-fit">
                                    {accountsData.map(acc => (
                                        <button
                                            key={acc.account}
                                            onClick={() => setSelectedAccount(acc.account)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAccount === acc.account
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {acc.account}
                                            {acc.error && <span className="ml-2 text-red-500">⚠️</span>}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-12">
                                {/* Company Level Grouping */}
                                {(() => {
                                    // Helper to determine the company for a group
                                    const getGroupCompany = (group) => {
                                        const allDomains = group.emails.reduce((acc, email) => {
                                            const extracted = extractEmails(email.text, email.from);
                                            return [...acc, ...extracted.map(e => e.split('@')[1]?.toLowerCase()).filter(Boolean)];
                                        }, []);

                                        const domainCounts = {};
                                        allDomains.forEach(d => {
                                            domainCounts[d] = (domainCounts[d] || 0) + 1;
                                        });

                                        // Filter generics
                                        const candidates = Object.keys(domainCounts).filter(d => !isGeneric(d));

                                        // Sort by frequency
                                        candidates.sort((a, b) => domainCounts[b] - domainCounts[a]);

                                        let primaryDomain = candidates.length > 0 ? candidates[0] : 'outros';

                                        // Resolve to Name using Map or capitalize Domain
                                        if (companyMap[primaryDomain] && companyMap[primaryDomain].name) {
                                            return companyMap[primaryDomain].name;
                                        }
                                        if (primaryDomain === 'outros') return 'Outros / Geral';

                                        return primaryDomain.charAt(0).toUpperCase() + primaryDomain.slice(1);
                                    };

                                    const groupedByCompany = groups.reduce((acc, group) => {
                                        const company = getGroupCompany(group);
                                        if (!acc[company]) acc[company] = [];
                                        acc[company].push(group);
                                        return acc;
                                    }, {});

                                    // Sort Companies: 'Outros' last, others alphabetical
                                    const sortedCompanies = Object.keys(groupedByCompany).sort((a, b) => {
                                        if (a === 'Outros / Geral') return 1;
                                        if (b === 'Outros / Geral') return -1;
                                        return a.localeCompare(b);
                                    });

                                    return sortedCompanies.map(companyName => (
                                        <div key={companyName} className="bg-white/40 border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                                            {/* Company Header */}
                                            <div
                                                onClick={() => setCollapsedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }))}
                                                className="bg-white border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none gap-4"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="bg-slate-800 text-white p-3.5 rounded-2xl shadow-lg shadow-slate-900/10">
                                                        {/* Requires Building2 import, using temporary SVG if not imported yet, but we will add import */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{companyName}</h2>
                                                        <p className="text-sm font-medium text-slate-400 mt-1">{groupedByCompany[companyName].length} projetos ativos</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {/* Company Responsible Selector */}
                                                    {(() => {
                                                        const primaryDomain = Object.keys(companyMap).find(key => companyMap[key].name === companyName) || companyName.toLowerCase();
                                                        const currentResponsible = companyMap[primaryDomain]?.responsible;

                                                        return (
                                                            <div onClick={e => e.stopPropagation()}>
                                                                <ResponsibleSelector
                                                                    current={currentResponsible}
                                                                    onSelect={(email) => updateCompanySetting(primaryDomain, companyMap[primaryDomain]?.name, companyMap[primaryDomain]?.ignored, email)}
                                                                />
                                                            </div>
                                                        );
                                                    })()}

                                                    <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                                                        {collapsedCompanies[companyName] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Company Groups */}
                                            {!collapsedCompanies[companyName] && (
                                                <div className="p-4 md:p-6 space-y-6 bg-slate-50/50">
                                                    {groupedByCompany[companyName].map((group) => (
                                                        <div key={group.tag} className="animate-in fade-in slide-in-from-top-2 duration-300 bg-white rounded-2xl p-2 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                                                            <div
                                                                className="flex items-center mb-0 bg-transparent py-4 px-2 cursor-pointer rounded-xl select-none group-header"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleGroup(group.tag);
                                                                }}
                                                            >
                                                                <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-600/20 mr-4">
                                                                    <Hash className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">{group.tag}</h2>
                                                                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                                                                        <span className="text-xs font-semibold text-slate-400">{group.emails.length} atualizações</span>

                                                                        {/* Separator */}
                                                                        <span className="text-slate-300">•</span>

                                                                        {/* Group Responsible Selector */}
                                                                        <div onClick={e => e.stopPropagation()}>
                                                                            <ResponsibleSelector
                                                                                current={groupConfigs[group.tag]?.responsible}
                                                                                onSelect={(email) => updateGroupConfig(group.tag, email)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleGenerateSummary(group.tag);
                                                                    }}
                                                                    className="mr-2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                                    title="Gerar Resumo (IA)"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openUnfollowModal(group.tag);
                                                                    }}
                                                                    className="mr-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                    title="Deixar de Seguir Grupo"
                                                                >
                                                                    <BellOff className="w-5 h-5" />
                                                                </button>

                                                                <div className="text-slate-400 p-2 rounded-full hover:bg-slate-100">
                                                                    {collapsedGroups[group.tag] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                                                </div>
                                                            </div>

                                                            {!collapsedGroups[group.tag] && (
                                                                <div className="relative ml-5 md:ml-9 border-l-2 border-indigo-100 space-y-8 pl-8 md:pl-10 pb-6 pt-4">
                                                                    {group.emails.map((email) => (
                                                                        <div key={email.id} className="relative group/card">
                                                                            <div className="absolute -left-[43px] md:-left-[53px] top-6 w-5 h-5 md:w-6 md:h-6 bg-white border-[3px] border-indigo-500 rounded-full z-10 shadow-sm group-hover/card:scale-110 transition-transform duration-200"></div>

                                                                            <div
                                                                                className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-indigo-900/5 hover:border-indigo-200 transition-all duration-300 cursor-pointer"
                                                                                onClick={() => openEmailDetail(email)}
                                                                            >
                                                                                <div className="flex flex-col md:flex-row justify-between mb-3">
                                                                                    <h3 className="text-base font-bold text-slate-800 leading-snug pr-4">
                                                                                        {email.subject.replace(/#SBS:?\s*[^#]*/gi, '').trim() || email.subject}
                                                                                    </h3>
                                                                                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap mt-1 md:mt-0 bg-slate-50 px-2 py-1 rounded h-fit">
                                                                                        {email.date ? format(new Date(email.date), 'dd MMM') : ''}
                                                                                    </span>
                                                                                </div>

                                                                                <p className="text-slate-600 text-sm line-clamp-2 mb-4 border-l-2 border-slate-100 pl-3">
                                                                                    {email.snippet || "No snippet available."}
                                                                                </p>

                                                                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                                                    <div className="flex items-center text-xs text-slate-500">
                                                                                        <User className="w-3 h-3 mr-1.5 opacity-70" />
                                                                                        <span className="truncate max-w-[150px]">{email.from.replace(/<.*>/, '').trim()}</span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => handleShowInvolved(e, email)}
                                                                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors flex items-center"
                                                                                    >
                                                                                        Envolvidos
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()}

                                {!loading && groups.length === 0 && !error && (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200/50">
                                        <Mail className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No updates found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Unfollow Modal */}
            {
                unfollowModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center mb-6 text-amber-500">
                                <div className="bg-amber-100 p-3 rounded-full mr-4">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Deixar de Seguir?</h3>
                            </div>

                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                                Você está prestes a deixar de seguir o grupo <span className="font-bold text-slate-900">"{groupToUnfollow}"</span>. O que deseja fazer com o histórico?
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleUnfollow(false)}
                                    className="w-full py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-between group"
                                >
                                    <span>Manter Histórico</span>
                                    <span className="text-xs font-normal text-slate-500 group-hover:text-slate-700">Ignorar novos</span>
                                </button>

                                <button
                                    onClick={() => handleUnfollow(true)}
                                    className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 flex items-center justify-between"
                                >
                                    <span>Apagar Tudo</span>
                                    <span className="text-xs font-normal text-white/50">Remove dados</span>
                                </button>

                                <button
                                    onClick={closeUnfollowModal}
                                    className="w-full py-3 px-6 text-slate-400 hover:text-slate-600 font-semibold text-sm mt-2"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Email Detail Modal */}
            {
                selectedEmail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
                                <div className="pr-8">
                                    <h2 className="text-xl font-bold text-slate-800 leading-snug mb-2">
                                        {selectedEmail.subject}
                                    </h2>
                                    <div className="flex flex-wrap items-center text-sm text-slate-500 gap-3">
                                        <span className="flex items-center bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                                            <User className="w-3 h-3 mr-2 text-slate-400" />
                                            {selectedEmail.from}
                                        </span>
                                        <span className="flex items-center text-blue-600 font-medium">
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            {selectedEmail.date ? format(new Date(selectedEmail.date), 'PPpp') : 'Date Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeEmailDetail}
                                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto custom-scrollbar font-serif text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                                {selectedEmail.text || "No content."}
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
                                <button
                                    onClick={closeEmailDetail}
                                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Involved People Modal */}
            {
                involvedModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center text-slate-800">
                                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold">Pessoas Envolvidas</h3>
                                </div>
                                <button onClick={closeInvolvedModal} className="text-slate-400 hover:text-slate-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {involvedPeople.length > 0 ? (
                                    (() => {
                                        // Helper to format name: alexandre.fusco -> Alexandre Fusco
                                        const formatNameFromEmail = (email) => {
                                            const localPart = email.split('@')[0];
                                            return localPart
                                                .split(/[._-]/)
                                                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                                .join(' ');
                                        };

                                        // Helper to group by company
                                        const grouped = involvedPeople.reduce((acc, email) => {
                                            const domain = email.split('@')[1];
                                            let groupName = domain;

                                            // 1. Check for Alias
                                            if (companyMap[domain] && companyMap[domain].name) {
                                                groupName = companyMap[domain].name;
                                            }
                                            // 2. Check for Generic
                                            else if (isGeneric(domain)) {
                                                groupName = 'Outros';
                                            }

                                            if (!acc[groupName]) acc[groupName] = [];
                                            acc[groupName].push(formatNameFromEmail(email));
                                            return acc;
                                        }, {});

                                        // Sort groups: Aliased first, then Domains, then Outros
                                        const sortedGroups = Object.keys(grouped).sort((a, b) => {
                                            if (a === 'Outros') return 1;
                                            if (b === 'Outros') return -1;
                                            return a.localeCompare(b);
                                        });

                                        return sortedGroups.map(groupName => (
                                            <div key={groupName} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{groupName}</h4>
                                                <div className="space-y-2">
                                                    {grouped[groupName].map((name, idx) => (
                                                        <div key={idx} className="flex items-center">
                                                            <div className="bg-white border border-slate-200 rounded-full p-1.5 mr-3">
                                                                <User className="w-3 h-3 text-slate-400" />
                                                            </div>
                                                            <span className="text-slate-700 font-medium text-sm">{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    <p className="text-center text-slate-400 py-4">Nenhum e-mail encontrado.</p>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50">
                                <button
                                    onClick={closeInvolvedModal}
                                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Summary Modal */}
            {
                summaryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-100 p-3 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Resumo Inteligente</h2>
                                        <p className="text-sm text-slate-500 font-medium">Gerado por IA (Gemini Pro)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeSummaryModal}
                                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar leading-relaxed">
                                {isGeneratingSummary ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <p className="text-slate-500 font-medium animate-pulse">Analisando e-mails...</p>
                                    </div>
                                ) : summaryError ? (
                                    <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center">
                                        <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
                                        <p className="font-bold mb-1">Não foi possível gerar o resumo.</p>
                                        <p className="text-sm opacity-80">{summaryError}</p>
                                        {summaryError.includes("GEMINI_API_KEY") && (
                                            <div className="mt-4 text-xs bg-white p-3 rounded border border-red-100 text-left w-full max-w-md">
                                                <strong>Developer Note:</strong> Please add your API Key to <code>server/.env</code>:
                                                <pre className="mt-2 bg-slate-50 p-2 rounded">GEMINI_API_KEY=your_key_here</pre>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="prose prose-slate max-w-none">
                                        <div className="whitespace-pre-wrap text-slate-700 text-lg">
                                            {currentSummary}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/30 rounded-b-3xl flex justify-end">
                                <button
                                    onClick={closeSummaryModal}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}


export default App;
