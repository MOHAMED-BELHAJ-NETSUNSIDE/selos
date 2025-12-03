export interface BCCustomer {
  id: string;
  number: string;
  displayName: string;
  type?: string;
  blocked?: boolean;
  phoneNumber?: string;
  email?: string;
  currencyCode?: string;
  taxRegistrationNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countryLetterCode?: string;
    postalCode?: string;
  };
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

