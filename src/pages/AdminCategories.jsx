import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react'; 
import { supabase } from '../lib/supabase'; 
import AdminLayout from '../layouts/AdminLayout';

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newDescription, setNewDescription] = useState({ description: '', category_id: '' });

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        // Fetch ordered by creation time, we will sort by name client-side for this request
        const { data } = await supabase.from('award_categories').select('*').order('created_at');
        setCategories(data || []);
        setLoading(false);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('award_categories').insert([{ name: newCatName }]).select().single();
        if (error) return Swal.fire('Error', error.message, 'error');
        setCategories([...categories, data]);
        setNewCatName('');
        Swal.fire('Success', 'Category added', 'success');
    };

    const handleEditCategory = async (cat) => {
        const { value: newName } = await Swal.fire({ title: 'Edit Name', input: 'text', inputValue: cat.name, showCancelButton: true });
        if (!newName) return;
        
        await supabase.from('award_categories').update({ name: newName }).eq('id', cat.id);
        setCategories(categories.map(c => c.id === cat.id ? { ...c, name: newName } : c));
        Swal.fire('Updated', '', 'success');
    };

    const handleDeleteCategory = async (cat) => {
        if(!(await Swal.fire({ title: 'Delete?', text: "Cannot undo", showCancelButton: true })).isConfirmed) return;
        await supabase.from('award_categories').delete().eq('id', cat.id);
        setCategories(categories.filter(c => c.id !== cat.id));
        Swal.fire('Deleted', '', 'success');
    };

    const handleUpdateDesc = async (e) => {
        e.preventDefault();
        await supabase.from('award_categories').update({ description: newDescription.description }).eq('id', newDescription.category_id);
        fetchCategories(); // Refresh
        setNewDescription({ description: '', category_id: '' });
        Swal.fire('Success', 'Description updated', 'success');
    };

    // New: Sort categories alphabetically by name
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <AdminLayout>
            <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Add Category - CARD BORDER IMPROVED */}
                <div className="bg-white p-5 rounded-xl shadow-md border-2 border-gray-500">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> New Category</h3>
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        {/* INPUT BORDER IMPROVED */}
                        <input 
                            className="border-2 border-gray-400 p-2 rounded w-full focus:border-blue-500 transition duration-150" 
                            value={newCatName} 
                            onChange={e => setNewCatName(e.target.value)} 
                            placeholder="Category Name" 
                            required 
                        />
                        <button className="bg-yellow-500 text-white px-4 rounded font-bold hover:bg-yellow-600 transition">Add</button>
                    </form>
                </div>

                {/* Update Description - CARD BORDER IMPROVED */}
                <div className="bg-white p-5 rounded-xl shadow-md border-2 border-gray-500">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Edit size={18}/> Update Description</h3>
                    <form onSubmit={handleUpdateDesc} className="space-y-2">
                        {/* SELECT BORDER IMPROVED */}
                        <select 
                            className="border-2 border-gray-400 p-2 rounded w-full bg-white focus:border-blue-500 transition duration-150" 
                            value={newDescription.category_id} 
                            onChange={e => setNewDescription({...newDescription, category_id: e.target.value})} 
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {/* TEXTAREA BORDER IMPROVED */}
                        <textarea 
                            className="border-2 border-gray-400 p-2 rounded w-full focus:border-blue-500 transition duration-150" 
                            rows={2} 
                            placeholder="Description..." 
                            value={newDescription.description} 
                            onChange={e => setNewDescription({...newDescription, description: e.target.value})} 
                            required 
                        />
                        <button className="bg-blue-500 text-white w-full py-2 rounded font-bold hover:bg-blue-600 transition">Update</button>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden border-2 border-gray-500">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            {/* CHANGED: Replaced 'Name' with 'Category Name' */}
                            <th className="p-4">Category Name</th> 
                            <th className="p-4">Description</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {/* CHANGED: Mapping over sortedCategories */}
                        {sortedCategories.map(cat => (
                            <tr key={cat.id}>
                                <td className="p-4 font-bold">{cat.name}</td>
                                <td className="p-4 text-sm text-gray-500">{cat.description || '-'}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEditCategory(cat)} className="text-blue-500 mr-3 hover:text-blue-700 transition"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700 transition"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Show loading state in the content area */}
            {loading && (
                <div className="mt-4 p-4 text-center text-gray-500 flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={20} /> Loading categories...
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminCategories;