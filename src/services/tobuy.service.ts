import { ChecklistItem, createCategoryListService } from './categoryList.service';

// Liste To Buy: collection 'user_to_buy', elementi nel campo 'tobuys'
const toBuyService = createCategoryListService<ChecklistItem>('user_to_buy', 'tobuys');

export default toBuyService;
