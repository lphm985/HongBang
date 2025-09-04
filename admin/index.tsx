import React, { useState, useEffect, useCallback, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';

const API_BASE_URL = '/api';

// --- Type Definitions ---
type Option = { value: string | number; label: string };

type ColumnDefinition = {
    name: string;
    label: string;
    type?: string;
    inputType?: 'select';
    options?: Option[];
};

type FormField = {
    name: string;
    label: string;
    isKey?: boolean;
    required?: boolean;
    type?: string;
    inputType?: 'select';
    options?: Option[];
    objectAsList?: {
        keyName: string;
        valueName: string;
        valueType?: 'number' | 'string';
    };
    columns?: ColumnDefinition[];
};

type DisplayColumn = {
    key: string;
    label: string;
};

type AdminStats = {
    playerCount: number;
    guildCount: number;
};

type ItemIdOption = {
    value: string;
    label: string;
};

type AdminMetadata = {
    bonusTypes: Option[];
    equipmentSlots: Option[];
    itemIds: {
        pills: ItemIdOption[];
        herbs: ItemIdOption[];
        equipment: ItemIdOption[];
    };
};

type GenericData = Record<string, any>;


// --- Reusable UI Components ---

type InputProps = { label: string } & React.InputHTMLAttributes<HTMLInputElement>;
const Input: FC<InputProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input {...props} className="block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
    </div>
);

type SelectProps = { label: string; options?: Option[] } & React.SelectHTMLAttributes<HTMLSelectElement>;
const Select: FC<SelectProps> = ({ label, options = [], ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <select {...props} className="block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50">
             <option value="">-- Chọn --</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

type TextAreaProps = { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>;
const TextArea: FC<TextAreaProps> = ({ label, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <textarea {...props} rows={props.rows || 5} className="block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm disabled:opacity-50" />
    </div>
)

type CheckboxProps = { label: string } & React.InputHTMLAttributes<HTMLInputElement>;
const Checkbox: FC<CheckboxProps> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input type="checkbox" {...props} className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-600" />
        <label className="ml-2 block text-sm text-slate-300">{label}</label>
    </div>
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const Button: FC<ButtonProps> = ({ children, className, ...props }) => (
    <button {...props} className={`justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${className}`}>
        {children}
    </button>
);

interface ModalProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
}
const Modal: FC<ModalProps> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b border-slate-600 flex-shrink-0">
                <h2 className="text-2xl font-semibold text-cyan-300">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
            </header>
            <main className="p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
);

// --- List Editor Component ---
interface ListEditorProps {
    value?: GenericData[];
    onChange: (newList: GenericData[]) => void;
    columns: ColumnDefinition[];
}
const ListEditor: FC<ListEditorProps> = ({ value = [], onChange, columns }) => {
    const handleRowChange = (index: number, fieldName: string, fieldValue: string) => {
        const newList = [...value];
        const currentItem = { ...newList[index] };
        
        const columnDef = columns.find(c => c.name === fieldName);
        if (columnDef && columnDef.type === 'number') {
            currentItem[fieldName] = fieldValue === '' ? '' : parseFloat(fieldValue);
        } else {
            currentItem[fieldName] = fieldValue;
        }

        newList[index] = currentItem;
        onChange(newList);
    };

    const addRow = () => {
        const newRow = columns.reduce((acc, col) => {
            acc[col.name] = col.type === 'number' ? 0 : '';
            return acc;
        }, {} as GenericData);
        onChange([...value, newRow]);
    };

    const removeRow = (index: number) => {
        const newList = value.filter((_, i) => i !== index);
        onChange(newList);
    };

    return (
        <div className="space-y-2 p-2 border border-slate-700 rounded-md bg-slate-900/50">
            {value.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                    {columns.map(col => (
                        <div key={col.name} className="flex-1">
                            <label className="text-xs text-slate-400">{col.label}</label>
                             {col.inputType === 'select' ? (
                                <select
                                    value={item[col.name] ?? ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRowChange(index, col.name, e.target.value)}
                                    className="block w-full text-sm bg-slate-700 border border-slate-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                     <option value="">-- Chọn --</option>
                                    {col.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                             ) : (
                                <input
                                    type={col.type || 'text'}
                                    value={item[col.name] ?? ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRowChange(index, col.name, e.target.value)}
                                    className="block w-full text-sm bg-slate-700 border border-slate-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                             )}
                        </div>
                    ))}
                    <button type="button" onClick={() => removeRow(index)} className="mt-4 flex-shrink-0 w-8 h-8 rounded bg-red-600/50 hover:bg-red-600 text-white font-bold">
                        &times;
                    </button>
                </div>
            ))}
            <Button type="button" onClick={addRow} className="w-full bg-slate-600 hover:bg-slate-500 text-sm py-1">
                + Thêm Dòng
            </Button>
        </div>
    );
};


// --- Generic Edit Form ---
interface EditFormProps {
    initialData: GenericData;
    formFields: FormField[];
    onSave: (data: GenericData) => void;
    onCancel: () => void;
}
const EditForm: FC<EditFormProps> = ({ initialData, formFields, onSave, onCancel }) => {
    const [formData, setFormData] = useState<GenericData>(() => {
        const data = { ...initialData };
        formFields.forEach(field => {
            if (field.type === 'json' && typeof data[field.name] === 'object' && data[field.name] !== null && !Array.isArray(data[field.name])) {
                data[field.name] = JSON.stringify(data[field.name], null, 2);
            }
             if (field.type === 'boolean') {
                data[field.name] = !!data[field.name];
            }
             if (field.objectAsList) {
                const obj = data[field.name] || {};
                data[field.name] = Object.entries(obj).map(([key, value]) => ({ 
                    [field.objectAsList!.keyName]: key, 
                    [field.objectAsList!.valueName]: value 
                }));
            }
        });
        return data;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleListChange = (name: string, value: GenericData[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let dataToSave = { ...formData };
        try {
            formFields.forEach(field => {
                 if (field.type === 'json' && typeof dataToSave[field.name] === 'string') {
                    dataToSave[field.name] = JSON.parse(dataToSave[field.name]);
                }
                if (field.objectAsList) {
                    const arr = (dataToSave[field.name] as GenericData[]) || [];
                    dataToSave[field.name] = arr.reduce((acc, row) => {
                        const key = row[field.objectAsList!.keyName];
                        const rawValue = row[field.objectAsList!.valueName];
                        if (key) {
                           acc[key] = field.objectAsList!.valueType === 'number' ? Number(rawValue) : rawValue;
                        }
                        return acc;
                    }, {} as GenericData);
                }
            });
            onSave(dataToSave);
        } catch (err) {
            alert(`Lỗi phân tích cú pháp: ${(err as Error).message}`);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map(field => {
                 const commonProps = {
                    key: field.name,
                    label: field.label,
                    name: field.name,
                    disabled: field.isKey,
                    required: field.required,
                };

                if (field.type === 'list' || field.objectAsList) {
                     return (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                            <ListEditor
                                value={formData[field.name] || []}
                                onChange={(newList) => handleListChange(field.name, newList)}
                                columns={field.columns!}
                            />
                        </div>
                    );
                }

                const props: any = {
                    ...commonProps,
                    value: formData[field.name] ?? '',
                    onChange: handleChange,
                };
                 if (field.type === 'boolean') {
                    props.checked = formData[field.name] === true;
                }
                
                if (field.type === 'json') return <TextArea {...props} />;
                if (field.type === 'boolean') return <Checkbox {...props} />;
                if (field.type === 'textarea') return <TextArea {...props} rows={3}/>;
                if (field.inputType === 'select') return <Select {...props} options={field.options}/>;
                return <Input {...props} type={field.type || 'text'} />;
            })}
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" onClick={onCancel} className="bg-slate-600 hover:bg-slate-500">Hủy</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Lưu</Button>
            </div>
        </form>
    );
};

// --- Generic Data Manager Component ---
interface DataManagerProps {
    token: string;
    tableName: string;
    title: string;
    primaryKey?: string;
    formFields: FormField[];
    displayColumns: DisplayColumn[];
}
const DataManager: FC<DataManagerProps> = ({ token, tableName, title, primaryKey = 'id', formFields, displayColumns }) => {
    const [data, setData] = useState<GenericData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<GenericData | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/${tableName}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể tải dữ liệu.');
            const jsonData = await res.json();
            setData(jsonData);
        } catch (error) {
            alert(`Lỗi tải ${tableName}: ` + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token, tableName]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (item: GenericData) => {
        const isNew = item[primaryKey] === undefined || item[primaryKey] === '';
        const url = isNew ? `${API_BASE_URL}/admin/${tableName}` : `${API_BASE_URL}/admin/${tableName}/${item[primaryKey]}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(item),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            alert(`Lỗi lưu ${tableName}: ` + (error as Error).message);
        }
    };

    const handleDelete = async (item: GenericData) => {
        if (!confirm(`Bạn có chắc muốn xóa '${item[displayColumns[1].key]}' không?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/${tableName}/${item[primaryKey]}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            fetchData();
        } catch (error) {
             alert(`Lỗi xóa ${tableName}: ` + (error as Error).message);
        }
    };
    
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-300">{title}</h2>
                <Button onClick={() => setEditingItem({})} className="bg-green-600 hover:bg-green-700">+ Tạo Mới</Button>
            </header>
            
            {isLoading ? <p>Đang tải...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                            <tr>
                                {displayColumns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
                                <th scope="col" className="px-6 py-3 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item[primaryKey]} className="border-b border-slate-700 hover:bg-slate-800">
                                    {displayColumns.map(col => <td key={col.key} className="px-6 py-4">{item[col.key]?.toString()}</td>)}
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingItem(item)} className="font-medium text-blue-400 hover:underline">Sửa</button>
                                        <button onClick={() => handleDelete(item)} className="font-medium text-red-400 hover:underline">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingItem && (
                <Modal title={editingItem[primaryKey] ? `Sửa ${title}` : `Tạo Mới ${title}`} onClose={() => setEditingItem(null)}>
                    <EditForm initialData={editingItem} formFields={formFields} onSave={handleSave} onCancel={() => setEditingItem(null)} />
                </Modal>
            )}
        </div>
    );
};

// --- Player Manager ---
interface PlayerData {
    name: string;
    realmIndex: number;
    is_banned: boolean;
    [key: string]: any; 
}
interface PlayerManagerProps {
    token: string;
    metadata: AdminMetadata;
}
const PlayerManager: FC<PlayerManagerProps> = ({ token, metadata }) => {
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [search, setSearch] = useState('');
    const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null);

    const fetchPlayers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/players?search=${search}`, { headers: { 'Authorization': `Bearer ${token}` }});
            const data = await res.json();
            setPlayers(data);
        } catch (err) {
            alert('Lỗi tìm người chơi: ' + (err as Error).message);
        }
    }, [token, search]);

    useEffect(() => {
        const handler = setTimeout(() => fetchPlayers(), 300);
        return () => clearTimeout(handler);
    }, [fetchPlayers]);

    const handleSave = async (playerData: GenericData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/players/${playerData.name}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(playerData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            setEditingPlayer(null);
            fetchPlayers();
        } catch(err) {
            alert('Lỗi cập nhật người chơi: ' + (err as Error).message);
        }
    };
    
    const playerFormFields: FormField[] = [
        { name: 'name', label: 'Tên', isKey: true },
        { name: 'qi', label: 'Linh Khí', type: 'number' },
        { name: 'linh_thach', label: 'Linh Thạch', type: 'number' },
        { name: 'realmIndex', label: 'Cảnh Giới (Index)', type: 'number' },
        { name: 'bodyStrength', label: 'Luyện Thể', type: 'number' },
        { name: 'karma', label: 'Ác Nghiệp', type: 'number' },
        { name: 'honorPoints', label: 'Điểm Vinh Dự', type: 'number' },
        { name: 'enlightenmentPoints', label: 'Điểm Lĩnh Ngộ', type: 'number' },
        { name: 'is_banned', label: 'Đã Khóa', type: 'boolean' },
        { name: 'ban_reason', label: 'Lý Do Khóa', type: 'textarea' },
        { name: 'pvpBuff', label: 'Buff PvP (JSON)', type: 'json'},
        { name: 'pills', label: 'Đan Dược', objectAsList: { keyName: 'pillId', valueName: 'amount', valueType: 'number' }, columns: [ { name: 'pillId', label: 'Pill ID', inputType: 'select', options: metadata.itemIds.pills }, { name: 'amount', label: 'Số Lượng', type: 'number' }]},
        { name: 'herbs', label: 'Linh Thảo', objectAsList: { keyName: 'herbId', valueName: 'amount', valueType: 'number' }, columns: [ { name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs}, { name: 'amount', label: 'Số Lượng', type: 'number' }]},
        { name: 'inventory', label: 'Túi Đồ (Chỉ chứa Equipment ID)', type: 'list', columns: [{name: 'itemId', label: 'Equipment ID', inputType: 'select', options: metadata.itemIds.equipment }] },
        { name: 'equipment', label: 'Trang Bị (JSON)', type: 'json' },
    ];
    
    return (
         <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">Quản Lý Người Chơi</h2>
            <Input label="Tìm theo tên" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập tên người chơi..." />
             <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-3">Tên</th><th className="px-6 py-3">Cảnh Giới</th><th className="px-6 py-3">Trạng Thái</th><th className="px-6 py-3 text-right">Hành Động</th>
                        </tr>
                    </thead>
                     <tbody>
                        {players.map(p => (
                            <tr key={p.name} className="border-b border-slate-700 hover:bg-slate-800">
                                <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                                <td className="px-6 py-4">{p.realmIndex}</td>
                                <td className="px-6 py-4">{p.is_banned ? <span className="text-red-400 font-bold">Đã Khóa</span> : <span className="text-green-400">Hoạt Động</span>}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setEditingPlayer(p)} className="font-medium text-blue-400 hover:underline">Sửa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {editingPlayer && (
                <Modal title={`Sửa Người Chơi: ${editingPlayer.name}`} onClose={() => setEditingPlayer(null)}>
                    <EditForm initialData={editingPlayer} formFields={playerFormFields} onSave={handleSave} onCancel={() => setEditingPlayer(null)} />
                </Modal>
             )}
        </div>
    )
}

// --- Guild War Manager ---
interface GuildWarManagerProps {
    token: string;
}
const GuildWarManager: FC<GuildWarManagerProps> = ({ token }) => {
    const [warState, setWarState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const fetchWarState = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/guild_war_details`, { headers: { 'Authorization': `Bearer ${token}` }});
            if (!res.ok) throw new Error('Không thể tải dữ liệu Tông Môn Chiến.');
            setWarState(await res.json());
        } catch (err) {
            alert('Lỗi: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchWarState() }, [fetchWarState]);

    const handleForceProcess = async (matchId: number) => {
        if (!confirm(`Bạn có chắc muốn ép xử lý vòng đấu cho trận ${matchId}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/guild_war/force_process/${matchId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
            fetchWarState();
        } catch(err) {
            alert('Lỗi: ' + (err as Error).message);
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (!warState || !warState.active_war) return (
        <div className="bg-slate-800/50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-300">Quản Lý Tông Môn Chiến</h2>
            <p className="mt-4">Không có Tông Môn Chiến nào đang hoạt động.</p>
        </div>
    );

    const { active_war, matches } = warState;

    const renderLineup = (lineup: any) => {
        if (!lineup) return <span className="text-yellow-400">Chưa xếp</span>;
        return (
            <ol className="list-decimal list-inside text-xs">
                <li>{lineup.player1_name}</li>
                <li>{lineup.player2_name}</li>
                <li>{lineup.player3_name}</li>
            </ol>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h2 className="text-2xl font-bold text-cyan-300">Cuộc Chiến Hiện Tại: {active_war.name}</h2>
                <p>Trạng thái: <span className="font-semibold text-amber-300">{active_war.status}</span></p>
                <p>Bắt đầu: {new Date(active_war.start_time).toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">Các Trận Đấu</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Tông Môn 1</th>
                                <th className="px-4 py-2">Tông Môn 2</th>
                                <th className="px-4 py-2">Tỉ Số</th>
                                <th className="px-4 py-2">Vòng</th>
                                <th className="px-4 py-2">Trạng Thái</th>
                                <th className="px-4 py-2">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((match: any) => (
                                <tr key={match.id} className="border-b border-slate-700 hover:bg-slate-800">
                                    <td className="px-4 py-2">{match.id}</td>
                                    <td className="px-4 py-2">{match.guild1_name}</td>
                                    <td className="px-4 py-2">{match.guild2_name}</td>
                                    <td className="px-4 py-2 font-bold">{match.guild1_round_wins} - {match.guild2_round_wins}</td>
                                    <td className="px-4 py-2">{match.current_round}</td>
                                    <td className="px-4 py-2">{match.status}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button onClick={() => setSelectedMatch(match)} className="font-medium text-blue-400 hover:underline">Chi Tiết</button>
                                        {match.status === 'PENDING_LINEUP' && (
                                            <button onClick={() => handleForceProcess(match.id)} className="font-medium text-red-400 hover:underline">Ép Xử Lý</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {selectedMatch && (
                <Modal title={`Chi Tiết Trận Đấu #${selectedMatch.id}`} onClose={() => setSelectedMatch(null)}>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-xl text-white">{selectedMatch.guild1_name}</h4>
                             <p className="text-sm text-slate-400">Đội hình vòng {selectedMatch.current_round}:</p>
                            <div className="mt-2 p-2 bg-slate-700/50 rounded">{renderLineup(selectedMatch.guild1_lineup)}</div>
                        </div>
                         <div>
                            <h4 className="font-bold text-xl text-white">{selectedMatch.guild2_name}</h4>
                            <p className="text-sm text-slate-400">Đội hình vòng {selectedMatch.current_round}:</p>
                            <div className="mt-2 p-2 bg-slate-700/50 rounded">{renderLineup(selectedMatch.guild2_lineup)}</div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// --- Main Dashboard ---
interface AdminDashboardProps {
    token: string;
    onLogout: () => void;
}
const AdminDashboard: FC<AdminDashboardProps> = ({ token, onLogout }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [stats, setStats] = useState<AdminStats>({ playerCount: 0, guildCount: 0 });
    const [metadata, setMetadata] = useState<AdminMetadata>({
        bonusTypes: [],
        equipmentSlots: [],
        itemIds: { pills: [], herbs: [], equipment: [] }
    });
    const [isMetadataLoading, setIsMetadataLoading] = useState(true);

    useEffect(() => {
        const fetchAllMetadata = async () => {
             setIsMetadataLoading(true);
            try {
                const [statsRes, bonusTypesRes, itemIdsRes] = await Promise.all([
                     fetch(`${API_BASE_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                     fetch(`${API_BASE_URL}/admin/metadata/bonus-types`, { headers: { 'Authorization': `Bearer ${token}` } }),
                     fetch(`${API_BASE_URL}/admin/metadata/item-ids`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                
                setStats(await statsRes.json());

                const bonusTypesData = await bonusTypesRes.json();
                const itemIdsData = await itemIdsRes.json();
                
                setMetadata({
                    bonusTypes: bonusTypesData.bonusTypes.map((t: string) => ({ value: t, label: t })),
                    equipmentSlots: bonusTypesData.equipmentSlots.map((s: string) => ({ value: s, label: s })),
                    itemIds: {
                        pills: itemIdsData.pills.map((i: {id: string, name: string}) => ({ value: i.id, label: `${i.name} (${i.id})`})),
                        herbs: itemIdsData.herbs.map((i: {id: string, name: string}) => ({ value: i.id, label: `${i.name} (${i.id})`})),
                        equipment: itemIdsData.equipment.map((i: {id: string, name: string}) => ({ value: i.id, label: `${i.name} (${i.id})`})),
                    }
                });
            } catch (err) { 
                console.error("Could not fetch metadata", err);
                alert("Không thể tải dữ liệu meta cho admin panel.");
            } finally {
                setIsMetadataLoading(false);
            }
        };
        fetchAllMetadata();
    }, [token]);

    const handleReloadData = async () => {
        if (!confirm('Bạn có chắc muốn làm mới dữ liệu game trên server? Hành động này sẽ cập nhật mọi thay đổi cho tất cả người chơi.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/reload-gamedata`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert('Làm mới dữ liệu thành công!');
        } catch (err) {
            alert('Lỗi: ' + (err as Error).message);
        }
    };
    
    const navItems = [
        { key: 'dashboard', label: 'Tổng Quan' },
        { key: 'players', label: 'Người Chơi' },
        { key: 'guilds', label: 'Tông Môn' },
        { key: 'guild_wars_manager', label: 'Quản Lý T.M.C' },
        { key: 'market_listings', label: 'Chợ Giao Dịch' },
        { key: 'events', label: 'Sự Kiện' },
        { key: 'gift_codes', label: 'Giftcode' },
        { type: 'divider', label: 'Dữ Liệu Game' },
        { key: 'guild_wars', label: 'Tạo T.M.C' },
        { key: 'realms', label: 'Cảnh Giới' },
        { key: 'techniques', label: 'Công Pháp' },
        { key: 'equipment', label: 'Trang Bị' },
        { key: 'herbs', label: 'Linh Thảo' },
        { key: 'pills', label: 'Đan Dược' },
        { key: 'recipes', label: 'Đan Phương' },
    ];

    const rewardsColumns: ColumnDefinition[] = [
        { name: 'type', label: 'Loại (qi, herb, equipment)', type: 'text' },
        { name: 'amount', label: 'Số Lượng', type: 'number' },
        { name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs },
        { name: 'equipmentId', label: 'Equipment ID', inputType: 'select', options: metadata.itemIds.equipment },
    ];
    
    const guildWarRewardsColumns: ColumnDefinition[] = [
        { name: 'type', label: 'Loại (linh_thach, honor_points, equipment, pill)', type: 'text' },
        { name: 'amount', label: 'Số Lượng', type: 'number' },
        { name: 'itemId', label: 'Item ID (cho equipment/pill)', type: 'text' }, // Can't be a dropdown as it can be pill or equip
        { name: 'description', label: 'Mô tả (cho admin)', type: 'text' },
    ];

    const renderView = () => {
        if (isMetadataLoading) return <div>Đang tải dữ liệu cấu hình...</div>;
        switch(activeView) {
            case 'dashboard': return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-xl text-slate-400">Tổng Số Người Chơi</h3>
                        <p className="text-5xl font-bold text-cyan-300 mt-2">{stats.playerCount}</p>
                    </div>
                     <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-xl text-slate-400">Tổng Số Tông Môn</h3>
                        <p className="text-5xl font-bold text-cyan-300 mt-2">{stats.guildCount}</p>
                    </div>
                </div>
            );
            case 'players': return <PlayerManager token={token} metadata={metadata} />;
            case 'guilds': return <DataManager token={token} tableName="guilds" title="Quản Lý Tông Môn" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên Tông Môn' }, { key: 'leaderName', label: 'Tông Chủ' }, {key: 'level', label: 'Cấp'}, {key: 'memberCount', label: 'Thành Viên'}]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'leaderName', label: 'Tông Chủ' }, { name: 'level', label: 'Cấp', type: 'number' }, { name: 'exp', label: 'Kinh Nghiệm', type: 'number' }]} />;
            case 'guild_wars_manager': return <GuildWarManager token={token} />;
            case 'guild_wars': return <DataManager token={token} tableName="guild_wars" title="Tạo Mới Tông Môn Chiến" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên Sự Kiện' }, { key: 'start_time', label: 'Thời Gian Bắt Đầu' }, {key: 'status', label: 'Trạng Thái'}]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên Sự Kiện' }, { name: 'start_time', label: 'Thời Gian Bắt Đầu', type: 'datetime-local' }, { name: 'status', label: 'Trạng Thái (PENDING, REGISTRATION, IN_PROGRESS, COMPLETED)' }, { name: 'rewards', label: 'Phần thưởng cho Tông Môn thắng', type: 'list', columns: guildWarRewardsColumns }]} />;
            case 'market_listings': return <DataManager token={token} tableName="market_listings" title="Quản Lý Chợ" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'seller_name', label: 'Người Bán' }, { key: 'item_id', label: 'Vật Phẩm' }, { key: 'price', label: 'Giá'}]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'seller_name', label: 'Người Bán' }, { name: 'item_id', label: 'Vật Phẩm ID' }, { name: 'price', label: 'Giá', type: 'number' }, { name: 'expires_at', label: 'Hết Hạn', type: 'datetime-local' }]} />;
            case 'events': return <DataManager token={token} tableName="events" title="Quản Lý Sự Kiện" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'title', label: 'Tiêu Đề' }, { key: 'bonus_type', label: 'Loại Bonus'}]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'title', label: 'Tiêu Đề' }, { name: 'description', label: 'Mô Tả' }, { name: 'bonus_type', label: 'Loại Bonus' }, { name: 'bonus_value', label: 'Giá Trị Bonus', type: 'number' }, { name: 'starts_at', label: 'Bắt Đầu', type: 'datetime-local' }, { name: 'expires_at', label: 'Kết Thúc', type: 'datetime-local' }, { name: 'is_active', label: 'Kích Hoạt', type: 'boolean' }]} />;
            case 'gift_codes': return <DataManager token={token} tableName="gift_codes" title="Quản Lý Giftcode" primaryKey="code" displayColumns={[{ key: 'code', label: 'Mã' }, { key: 'uses', label: 'Lượt Dùng' }, {key: 'max_uses', label: 'Tối Đa'}]} formFields={[{ name: 'code', label: 'Mã', isKey: true }, { name: 'rewards', label: 'Phần Thưởng', type: 'list', columns: rewardsColumns }, { name: 'max_uses', label: 'Số Lượt Tối Đa', type: 'number' }, { name: 'expires_at', label: 'Hết Hạn', type: 'datetime-local' }]} />;
            case 'realms': return <DataManager token={token} tableName="realms" title="Quản Lý Cảnh Giới" primaryKey="realmIndex" displayColumns={[{ key: 'realmIndex', label: 'Index' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'realmIndex', label: 'Index', type: 'number', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'qiThreshold', label: 'Linh Khí Cần', type: 'number' }, { name: 'baseQiPerSecond', label: 'Linh Khí/s', type: 'number' }, { name: 'breakthroughChance', label: 'Tỉ Lệ Đột Phá', type: 'number' }, { name: 'baseHp', label: 'HP Gốc', type: 'number' }, { name: 'baseAtk', label: 'ATK Gốc', type: 'number' }, { name: 'baseDef', label: 'DEF Gốc', type: 'number' }]} />;
            case 'techniques': return <DataManager token={token} tableName="techniques" title="Quản Lý Công Pháp" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'requiredRealmIndex', label: 'Cảnh Giới Yêu Cầu', type: 'number' }, { name: 'bonuses', label: 'Bonuses', type: 'list', columns: [{name: 'type', label: 'Loại', inputType: 'select', options: metadata.bonusTypes}, {name: 'value', label: 'Giá trị', type: 'number'}] }]} />;
            case 'equipment': return <DataManager token={token} tableName="equipment" title="Quản Lý Trang Bị" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }, { key: 'slot', label: 'Loại'}]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'slot', label: 'Loại', inputType: 'select', options: metadata.equipmentSlots }, { name: 'bonuses', label: 'Bonuses', type: 'list', columns: [{name: 'type', label: 'Loại', inputType: 'select', options: metadata.bonusTypes}, {name: 'value', label: 'Giá trị', type: 'number'}] }]} />;
            case 'herbs': return <DataManager token={token} tableName="herbs" title="Quản Lý Linh Thảo" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }]} />;
            case 'pills': return <DataManager token={token} tableName="pills" title="Quản Lý Đan Dược" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'effect', label: 'Hiệu Ứng (JSON)', type: 'json' }]} />;
            case 'recipes': return <DataManager token={token} tableName="recipes" title="Quản Lý Đan Phương" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'pillId', label: 'Pill ID', inputType: 'select', options: metadata.itemIds.pills }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'requiredRealmIndex', label: 'Cảnh Giới Yêu Cầu', type: 'number' }, { name: 'qiCost', label: 'Linh Khí Tốn', type: 'number' }, { name: 'herbCosts', label: 'Nguyên Liệu', objectAsList: { keyName: 'herbId', valueName: 'amount', valueType: 'number'}, columns: [{name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs}, {name: 'amount', label: 'Số lượng', type: 'number'}]}, { name: 'successChance', label: 'Tỉ Lệ Thành Công', type: 'number' }]} />;
            default: return <div>Chọn một mục để quản lý</div>
        }
    };
    
    return (
        <div className="flex min-h-screen">
            <aside className="w-64 bg-slate-900 text-slate-300 p-4 flex flex-col flex-shrink-0">
                <h1 className="text-2xl font-bold text-cyan-300 text-center mb-8">Admin Panel</h1>
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {navItems.map(item => item.type === 'divider' ?
                            <li key={item.label} className="pt-4 pb-2 text-sm uppercase text-slate-500 font-semibold tracking-wider">{item.label}</li> :
                            <li key={item.key}>
                                <button onClick={() => setActiveView(item.key!)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === item.key ? 'bg-cyan-500/10 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {item.label}
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
                 <div className="flex-shrink-0 space-y-2">
                     <Button onClick={handleReloadData} className="w-full bg-amber-600 hover:bg-amber-500">⚡ Làm Mới Dữ Liệu</Button>
                     <Button onClick={onLogout} className="w-full bg-slate-600 hover:bg-slate-500">Đăng Xuất</Button>
                 </div>
            </aside>
            <main className="flex-grow p-8 bg-slate-900/80">
                {renderView()}
            </main>
        </div>
    );
};

interface AdminLoginProps {
    onLoginSuccess: (token: string) => void;
}
const AdminLogin: FC<AdminLoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');
            onLoginSuccess(data.admin_token);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
             <div className="w-full max-w-sm">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
                        Admin Login
                    </h1>
                </header>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-8">
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Tên đăng nhập</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required  className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-400">Mật khẩu</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
                        </div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </Button>
                     </form>
                </div>
            </div>
        </div>
    );
};

const AdminApp: FC = () => {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            setAdminToken(token);
        }
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (token: string) => {
        localStorage.setItem('admin_token', token);
        setAdminToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setAdminToken(null);
    };

    if (isLoading) {
        return <div className="min-h-screen flex justify-center items-center"><p>Đang tải...</p></div>;
    }

    if (!adminToken) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return <AdminDashboard token={adminToken} onLogout={handleLogout} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><AdminApp /></React.StrictMode>);
