import { InventoryItem, createCategoryListService } from './categoryList.service';

// Inventario personale: collection 'user_inventory_personal', elementi nel campo 'data'
const myInventoryPersonalService = createCategoryListService<InventoryItem>('user_inventory_personal', 'data');

export default myInventoryPersonalService;
