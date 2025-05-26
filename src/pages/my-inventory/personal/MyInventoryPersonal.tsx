// import React, { useState } from 'react';
// import './MyInventoryPersonal.scss';

// const MyInventoryPersonal: React.FC = () => {
//   const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
//   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
//   const [newCategoryTitle, setNewCategoryTitle] = useState('');
//   const [categories, setCategories] = useState<
//     { id: number; title: string; data: { name: string; number: number }[] }[]
//   >([
//     {
//       id: 1,
//       title: 'Strumenti Personali',
//       data: [
//         { name: 'Chitarra', number: 1 },
//         { name: 'Basso', number: 2 }
//       ]
//     },
//     {
//       id: 2,
//       title: 'Tech',
//       data: [
//         { name: 'Cavo XLR', number: 5 }
//       ]
//     }
//   ]);

//   const handleAccordionClick = (id: number) => {
//     setExpanded(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   return (
//     <div className="my-inventory-personal-page">
//       <h1 className='title'>My Inventory - Personal</h1>
//       <div className="accordion-list">
//         {categories.map(category => (
//           <div className="accordion-item" key={category.id}>
//             <button
//               className="accordion-title"
//               onClick={() => handleAccordionClick(category.id)}
//             >
//               {category.title}
//             </button>
//             {expanded[category.id] && (
//               <div className="accordion-content">
//                 {category.data.length === 0
//                   ? <span>Nessun materiale presente</span>
//                   : (
//                     <ul>
//                       {category.data.map((item, idx) => (
//                         <li key={idx}>
//                           {item.name} - {item.number}
//                         </li>
//                       ))}
//                     </ul>
//                   )
//                 }
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//       <button
//         className="add-category-floating-button"
//         onClick={() => {
//           setIsCategoryModalOpen(true);
//           setNewCategoryTitle('');
//         }}
//         aria-label="Aggiungi categoria"
//       >
//         +
//       </button>

//       {isCategoryModalOpen && (
//         <div className="modal">
//           <div className="modal-content">
//             <h2>Aggiungi Categoria</h2>
//             <form
//               onSubmit={e => {
//                 e.preventDefault();
//                 if (newCategoryTitle.trim() === '') return;
//                 setCategories([
//                   ...categories,
//                   {
//                     id: Date.now(),
//                     title: newCategoryTitle.trim(),
//                     data: []
//                   }
//                 ]);
//                 setIsCategoryModalOpen(false);
//                 setNewCategoryTitle('');
//               }}
//             >
//               <label>
//                 Nome categoria:
//                 <input
//                   type="text"
//                   value={newCategoryTitle}
//                   onChange={e => setNewCategoryTitle(e.target.value)}
//                   autoFocus
//                 />
//               </label>
//               <div className="modal-actions">
//                 <button type="submit" className="save-button">
//                   Aggiungi
//                 </button>
//                 <button
//                   type="button"
//                   className="cancel-button"
//                   onClick={() => setIsCategoryModalOpen(false)}
//                 >
//                   Annulla
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyInventoryPersonal;

import React, { useState } from 'react';
import './MyInventoryPersonal.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const MyInventoryPersonal: React.FC = () => {
    const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [editCategoryTitle, setEditCategoryTitle] = useState('');
    const [categoryToEdit, setCategoryToEdit] = useState<number | null>(null);
    const [categories, setCategories] = useState<
        { id: number; title: string; data: { name: string; number: number }[] }[]
    >([
        {
            id: 1,
            title: 'Strumenti Personali',
            data: [
                { name: 'Chitarra', number: 1 },
                { name: 'Basso', number: 2 }
            ]
        },
        {
            id: 2,
            title: 'Tech',
            data: [
                { name: 'Cavo XLR', number: 5 }
            ]
        }
    ]);
    const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

    const handleAccordionClick = (id: number) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="my-inventory-personal-page">
            <h1 className='title'>My Inventory - Personal</h1>
            <div className="accordion-list">
                {categories.map(category => (
                    <div className="accordion-item" key={category.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button
                                className="accordion-title"
                                onClick={() => handleAccordionClick(category.id)}
                                style={{ flex: 1, textAlign: 'left' }}
                            >
                                <span className="category-title">{category.title}</span>
                                <div className="category-actions">
                                    <button
                                        className="todo-edit-button"
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setCategoryToEdit(category.id);
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
                                            setCategoryToDelete(category.id);
                                            setIsDeleteCategoryModalOpen(true);
                                        }}
                                        title="Elimina categoria"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </button>
                        </div>
                        {expanded[category.id] && (
                            <div className="accordion-content">
                                {category.data.length === 0
                                    ? <span>Nessun materiale presente</span>
                                    : (
                                        <ul>
                                            {category.data.map((item, idx) => (
                                                <li key={idx}>
                                                    {item.name} - {item.number}
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                }
                            </div>
                        )}
                    </div>
                ))}
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
                            onSubmit={e => {
                                e.preventDefault();
                                if (newCategoryTitle.trim() === '') return;
                                setCategories([
                                    ...categories,
                                    {
                                        id: Date.now(),
                                        title: newCategoryTitle.trim(),
                                        data: []
                                    }
                                ]);
                                setIsCategoryModalOpen(false);
                                setNewCategoryTitle('');
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
                            onSubmit={e => {
                                e.preventDefault();
                                if (editCategoryTitle.trim() === '' || categoryToEdit === null) return;
                                setCategories(categories =>
                                    categories.map(cat =>
                                        cat.id === categoryToEdit
                                            ? { ...cat, title: editCategoryTitle.trim() }
                                            : cat
                                    )
                                );
                                setIsEditCategoryModalOpen(false);
                                setCategoryToEdit(null);
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
                                onClick={() => {
                                    setCategories(categories => categories.filter(cat => cat.id !== categoryToDelete));
                                    setIsDeleteCategoryModalOpen(false);
                                    setCategoryToDelete(null);
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
        </div>
    );
};

export default MyInventoryPersonal;