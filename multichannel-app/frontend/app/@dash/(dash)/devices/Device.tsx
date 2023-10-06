'use client';

import { IconEdit, IconTrash } from '@tabler/icons-react';
import { NewCode } from './NewCode';
import { useSupabase } from '../../../supabase-provider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DeviceProps = {
    index: number;
    id: string;
    name: string;
};

export const Device = ({index, id, name }: DeviceProps) => {
    const { supabase } = useSupabase();
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(name);

    const handleDelete = async () => {
        const { error } = await supabase.from('devices').delete().eq('id', id);

        if (error) {
            console.error(error);
            throw error;
        }

        router.refresh();
    };

    const handleEdit = async () => {
        const { error } = await supabase.from('devices').update({ device_name: newName }).eq('id', id);

        if (error) {
            console.error(error);
            throw error;
        }

        setEditMode(false);
        router.refresh();
    };

    const toggleEditMode = () => setEditMode(mode=> !mode);

    if (editMode) return (
        <tr>
            <td>{index + 1}</td>
            <td>
                <input type='text' className='input' value={newName} onChange={(e) => setNewName(e.target.value)} />
            </td>
            <td className='flex items-center justify-end gap-2 '>
                <button className='btn btn-primary' onClick={handleEdit} aria-label='Save'>
                    <IconEdit />
                </button>
                <button className='btn btn-danger' onClick={toggleEditMode} aria-label='Cancel'>
                    <IconTrash />
                </button>
            </td>
        </tr>
    );

    return (
        <tr>
            <td>{index +1}</td>
            <td>{name}</td>
            <td className='flex items-center justify-between w-full'>
                    <NewCode device_id={id} />
                    <button className='btn btn-primary' aria-label='Edit' onClick={toggleEditMode}>
                        <IconEdit />
                    </button>
                    <button className='btn btn-error' aria-label='Delete' onClick={handleDelete}>
                        <IconTrash />
                    </button>
            </td>
        </tr>
    );
};