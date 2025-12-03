export interface BCLocation {
  id: string;
  code?: string;
  displayName?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  contact?: string;
  useAsInTransit?: boolean;
  requireShipment?: boolean;
  requireReceive?: boolean;
  requirePutAway?: boolean;
  requirePick?: boolean;
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

