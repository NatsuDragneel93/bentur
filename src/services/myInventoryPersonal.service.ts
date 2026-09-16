import { InventoryItem, createUserCategoryListService } from './categoryList.service';

// Inventario personale: collection 'user_inventory_personal', elementi nel campo 'data' (servizio per utente: .forUser(uid))
const myInventoryPersonalService = createUserCategoryListService<InventoryItem>('user_inventory_personal', 'data');

export default myInventoryPersonalService;
