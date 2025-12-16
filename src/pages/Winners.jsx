import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Zap, ChevronDown, Award, Users, AlertTriangle, Database } from 'lucide-react';

// ⚠️ IMPORTANT: Configuration now uses Supabase keys and URL.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ; 
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ; 

// Utility function to make a secure Supabase fetch request
const supabaseFetch = async (endpoint) => {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
        }
    });

    if (!response.ok) {
        let errorMessage = `API Error fetching ${endpoint}. Status: ${response.status}.`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // ignore
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

// Simple loading component
const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center py-24 bg-gray-900">
        
        {/* The new, stylish spinner container */}
        <div className="relative w-24 h-24 mb-4">
            
            {/* The main spinning ring with better colors and shadow */}
            <div className="absolute inset-0 
                          animate-spin 
                          rounded-full 
                          w-full h-full 
                          border-8 border-t-8 border-b-8 
                          border-gray-700 border-t-yellow-500 border-b-green-500
                          shadow-xl shadow-yellow-500/50"
            ></div>
            
            {/* An awards icon in the center */}
            <div className="absolute inset-0 flex justify-center items-center">
                <Trophy size={32} className="text-yellow-400 animate-pulse" />
            </div>
        </div>
        
        <p className="mt-4 text-xl font-semibold text-white tracking-wider">
            Loading and Tallying Votes...
        </p>
        <p className="text-sm text-gray-400">
            A moment while we determine the winners.
        </p>
    </div>
);

/**
 * Renders the official winners page by fetching raw vote data and processing it,
 * correctly using the 'award_nominations' table for category-nominee linkage.
 */
const Winners = () => {
    const [data, setData] = useState({ 
        categories: [], 
        nominees: [], 
        nominations: [], // NEW: To link nominees to categories
        votes: [] 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            
            if (!SUPABASE_URL || !ANON_KEY) {
                setError("Configuration Error: Supabase URL or Anon Key is missing. Check environment variables.");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Categories (award names)
                const categories = await supabaseFetch('award_categories?select=id,name');

                // 2. Fetch Nominees (candidate names)
                const nominees = await supabaseFetch('award_nominees?select=id,name');

                // 3. Fetch Nominations (the linkage table: MUST have category_id and nominee_id)
                const nominations = await supabaseFetch('award_nominations?select=id,category_id,nominee_id');

                // 4. Fetch Votes (the raw vote data: MUST have a nominee_id to tally)
                // If this fails, the issue is that votes link to a *nomination* ID instead.
                const votes = await supabaseFetch('award_votes?select=nominee_id'); 
                
                setData({ categories, nominees, nominations, votes });

            } catch (err) {
                console.error("Data Fetch Error:", err);
                setError(`Data fetch failed: ${err.message || 'Check Supabase table permissions (RLS) and names. If this error persists, verify that the ' + 
                          'award_nominations table contains ' + '**category_id** and **nominee_id** and that the award_votes table contains **nominee_id**.'}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, []);

    // --- CLIENT-SIDE AGGREGATION LOGIC ---
    const results = useMemo(() => {
        // If there's no core data, return early
        if (loading || data.categories.length === 0) return []; 

        const categoryMap = new Map(data.categories.map(c => [c.id, c.name]));
        const nomineeNameMap = new Map(data.nominees.map(n => [n.id, n.name]));

        // 1. Calculate raw vote counts for every nominee ID
        const voteTally = data.votes.reduce((acc, vote) => {
            const nomineeId = vote.nominee_id;
            if (nomineeId !== undefined && nomineeId !== null) {
                // IMPORTANT: This tally relies on `award_votes.nominee_id` existing.
                acc[nomineeId] = (acc[nomineeId] || 0) + 1;
            }
            return acc;
        }, {});

        // 2. Group tallied nominees by category using the 'nominations' table
        const categorizedResults = new Map();

        // Initialize all categories (even empty ones)
        data.categories.forEach(category => {
             categorizedResults.set(category.id, []);
        });

        // Loop through the nominations table to build the final list
        // This is the step that connects the nominee ID to the category ID.
        data.nominations.forEach(nomination => {
            const nomineeId = nomination.nominee_id;
            const categoryId = nomination.category_id;
            const nomineeName = nomineeNameMap.get(nomineeId) || `Unknown Nominee (${nomineeId})`;
            const voteCount = voteTally[nomineeId] || 0;
            
            if (categorizedResults.has(categoryId)) {
                categorizedResults.get(categoryId).push({
                    // Use the Nomination ID as the key for list rendering
                    id: nomination.id, 
                    name: nomineeName,
                    voteCount: voteCount,
                });
            }
        });

        // 3. Final transformation into the component's required structure
        const finalResults = Array.from(categorizedResults).map(([categoryId, nomineesTally]) => {
            
            // a. Find the maximum vote count in this category
            const maxVotes = nomineesTally.reduce((max, nom) => Math.max(max, nom.voteCount), 0);

            // b. Filter only nominees with votes, and sort them
            const votedNominees = nomineesTally
                .filter(nom => nom.voteCount > 0)
                .sort((a, b) => b.voteCount - a.voteCount);

            // c. Determine the winner(s)
            let winnerDetails = { name: "No Winner Yet", voteCount: 0 };
            
            if (maxVotes > 0) {
                const tiedWinners = nomineesTally.filter(nom => nom.voteCount === maxVotes);
                
                winnerDetails = {
                    name: tiedWinners.map(nom => nom.name).join(' & '),
                    voteCount: maxVotes
                };
            }
            
            return {
                categoryName: categoryMap.get(categoryId) || `Category ${categoryId}`,
                winner: winnerDetails, 
                fullTally: votedNominees,
            };
        });

        return finalResults;

    }, [data, loading]); 

    // --- RENDER LOGIC ---

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="max-w-4xl mx-auto mt-12 p-6">
            <div className="bg-red-900 border border-red-400 text-red-300 px-4 py-3 rounded-xl shadow-md flex items-start gap-3">
                <AlertTriangle className="mt-1" size={24} />
                <div>
                    <strong className="font-bold">Results Processing Error:</strong>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2 flex items-center"><Database size={14} className="mr-1"/> **Database Logic Check:** The application is now using the **`award_nominations`** table as the bridge between `award_categories` and `award_nominees`. Please confirm the following column names exist:</p>
                    <ul className="list-disc list-inside text-xs mt-1">
                        <li>`award_nominations` has: `category_id` and `nominee_id`</li>
                        <li>`award_votes` has: `nominee_id` (for tallying)</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <Trophy className="text-yellow-500 mx-auto mb-3" size={38} />
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">
                        And The Winners Are...
                    </h1>
                    <p className="mt-2 text-xl text-yellow-300">
                        Celebrating the best across all categories.
                    </p>
                </div>

                {results.length === 0 && (
                    <div className="bg-blue-800 border-l-4 border-blue-500 text-white p-4 max-w-lg mx-auto rounded-lg">
                        <p className="font-medium">No categories or votes retrieved. Please check your Supabase data and table permissions.</p>
                    </div>
                )}
                
                {/* Categories Grid (1 on mobile, 2 on medium, 3 on large/extra large) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {results.map((item, index) => {
                        const maxVotes = item.winner.voteCount;
                        const hasZeroVotes = maxVotes === 0;

                        let winnerStatus = "Winner";
                        let winnerName = item.winner.name;
                        let headerBg = "bg-green-600";
                        let mainIcon = <Trophy className="inline mr-1" size={20} />;
                        
                        // --- TIE DETECTION AND STATUS ASSIGNMENT ---
                        if (maxVotes > 0) {
                            // Check if the winner name contains the join character '&' (implies a tie)
                            if (winnerName.includes(' & ')) {
                                winnerStatus = "TIE!";
                                headerBg = "bg-yellow-600"; 
                                mainIcon = <Users className="inline mr-1" size={20} />;
                            }
                        } else {
                            winnerStatus = "Pending";
                            winnerName = "No Votes Cast";
                            headerBg = "bg-gray-700"; 
                            mainIcon = <Zap className="inline mr-1" size={20} />;
                        }
                        
                        const votedNominees = item.fullTally; 

                        return (
                            <div 
                                key={index} 
                                className="flex flex-col bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                {/* Category Header */}
                                <div className={`p-4 rounded-t-xl ${headerBg} text-white`}>
                                    <h2 className="text-xl font-bold flex items-center">
                                        <Award size={24} className="mr-2" />
                                        {item.categoryName}
                                    </h2>
                                </div>
                                
                                {/* Winner / Status Body */}
                                <div className="p-5 flex-grow">
                                    <p className={`text-sm font-semibold mb-1 ${hasZeroVotes ? 'text-gray-400' : 'text-yellow-400'}`}>
                                        {winnerStatus}
                                    </p>
                                    <h3 className={`text-2xl font-extrabold leading-tight ${hasZeroVotes ? 'text-gray-500' : 'text-white'}`}>
                                        {winnerName}
                                    </h3>
                                    <p className="mt-2 text-gray-400 text-sm">
                                        Total Votes: <strong className="text-white">{maxVotes}</strong>
                                    </p>
                                </div>

                                {/* Detailed Tally Footer */}
                                <div className="p-4 bg-gray-700 rounded-b-xl">
                                    <details className="cursor-pointer">
                                        <summary className="flex items-center justify-between font-semibold text-blue-300 hover:text-blue-200">
                                            <span>Full Vote Breakdown ({votedNominees.length} Voted Nominees)</span>
                                            <ChevronDown size={16} className="ml-2" />
                                        </summary>
                                        
                                        {/* Nominee List */}
                                        <ul className="mt-3 space-y-2">
                                            {votedNominees.map(nom => {
                                                const isTopResult = !hasZeroVotes && nom.voteCount === maxVotes;
                                                return (
                                                    <li 
                                                        key={nom.id} 
                                                        className={`flex justify-between items-center p-2 rounded-lg transition-colors 
                                                            ${isTopResult ? 'bg-yellow-900 border-l-4 border-yellow-500' : 'bg-gray-800'}`
                                                        }
                                                    >
                                                        <span className={`text-sm ${isTopResult ? 'font-bold text-white' : 'text-gray-300'}`}>
                                                            {isTopResult ? mainIcon : null} {nom.name}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isTopResult ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-gray-300'}`}>
                                                            {nom.voteCount} Votes
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                            {votedNominees.length === 0 && (
                                                <p className="text-sm text-gray-500 pt-2">No nominees received votes yet.</p>
                                            )}
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Winners;