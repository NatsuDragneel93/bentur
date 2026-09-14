import { ChecklistItem, createCategoryListService } from './categoryList.service';

// To Do dei tour (pagina non ancora implementata): collection 'user_todos_tour', elementi nel campo 'todos'
const todoTourService = createCategoryListService<ChecklistItem>('user_todos_tour', 'todos');

export default todoTourService;
