import { ChecklistItem, createUserCategoryListService } from './categoryList.service';

// Liste To Buy: collection 'user_to_buy', elementi nel campo 'tobuys' (servizio per utente: .forUser(uid))
const toBuyService = createUserCategoryListService<ChecklistItem>('user_to_buy', 'tobuys');

export default toBuyService;
