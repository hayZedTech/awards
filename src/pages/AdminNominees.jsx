import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react'; 
import { supabase } from '../lib/supabase'; 
import AdminLayout from '../layouts/AdminLayout';

function AdminNominees() {
    const [nominees, setNominees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newNominee, setNewNominee] = useState({ name: '', categoryId: 'all' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Nominees (base data)
            const { data: nomData, error: nomErr } = await supabase.from('award_nominees').select('*');
            if (nomErr) throw nomErr;

            // 2. Fetch Categories (for linking and dropdown)
            const { data: catData, error: catErr } = await supabase.from('award_categories').select('*');
            if (catErr) throw catErr;
            setCategories(catData || []);
            const categoryMap = new Map(catData.map(c => [c.id, c.name]));

            // 3. Fetch Nomination Links
            const { data: linkData, error: linkErr } = await supabase.from('award_nominations').select('nominee_id, category_id');
            if (linkErr) throw linkErr;

            // 4. Structure data: Nominee + Categories
            const structuredNominees = nomData.map(nom => {
                const links = linkData.filter(link => link.nominee_id === nom.id);
                const categoryNames = links
                    .map(link => categoryMap.get(link.category_id))
                    .filter(Boolean);

                return {
                    ...nom,
                    categoryNames: categoryNames.sort((a, b) => a.localeCompare(b)), // Sort categories for consistent display/sorting
                };
            });

            // 5. Sort the final list primarily by the first assigned category name
            const sortedNominees = structuredNominees.sort((a, b) => {
                const aCat = a.categoryNames[0] || '';
                const bCat = b.categoryNames[0] || '';
                // Sort by Category Name first, then Nominee Name
                if (aCat.localeCompare(bCat) !== 0) {
                    return aCat.localeCompare(bCat);
                }
                return a.name.localeCompare(b.name);
            });
            
            setNominees(sortedNominees);

        } catch (error) {
            Swal.fire('Error fetching data', error.message, 'error');
            setNominees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNominee = async (e) => {
        e.preventDefault();
        
        try {
            // 1. Create Nominee
            const { data: createdNom, error: nomErr } = await supabase
                .from('award_nominees').insert([{ name: newNominee.name }]).select().single();
            
            if (nomErr) throw nomErr;

            // 2. Link to Category/Categories
            let catsToLink = [];
            if (newNominee.categoryId === 'all') {
                catsToLink = categories;
            } else {
                catsToLink = categories.filter(c => c.id === newNominee.categoryId);
            }

            const links = catsToLink.map(c => ({ category_id: c.id, nominee_id: createdNom.id }));
            if(links.length > 0) await supabase.from('award_nominations').insert(links);

            // Re-fetch data to properly display the new entry with category names and sorting
            Swal.fire('Success', 'Nominee added!', 'success');
            setNewNominee({ name: '', categoryId: 'all' });
            fetchData(); 

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleEditNominee = async (nom) => {
        const { value: newName } = await Swal.fire({ title: 'Edit Name', input: 'text', inputValue: nom.name, showCancelButton: true });
        if (!newName) return;
        
        await supabase.from('award_nominees').update({ name: newName }).eq('id', nom.id);
        // Refresh entire list to ensure sorting consistency
        fetchData(); 
        Swal.fire('Updated', '', 'success');
    };

    const handleDeleteNominee = async (nom) => {
        if(!(await Swal.fire({ title: 'Delete?', text: "Removes nominee and all associated votes/links.", showCancelButton: true })).isConfirmed) return;
        
        // Deleting the nominee CASCADE deletes related nominations and votes in a well-configured DB.
        // We delete from the base table.
        await supabase.from('award_nominees').delete().eq('id', nom.id);
        
        setNominees(nominees.filter(n => n.id !== nom.id));
        Swal.fire('Deleted', '', 'success');
    };

    return (
        <AdminLayout>
            <h2 className="text-2xl font-bold mb-6">Manage Nominees</h2>

            {/* Add Nominee Form */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-gray-500 mb-8 max-w-2xl">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Add New Nominee</h3>
                <form onSubmit={handleAddNominee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        className="border-2 border-gray-400 p-2 rounded w-full focus:border-green-600 transition duration-150" 
                        value={newNominee.name} 
                        onChange={e => setNewNominee({...newNominee, name: e.target.value})} 
                        placeholder="Nominee Name" 
                        required 
                    />
                    
                    <select 
                        className="border-2 border-gray-400 p-2 rounded w-full bg-white focus:border-green-600 transition duration-150" 
                        value={newNominee.categoryId} 
                        onChange={e => setNewNominee({...newNominee, categoryId: e.target.value})}
                    >
                        <option value="all">★ All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <button className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition">Add Nominee</button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow overflow-hidden border-2 border-gray-500">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-4">Nominee Name</th>
                            {/* CHANGED: Replaced ID with Category */}
                            <th className="p-4">Categories</th> 
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {nominees.map(nom => (
                            <tr key={nom.id}>
                                <td className="p-4 font-bold">{nom.name}</td>
                                {/* CHANGED: Displaying category names */}
                                <td className="p-4 text-sm text-gray-700">
                                    {nom.categoryNames && nom.categoryNames.length > 0 
                                        ? nom.categoryNames.join(', ')
                                        : <span className="text-red-500 italic">Unassigned</span>
                                    }
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEditNominee(nom)} className="text-blue-500 mr-3 hover:text-blue-700 transition"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteNominee(nom)} className="text-red-500 hover:text-red-700 transition"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Show loading state in the content area */}
                {loading && (
                    <div className="p-5 text-center text-gray-500 flex items-center justify-center">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading nominees...
                    </div>
                )}
                {!loading && nominees.length === 0 && <div className="p-5 text-center text-gray-500">No nominees found.</div>}
            </div>
        </AdminLayout>
    );
}

export default AdminNominees;