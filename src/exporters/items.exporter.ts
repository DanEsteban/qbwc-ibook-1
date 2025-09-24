import { itemInventoryQueryRq } from '../qbxml/builders';

export class ItemsExporter {
  buildRequest(iteratorId?: string) {
    return itemInventoryQueryRq(iteratorId, 10); // 10 productos por request
  }
}
