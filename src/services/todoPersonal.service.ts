import { ChecklistItem, createUserCategoryListService } from './categoryList.service';

// To Do personali: collection 'user_todos_personal', elementi nel campo 'todos' (servizio per utente: .forUser(uid))
const todoPersonalService = createUserCategoryListService<ChecklistItem>('user_todos_personal', 'todos');

export default todoPersonalService;
