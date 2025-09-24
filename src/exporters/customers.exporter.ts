import { customerQueryRq } from '../qbxml/builders';

export class CustomersExporter {
  buildRequest(iteratorId?: string) {
    return customerQueryRq(iteratorId, 10); // 10 clientes por request
  }
}
