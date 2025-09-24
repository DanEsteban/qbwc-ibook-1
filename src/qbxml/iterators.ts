import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export interface IteratorInfo {
  done: boolean;
  nextIterator?: string;
  remaining?: number;
  rsTag?: string;
}
//lee la erspuesta xml del quickbooks y determina si haymas resultados disponibles
export function parseIterator(responseXml: string): IteratorInfo {
  const json = parser.parse(responseXml); //convierte el xml a json 
  const msgs = json?.QBXML?.QBXMLMsgsRs;
  if (!msgs || typeof msgs !== 'object') return { done: true };

  const keys = Object.keys(msgs);
  const rsKey = keys.find(k => k.endsWith('QueryRs')); //
  const rs = rsKey ? msgs[rsKey] : null;

  const node = Array.isArray(rs) ? rs[0] : rs;
  if (!node) return { done: true };

  const remaining = Number(node.iteratorRemainingCount ?? 0);
  const iterId = node.iteratorID as string | undefined;

  return {
    done: remaining <= 0,
    nextIterator: iterId,
    remaining,
    rsTag: rsKey,
  };
}

export function stripXmlDeclaration(xml: string) {
  return xml.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
}
