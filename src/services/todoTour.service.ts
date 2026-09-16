import { ChecklistItem, createUserCategoryListService } from './categoryList.service';

// To Do dei tour (pagina non ancora implementata): collection 'user_todos_tour', elementi nel campo 'todos'
const todoTourService = createUserCategoryListService<ChecklistItem>('user_todos_tour', 'todos');

export default todoTourService;
