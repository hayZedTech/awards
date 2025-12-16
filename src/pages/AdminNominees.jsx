import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react'; 
import { supabase } from '../lib/supabase'; 
import AdminLayout from '../layouts/AdminLayout';

function AdminNominees() {
    const [nominees, setNominees] = useState([]);
    const [categories, setCategories] = useState([]); // Needed for dropdown
    const [loading, setLoading] = useState(false);
    const [newNominee, setNewNominee] = useState({ name: '', categoryId: 'all' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Nominees
        const { data: nomData } = await supabase.from('award_nominees').select('*').order('name');
        setNominees(nomData || []);
        
        // Fetch Categories for the dropdown
        const { data: catData } = await supabase.from('award_categories').select('*').order('name');
        setCategories(catData || []);
        setLoading(false);
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

            setNominees([...nominees, createdNom]);
            setNewNominee({ name: '', categoryId: 'all' });
            Swal.fire('Success', 'Nominee added!', 'success');

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleEditNominee = async (nom) => {
        const { value: newName } = await Swal.fire({ title: 'Edit Name', input: 'text', inputValue: nom.name, showCancelButton: true });
        if (!newName) return;
        
        await supabase.from('award_nominees').update({ name: newName }).eq('id', nom.id);
        setNominees(nominees.map(n => n.id === nom.id ? { ...n, name: newName } : n));
        Swal.fire('Updated', '', 'success');
    };

    const handleDeleteNominee = async (nom) => {
        if(!(await Swal.fire({ title: 'Delete?', text: "Removes from all categories", showCancelButton: true })).isConfirmed) return;
        await supabase.from('award_nominees').delete().eq('id', nom.id);
        setNominees(nominees.filter(n => n.id !== nom.id));
        Swal.fire('Deleted', '', 'success');
    };

    return (
        <AdminLayout>
             <h2 className="text-2xl font-bold mb-6">Manage Nominees</h2>

             {/* Add Nominee Form */}
             <div className="bg-white p-5 rounded-xl shadow-sm border mb-8 max-w-2xl">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Add New Nominee</h3>
                <form onSubmit={handleAddNominee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input className="border p-2 rounded w-full" value={newNominee.name} onChange={e => setNewNominee({...newNominee, name: e.target.value})} placeholder="Nominee Name" required />
                    
                    <select className="border p-2 rounded w-full bg-white" value={newNominee.categoryId} onChange={e => setNewNominee({...newNominee, categoryId: e.target.value})}>
                        <option value="all">★ All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <button className="bg-green-600 text-white px-4 py-2 rounded font-bold">Add Nominee</button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4 text-xs text-gray-400">ID</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {nominees.map(nom => (
                            <tr key={nom.id}>
                                <td className="p-4 font-bold">{nom.name}</td>
                                <td className="p-4 text-xs text-gray-400 font-mono">{nom.id.split('-')[0]}...</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEditNominee(nom)} className="text-blue-500 mr-3"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteNominee(nom)} className="text-red-500"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {nominees.length === 0 && <div className="p-5 text-center text-gray-500">No nominees found.</div>}
            </div>
        </AdminLayout>
    );
}

export default AdminNominees;