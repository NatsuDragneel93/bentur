import { ChecklistItem, createCategoryListService } from './categoryList.service';

// To Do personali: collection 'user_todos_personal', elementi nel campo 'todos'
const todoPersonalService = createCategoryListService<ChecklistItem>('user_todos_personal', 'todos');

export default todoPersonalService;
