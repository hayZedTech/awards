import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../layouts/AdminLayout';
import { Trophy, Users, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminDashboard() {
    const [counts, setCounts] = useState({ categories: 0, nominees: 0, votes: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchCounts = async () => {
        setLoading(true);

        try {
            // Fetch counts for all tables
            const { count: catCount, error: catError } = await supabase.from('award_categories').select('*', { count: 'exact', head: true });
            const { count: nomCount, error: nomError } = await supabase.from('award_nominees').select('*', { count: 'exact', head: true });
            const { count: voteCount, error: voteError } = await supabase.from('award_votes').select('*', { count: 'exact', head: true });

            if (catError || nomError || voteError) {
                console.error("Error fetching dashboard counts:", catError || nomError || voteError);
            }

            setCounts({
                categories: catCount || 0,
                nominees: nomCount || 0,
                votes: voteCount || 0
            });
        } catch (error) {
            console.error("Unexpected error during fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    // 1. Define the class for the blur effect
    const contentClasses = loading ? 'filter blur-sm pointer-events-none' : 'filter-none';

    return (
        <AdminLayout>
            <div className="relative"> {/* Use relative positioning for the overlay */}
                {/* 2. Apply the conditional blur class to the entire content block */}
                <div className={contentClasses}>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
                    
                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Categories Card */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Total Categories</p>
                                <h3 className="text-3xl font-bold text-gray-800">{counts.categories}</h3>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                                <Trophy size={32} />
                            </div>
                        </div>

                        {/* Nominees Card */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Total Nominees</p>
                                <h3 className="text-3xl font-bold text-gray-800">{counts.nominees}</h3>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <Users size={32} />
                            </div>
                        </div>

                        {/* Votes Card */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase">Total Votes Cast</p>
                                <h3 className="text-3xl font-bold text-gray-800">{counts.votes}</h3>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full text-green-600">
                                <Star size={32} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700 mb-2">Welcome, Admin!</h3>
                        <p className="text-gray-500">
                            Use the sidebar navigation to manage your categories and nominees. 
                            Changes made there will reflect immediately on the public voting page.
                        </p>
                    </div>
                </div>

                {/* 3. Conditional Overlay for Loading Spinner */}
                {loading && (
                    <div className="absolute inset-0  z-10">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default AdminDashboard;