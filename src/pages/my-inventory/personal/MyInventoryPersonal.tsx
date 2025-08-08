import React, { useState, useEffect } from 'react';
import './MyInventoryPersonal.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import myInventoryPersonalService, { type InventoryCategory } from '../../../services/myInventoryPersonal.service';

const MyInventoryPersonal: React.FC = () => {
    const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const firebase = useFirebase();
    
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [editCategoryTitle, setEditCategoryTitle] = useState('');
    const [categoryToEdit, setCategoryToEdit] = useState<InventoryCategory | null>(null);
    const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    
    const [isEditDataModalOpen, setIsEditDataModalOpen] = useState(false);
    const [isDeleteDataModalOpen, setIsDeleteDataModalOpen] = useState(false);
    const [dataToEdit, setDataToEdit] = useState<{ categoryId: string; itemId: string } | null>(null);
    const [editDataName, setEditDataName] = useState('');
    const [editDataNumber, setEditDataNumber] = useState<number>(1);
    const [dataToDelete, setDataToDelete] = useState<{ categoryId: string; itemId: string } | null>(null);
    
    const [isAddDataModalOpen, setIsAddDataModalOpen] = useState(false);
    const [newDataName, setNewDataName] = useState('');
    const [newDataNumber, setNewDataNumber] = useState(1);
    const [categoryToAddData, setCategoryToAddData] = useState<string | null>(null);

    useEffect(() => {
        if (firebase && firebase.auth) {
            const unsubscribe = onAuthStateChanged(firebase.auth, (user: User | null) => {
                setUser(user);
                if (user) {
                    loadCategories(user.uid);
                } else {
                    setCategories([]);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [firebase]);

    const loadCategories = async (userId: string) => {
        try {
            const userCategories = await myInventoryPersonalService.getUserCategories(userId);
            setCategories(userCategories);
        } catch (error) {
            console.error('Error loading inventory categories:', error);
        }
    };

    const handleAccordionClick = (id: string) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) {
        return (
            <div className="my-inventory-personal-page">
                <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                    Caricamento...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="my-inventory-personal-page">
                <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                    Effettua il login per vedere il tuo inventario
                </div>
            </div>
        );
    }

    return (
        <div className="my-inventory-personal-page">
            <div className="my-inventory-personal-container">
                <h1 className='title'>My Inventory - Personal</h1>
                <div className="accordion-list">
                {categories.map(category => {
                    if (!category.id) return null; // Skip categories without ID
                    
                    return (
                    <div className="accordion-item" key={category.id}>
                        <div className="category-header">
                            <button
                                className="accordion-title"
                                onClick={() => handleAccordionClick(category.id!)}
                            >
                                <span className="category-title">{category.title}</span>
                            </button>
                            <div className="category-actions">
                                <button
                                    className="todo-edit-button"
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setCategoryToEdit(category);
                                        setEditCategoryTitle(category.title);
                                        setIsEditCategoryModalOpen(true);
                                    }}
                                    title="Modifica categoria"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                    className="todo-delete-button"
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setCategoryToDelete(category.id!);
                                        setIsDeleteCategoryModalOpen(true);
                                    }}
                                    title="Elimina categoria"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                        {expanded[category.id] && (
                            <div className="accordion-content" style={{ position: 'relative', paddingBottom: '48px' }}>
                                {category.data.length === 0
                                    ? <span>Nessun materiale presente</span>
                                    : (
                                        <ul>
                                            {category.data.map((item) => (
                                                <li key={item.id} className='li-personal-inventory'>
                                                    <span>
                                                        {item.name} - {item.number}
                                                    </span>
                                                    <div className="category-actions">
                                                        <button
                                                            className="todo-edit-button"
                                                            type="button"
                                                            onClick={() => {
                                                                setDataToEdit({ categoryId: category.id!, itemId: item.id });
                                                                setEditDataName(item.name);
                                                                setEditDataNumber(item.number);
                                                                setIsEditDataModalOpen(true);
                                                            }}
                                                            title="Modifica dato"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button
                                                            className="todo-delete-button"
                                                            type="button"
                                                            onClick={() => {
                                                                setDataToDelete({ categoryId: category.id!, itemId: item.id });
                                                                setIsDeleteDataModalOpen(true);
                                                            }}
                                                            title="Elimina dato"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                }
                                <button
                                    className="add-data-floating-button"
                                    onClick={() => {
                                        setCategoryToAddData(category.id!);
                                        setNewDataName('');
                                        setNewDataNumber(1);
                                        setIsAddDataModalOpen(true);
                                    }}
                                    title="Aggiungi elemento"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                    );
                })}
            </div>
            <button
                className="add-category-floating-button"
                onClick={() => {
                    setIsCategoryModalOpen(true);
                    setNewCategoryTitle('');
                }}
                aria-label="Aggiungi categoria"
            >
                +
            </button>

            {/* Modale aggiunta categoria */}
            {isCategoryModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Aggiungi Categoria</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!user || !newCategoryTitle.trim()) return;
                                
                                try {
                                    const newCategory = await myInventoryPersonalService.addCategory(
                                        user.uid,
                                        newCategoryTitle.trim()
                                    );
                                    setCategories(prevCategories => [...prevCategories, newCategory]);
                                    setNewCategoryTitle('');
                                    setIsCategoryModalOpen(false);
                                } catch (error) {
                                    console.error('Error adding category:', error);
                                }
                            }}
                        >
                            <label>
                                Nome categoria:
                                <input
                                    type="text"
                                    value={newCategoryTitle}
                                    onChange={e => setNewCategoryTitle(e.target.value)}
                                    autoFocus
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">
                                    Aggiungi
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                >
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modale modifica categoria */}
            {isEditCategoryModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Modifica Categoria</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!editCategoryTitle.trim() || !categoryToEdit?.id) return;
                                
                                try {
                                    await myInventoryPersonalService.updateCategory(
                                        categoryToEdit.id,
                                        editCategoryTitle.trim()
                                    );
                                    setCategories(categories =>
                                        categories.map(cat =>
                                            cat.id === categoryToEdit.id
                                                ? { ...cat, title: editCategoryTitle.trim() }
                                                : cat
                                        )
                                    );
                                    setIsEditCategoryModalOpen(false);
                                    setCategoryToEdit(null);
                                } catch (error) {
                                    console.error('Error updating category:', error);
                                }
                            }}
                        >
                            <label>
                                Nome categoria:
                                <input
                                    type="text"
                                    value={editCategoryTitle}
                                    onChange={e => setEditCategoryTitle(e.target.value)}
                                    autoFocus
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">
                                    Salva
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setIsEditCategoryModalOpen(false)}
                                >
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {isDeleteCategoryModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Sei sicuro di voler cancellare la categoria?</h3>
                        <div className="delete-actions">
                            <button
                                type="button"
                                className="confirm-button"
                                onClick={async () => {
                                    if (!categoryToDelete) return;
                                    
                                    try {
                                        await myInventoryPersonalService.deleteCategory(categoryToDelete);
                                        setCategories(categories => categories.filter(cat => cat.id !== categoryToDelete));
                                        setIsDeleteCategoryModalOpen(false);
                                        setCategoryToDelete(null);
                                    } catch (error) {
                                        console.error('Error deleting category:', error);
                                    }
                                }}
                            >
                                Sì
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => {
                                    setIsDeleteCategoryModalOpen(false);
                                    setCategoryToDelete(null);
                                }}
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {isEditDataModalOpen && dataToEdit && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Modifica Dato</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!dataToEdit) return;
                                
                                try {
                                    await myInventoryPersonalService.updateItem(
                                        dataToEdit.categoryId,
                                        dataToEdit.itemId,
                                        { name: editDataName, number: editDataNumber }
                                    );
                                    setCategories(categories =>
                                        categories.map(cat =>
                                            cat.id === dataToEdit.categoryId
                                                ? {
                                                    ...cat,
                                                    data: cat.data.map(item =>
                                                        item.id === dataToEdit.itemId
                                                            ? { ...item, name: editDataName, number: editDataNumber }
                                                            : item
                                                    )
                                                }
                                                : cat
                                        )
                                    );
                                    setIsEditDataModalOpen(false);
                                    setDataToEdit(null);
                                } catch (error) {
                                    console.error('Error updating item:', error);
                                }
                            }}
                        >
                            <label>
                                Nome:
                                <input
                                    type="text"
                                    value={editDataName}
                                    onChange={e => setEditDataName(e.target.value)}
                                    autoFocus
                                />
                            </label>
                            <label>
                                Numero:
                                <input
                                    type="number"
                                    value={editDataNumber}
                                    onChange={e => setEditDataNumber(Number(e.target.value))}
                                    min={1}
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">
                                    Salva
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setIsEditDataModalOpen(false)}
                                >
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteDataModalOpen && dataToDelete && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Sei sicuro di voler eliminare questo dato?</h3>
                        <div className="delete-actions">
                            <button
                                type="button"
                                className="confirm-button"
                                onClick={async () => {
                                    if (!dataToDelete) return;
                                    
                                    try {
                                        await myInventoryPersonalService.deleteItem(
                                            dataToDelete.categoryId,
                                            dataToDelete.itemId
                                        );
                                        setCategories(categories =>
                                            categories.map(cat =>
                                                cat.id === dataToDelete.categoryId
                                                    ? {
                                                        ...cat,
                                                        data: cat.data.filter(item => item.id !== dataToDelete.itemId)
                                                    }
                                                    : cat
                                            )
                                        );
                                        setIsDeleteDataModalOpen(false);
                                        setDataToDelete(null);
                                    } catch (error) {
                                        console.error('Error deleting item:', error);
                                    }
                                }}
                            >
                                Sì
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setIsDeleteDataModalOpen(false)}
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddDataModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Aggiungi elemento</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!categoryToAddData || !newDataName.trim()) return;
                                
                                try {
                                    const newItem = await myInventoryPersonalService.addItem(
                                        categoryToAddData,
                                        newDataName.trim(),
                                        newDataNumber
                                    );
                                    setCategories(categories =>
                                        categories.map(cat =>
                                            cat.id === categoryToAddData
                                                ? {
                                                    ...cat,
                                                    data: [...cat.data, newItem]
                                                }
                                                : cat
                                        )
                                    );
                                    setIsAddDataModalOpen(false);
                                    setNewDataName('');
                                    setNewDataNumber(1);
                                    setCategoryToAddData(null);
                                } catch (error) {
                                    console.error('Error adding item:', error);
                                }
                            }}
                        >
                            <label>
                                Nome:
                                <input
                                    type="text"
                                    value={newDataName}
                                    onChange={e => setNewDataName(e.target.value)}
                                    autoFocus
                                />
                            </label>
                            <label>
                                Numero:
                                <input
                                    type="number"
                                    value={newDataNumber}
                                    min={1}
                                    onChange={e => setNewDataNumber(Number(e.target.value))}
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">
                                    Aggiungi
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setIsAddDataModalOpen(false)}
                                >
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default MyInventoryPersonal;