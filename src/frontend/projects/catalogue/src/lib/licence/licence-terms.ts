import { Licence } from '@hummi/api';

/** How one licence lets a listener reuse a track, as the licence page explains it (L2-012). */
export interface LicenceTerm {
  /** The licence's own page, linked from the alert; only for licences whose text lives elsewhere. */
  url?: string;
  /** The licence's name in the table, for example "CC BY 4.0". */
  name: string;
  /** The short name in the alert heading "{title} is {short}". */
  short: string;
  may: string;
  must: string;
  /** What the alert says before the credit line; {artist} is replaced with the artist's name. */
  terms: string;
}

/** The URL of the Pixabay Content License summary (ADR 0021). */
export const PIXABAY_LICENSE_URL = 'https://pixabay.com/service/license-summary/';

/** The licences Hummi accepts. Static product content; the table lists only those in TABLE_LICENCES. */
export const LICENCE_TERMS: Record<Licence, LicenceTerm> = {
  cc0: {
    name: 'CC0 1.0',
    short: 'CC0',
    may: 'Use, remix and share for any purpose',
    must: 'Nothing',
    terms: '{artist} released it into the public domain. Credit is appreciated but not required:',
  },
  ccBy4: {
    name: 'CC BY 4.0',
    short: 'CC BY 4.0',
    may: 'Use, remix and share, including commercially',
    must: 'Credit the artist and model',
    terms: '{artist} licensed it under CC BY 4.0. Credit is required:',
  },
  ccBySa4: {
    name: 'CC BY-SA 4.0',
    short: 'CC BY-SA 4.0',
    may: 'Use, remix and share, including commercially',
    must: 'Credit, and share changes under the same licence',
    terms:
      '{artist} licensed it under CC BY-SA 4.0. Credit is required, and changes are shared under the same licence:',
  },
  pixabay: {
    url: PIXABAY_LICENSE_URL,
    name: 'Pixabay Content License',
    short: 'under the Pixabay Content License',
    may: 'Use, change and share for free, including commercially',
    must: 'Nothing; credit is appreciated. Don’t sell or redistribute it unaltered on its own, or claim it as your own',
    terms:
      '{artist} shared it on Pixabay under the Pixabay Content License. You may use it for free, including commercially, and change it. Credit is not required but is appreciated:',
  },
};

/** The licences of the catalogue, as the "Licences on Hummi" table lists them: every track is from Pixabay. */
export const TABLE_LICENCES: Licence[] = ['pixabay'];
