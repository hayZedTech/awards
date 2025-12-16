import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { CheckCircle, Trophy, LogIn, LogOut, Mail, ChevronDown } from 'lucide-react';

const Vote = () => {
  const [session, setSession] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track current selections { categoryId: nomineeId }
  const [selections, setSelections] = useState({});

  // New state to manage which category cards are expanded (to show nominees)
  const [expandedCategories, setExpandedCategories] = useState({}); 

  // New state for manual email login
  const [email, setEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  // Track CONFIRMED votes fetched from DB
  const [votedCategoryIds, setVotedCategoryIds] = useState([]);
  
  // New state to store the specific nominee name the user voted for { categoryId: nomineeName }
  const [votedNomineeNames, setVotedNomineeNames] = useState({});

  useEffect(() => {
    // 1. Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginGoogle = async () => {
    // Sign in with Google
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/vote', // Redirect back here
      }
    });
    if (error) Swal.fire('Error', error.message, 'error');
  };

  const handleLoginEmail = async () => {
    if (!email) return Swal.fire('Error', 'Please enter your email.', 'error');
    setIsSendingMagicLink(true);

    const { error } = await supabase.auth.signInWithOtp({ 
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/vote',
      }
    });

    setIsSendingMagicLink(false);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Success', `Check your inbox at ${email} for the sign-in link!`, 'success');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setVotedCategoryIds([]);
    setVotedNomineeNames({});
  };

  const fetchData = async (userId) => {
    setLoading(true);
    try {
      // A. Fetch Structure (Categories, Nominees, Links)
      const [catRes, nomRes, linkRes] = await Promise.all([
        supabase.from('award_categories').select('*').order('created_at'),
        supabase.from('award_nominees').select('*'),
        supabase.from('award_nominations').select('*')
      ]);

      if (catRes.error) throw catRes.error;

      // B. Fetch USER'S existing votes
      // Now we need nominee_id AND category_id to map names later
      const { data: userVotes, error: voteErr } = await supabase
        .from('award_votes')
        .select('category_id, nominee_id')
        .eq('user_id', userId);

      if (voteErr) throw voteErr;

      // Stitch Data Logic (Categories and Nominees)
      const nomineeMap = new Map(nomRes.data.map(n => [n.id, n]));
      const structuredData = catRes.data.map(cat => {
        const catLinks = linkRes.data.filter(link => link.category_id === cat.id);
        const catNominees = catLinks.map(link => nomineeMap.get(link.nominee_id)).filter(Boolean);
        return { ...cat, nominees: catNominees };
      });
      setCategories(structuredData);

      // C. Process existing votes for UI state
      const votedCats = userVotes.map(v => v.category_id);
      const votedNamesMap = userVotes.reduce((acc, vote) => {
        const nominee = nomineeMap.get(vote.nominee_id);
        if (nominee) {
            acc[vote.category_id] = nominee.name;
        }
        return acc;
      }, {});

      setVotedCategoryIds(votedCats);
      setVotedNomineeNames(votedNamesMap);

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Could not load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (categoryId, nomineeId) => {
    setSelections(prev => ({ ...prev, [categoryId]: nomineeId }));
  };

  const toggleExpandCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const submitVote = async (category) => {
    const selectedNomineeId = selections[category.id];
    const selectedNominee = category.nominees.find(n => n.id === selectedNomineeId);

    if (!selectedNominee) return Swal.fire('Oops', 'Select a nominee first!', 'warning');

    if (votedCategoryIds.includes(category.id)) {
      return Swal.fire('Already Voted', 'You have already voted in this category.', 'info');
    }

    try {
      // Find the user's email from the session for logging
      const voterEmail = session.user.email || 'N/A'; 

      // Send to Supabase (including the voter_email)
      const { error } = await supabase.from('award_votes').insert([
        { 
          category_id: category.id, 
          nominee_id: selectedNomineeId,
          user_id: session.user.id,
          voter_email: voterEmail, // <-- ADDED VOTER EMAIL
        }
      ]);

      if (error) {
        if (error.code === '23505') {
            throw new Error('You have already voted in this category.');
        }
        throw error;
      }

      // Update Local State for UI
      setVotedCategoryIds(prev => [...prev, category.id]);
      setVotedNomineeNames(prev => ({ ...prev, [category.id]: selectedNominee.name }));
      setExpandedCategories(prev => ({ ...prev, [category.id]: false })); 

      Swal.fire({
        icon: 'success',
        title: 'Vote Cast!',
        text: 'Your vote has been recorded.',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.fire('Vote Failed', error.message, 'error');
    }
  };

  if (loading) return <div className="min-h-screen pt-20"><LoadingSpinner /></div>;

  // --- LOGIN SCREEN (If not authenticated) ---
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-yellow-600" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Your Choice</h1>
          <p className="text-gray-500 mb-8">To ensure fair voting, please sign in to access the ballot.</p>
          
          {/* Google Sign-in */}
          <button 
            onClick={handleLoginGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Email Login (Magic Link) */}
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-yellow-500 focus:border-yellow-500 transition"
            />
            <button
              onClick={handleLoginEmail}
              disabled={isSendingMagicLink}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm ${
                isSendingMagicLink
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {isSendingMagicLink ? (
                <>
                  <LoadingSpinner size={16} /> Sending Link...
                </>
              ) : (
                <>
                  <Mail size={18} /> Sign in with Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VOTING BALLOT (If authenticated) ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with User Info */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Official Ballot</h1>
            <p className="text-sm text-gray-500">Voting as: <span className="font-semibold text-gray-700">{session.user.email}</span></p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-red-100 transition">
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Categories Grid (4 on a row, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            
            const isCategoryCompleted = votedCategoryIds.includes(category.id);
            const isExpanded = expandedCategories[category.id];
            const votedNomineeName = votedNomineeNames[category.id]; // Get the voted name

            return (
              <div 
                key={category.id} 
                className={`bg-white rounded-2xl shadow-lg border transition-all duration-300 overflow-hidden
                  ${isCategoryCompleted ? 'border-green-500 ring-1 ring-green-500 opacity-90' : 'border-gray-200 hover:shadow-xl'}
                `}
              >
                
                {/* Category Header */}
                <div className="bg-gray-900 p-4 text-white relative overflow-hidden h-32 flex flex-col justify-between">
                  <div className="relative z-10">
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${isCategoryCompleted ? 'text-green-400' : 'text-white'}`}>
                      {category.name}
                      {isCategoryCompleted && <CheckCircle className="text-green-400" size={18} />}
                    </h2>
                    {category.description && (
                      <p className="text-gray-400 mt-1 text-xs leading-relaxed line-clamp-2">
                        {category.description}
                      </p>
                    )}
                     {/* ADDED: Display the voted nominee name */}
                    {isCategoryCompleted && votedNomineeName && (
                        <p className="text-sm font-semibold text-green-300 mt-2">
                            You Voted For: <span className="text-white">{votedNomineeName}</span>
                        </p>
                    )}
                  </div>
                  <Trophy className="absolute right-[-20px] bottom-[-20px] text-gray-800 opacity-50" size={80} />
                </div>

                {/* Dropdown Button / Status */}
                {!isCategoryCompleted ? (
                    <button
                        onClick={() => toggleExpandCategory(category.id)}
                        className={`w-full flex items-center justify-center gap-2 py-3 font-semibold transition-all ${
                            isExpanded ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {isExpanded ? 'Hide Nominees' : 'Cast Your Vote'}
                        <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                ) : (
                    <div className="bg-green-100 p-3 text-center border-t border-green-200">
                      <p className="text-green-800 font-semibold flex items-center justify-center gap-2 text-sm">
                        <CheckCircle size={16} /> Vote Submitted
                      </p>
                    </div>
                )}


                {/* Nominees List (Conditionally Rendered) */}
                {isExpanded && !isCategoryCompleted && category.nominees.length > 0 && (
                  <div className="p-4 space-y-2 border-t border-gray-100">
                    {category.nominees.map((nominee) => {
                      
                      const isSelected = selections[category.id] === nominee.id;

                      return (
                        <div 
                          key={nominee.id}
                          onClick={() => handleSelect(category.id, nominee.id)}
                          className={`
                            group flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 text-sm
                            ${isSelected 
                                ? 'bg-yellow-50 border-yellow-500 shadow-sm' 
                                : 'bg-white border-gray-100 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mr-3
                            ${isSelected ? 'border-yellow-500' : 'border-gray-300 group-hover:border-gray-400'}
                          `}>
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            )}
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-yellow-800' : 'text-gray-800'}`}>
                            {nominee.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submit Button */}
                {isExpanded && !isCategoryCompleted && category.nominees.length > 0 && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => submitVote(category)}
                      disabled={!selections[category.id]}
                      className={`
                        w-full py-2 rounded-lg font-bold text-sm transition-all transform active:scale-95
                        ${selections[category.id]
                          ? 'bg-gray-900 text-white hover:bg-black shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      Finalize Vote
                    </button>
                  </div>
                )}
                
                {/* No Nominees Message */}
                {isExpanded && category.nominees.length === 0 && (
                   <div className="p-4 text-center text-gray-400 italic text-sm">No nominees announced yet.</div>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Vote;