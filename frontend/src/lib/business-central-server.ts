// Version serveur de business-central.ts pour les API routes
// Utilise les variables d'environnement côté serveur

const config = {
  tenantId: process.env.TENANT_ID || '',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  bcEnvironment: process.env.BC_ENVIRONMENT || '',
  oauthScope: process.env.OAUTH_SCOPE || 'https://api.businesscentral.dynamics.com/.default',
  tokenUrl: process.env.TOKEN_URL || '',
  companyId: process.env.COMPANY_ID || '',
  companyName: process.env.COMPANY_NAME || '',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '5'),
  retryBaseDelay: parseFloat(process.env.RETRY_BASE_DELAY || '1.0'),
} as const;

// Types pour Business Central
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

// Fonction pour obtenir un token d'accès OAuth2
export async function getAccessToken(): Promise<string> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
      scope: config.oauthScope,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('No access token received');
  }

  return data.access_token;
}

// Fonction pour tester l'accès à un environnement Business Central
export async function testEnvironmentAccess(
  accessToken: string,
  environmentName: string
): Promise<boolean> {
  const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(environmentName)}/api/v2.0/companies`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Array.isArray(data.value);
  } catch (error) {
    console.error('Environment access test failed:', error);
    return false;
  }
}

// Fonction pour résoudre l'ID de l'entreprise
export async function resolveCompanyId(accessToken: string): Promise<string> {
  if (config.companyId) {
    return config.companyId;
  }

  // Tester l'accès à l'environnement configuré
  let workingEnvironment = config.bcEnvironment;
  if (!(await testEnvironmentAccess(accessToken, config.bcEnvironment))) {
    // Essayer les environnements alternatifs
    const alternativeEnvironments = ['Production', 'Sandbox', 'Development', 'Test'];
    
    for (const env of alternativeEnvironments) {
      if (env === config.bcEnvironment) continue;
      
      if (await testEnvironmentAccess(accessToken, env)) {
        workingEnvironment = env;
        break;
      }
    }
  }

  const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.value)) {
    throw new Error('Unexpected companies response format');
  }

  // Chercher l'entreprise par nom
  const company = data.value.find((c: { name?: string }) => 
    c.name && c.name.toLowerCase() === config.companyName.toLowerCase()
  );

  if (!company) {
    throw new Error(`Company not found: ${config.companyName} in environment: ${workingEnvironment}`);
  }

  return company.id;
}

// Fonction pour faire des requêtes HTTP avec retry
export async function httpRequest(
  url: string,
  options: RequestInit = {},
  retries: number = config.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(config.requestTimeout * 1000),
      });

      // Succès
      if (response.ok) {
        return response;
      }

      // Erreur 429 ou 5xx - retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * config.retryBaseDelay * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Autres erreurs - pas de retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * config.retryBaseDelay * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

// Fonction pour récupérer tous les clients avec pagination
export async function* iterateCustomers(
  accessToken: string,
  companyId: string
): AsyncGenerator<BCCustomer, void, unknown> {
  const workingEnvironment = config.bcEnvironment;
  let url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/customers`;

  while (url) {
    const response = await httpRequest(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json;odata.metadata=minimal',
      },
    });

    const data = await response.json();
    if (!Array.isArray(data.value)) {
      throw new Error('Unexpected customers response format');
    }

    for (const customer of data.value) {
      yield customer;
    }

    url = data['@odata.nextLink'] || null;
  }
}

// Types pour Business Central Items
export interface BCItem {
  id: string;
  number: string;
  displayName: string;
  type?: string;
  itemCategoryCode?: string;
  itemCategoryId?: string;
  baseUnitOfMeasure?: string;
  unitPrice?: number;
  unitCost?: number;
  inventory?: number;
  blocked?: boolean | string;
  gtin?: string;
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

// Fonction pour récupérer tous les items avec pagination
export async function* iterateItems(
  accessToken: string,
  companyId: string
): AsyncGenerator<BCItem, void, unknown> {
  const workingEnvironment = config.bcEnvironment;
  // Récupérer tous les champs (sans $select pour éviter les erreurs)
  // baseUnitOfMeasure sera extrait depuis la réponse complète
  let url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/items`;

  while (url) {
    const response = await httpRequest(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json;odata.metadata=minimal',
      },
    });

    const data = await response.json();
    if (!Array.isArray(data.value)) {
      throw new Error('Unexpected items response format');
    }

    for (const item of data.value) {
      // S'assurer que baseUnitOfMeasure est présent dans l'objet retourné
      // même s'il vient d'un autre champ dans la réponse BC
      const normalizedItem: BCItem = {
        ...item,
        baseUnitOfMeasure: item.baseUnitOfMeasure || 
                          (item as any).unitOfMeasure || 
                          (item as any).unitOfMeasureCode ||
                          (item as any).baseUnitOfMeasureCode ||
                          undefined,
      };
      yield normalizedItem;
    }

    url = data['@odata.nextLink'] || null;
  }
}

// Types pour Business Central Locations
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

// Fonction pour récupérer tous les magasins (locations) avec pagination
export async function* iterateLocations(
  accessToken: string,
  companyId: string
): AsyncGenerator<BCLocation, void, unknown> {
  const workingEnvironment = config.bcEnvironment;
  let url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/locations`;

  while (url) {
    const response = await httpRequest(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json;odata.metadata=minimal',
      },
    });

    const data = await response.json();
    if (!Array.isArray(data.value)) {
      throw new Error('Unexpected locations response format');
    }

    for (const location of data.value) {
      yield location;
    }

    url = data['@odata.nextLink'] || null;
  }
}

// Fonction pour résoudre le nom de l'entreprise
export async function resolveCompanyName(accessToken: string): Promise<string> {
  if (config.companyName) {
    return config.companyName;
  }

  // Sinon, récupérer depuis l'API
  const workingEnvironment = config.bcEnvironment;
  const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve company name: ${response.status}`);
  }

  const data = await response.json();
  const companies = data.value || [];
  
  if (companies.length === 0) {
    throw new Error('No companies found');
  }

  // Retourner le nom de la première entreprise ou celle configurée
  return companies[0].name;
}

// Interface pour les prix BC (format itemSalesPrices OData V4)
export interface BCItemPrice {
  Item_No?: string;
  Unit_Price?: number;
  Minimum_Quantity?: number; // Format OData standard
  quantity?: number; // Format alternatif (si Business Central retourne quantity au lieu de Minimum_Quantity)
  Sales_Type?: string;
  Sales_Code?: string;
  Starting_Date?: string;
  Ending_Date?: string;
  Unit_of_Measure_Code?: string;
  Currency_Code?: string;
  Variant_Code?: string;
  Price_Includes_VAT?: boolean;
  Allow_Line_Disc?: boolean;
  Allow_Invoice_Disc?: boolean;
  VAT_Bus_Posting_Gr_Price?: string;
  id?: string;
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

/**
 * Récupère tous les prix de vente depuis l'endpoint itemSalesPrices (OData V4)
 * Basé sur la fonction getItemPriceHistory du projet sales_v3
 */
export async function* iterateItemPrices(
  accessToken: string,
  companyId: string,
  companyName: string
): AsyncGenerator<BCItemPrice, void, unknown> {
  const workingEnvironment = config.bcEnvironment;
  // Utiliser l'endpoint OData V4 itemSalesPrices (sans filtre pour récupérer tous les prix)
  // Ne pas filtrer par Sales_Type pour récupérer tous les types : Customer, Customer Price Group, All Customers, Campaign, etc.
  // Ne pas utiliser $select car certains champs peuvent causer une erreur 400
  let url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/ODataV4/Company('${encodeURIComponent(companyName)}')/itemSalesPrices`;
  
  console.log(`[iterateItemPrices] Fetching all prices from: ${url}`);

  while (url) {
    try {
      const response = await httpRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Error fetching itemSalesPrices: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        throw new Error(`Failed to fetch prices: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const salesPrices = data.value || [];
      
      // Log détaillé pour vérifier les types de vente récupérés (comme dans l'exemple)
      console.log(`[iterateItemPrices] Données reçues de itemSalesPrices:`, {
        count: salesPrices.length,
        firstItem: salesPrices[0],
        allData: data
      });
      
      // Log détaillé de tous les prix pour debug (comme dans l'exemple)
      console.log(`[iterateItemPrices] === TOUS LES PRIX DE VENTE ===`);
      salesPrices.forEach((price: any, index: number) => {
        console.log(`[iterateItemPrices] Prix ${index + 1}:`, {
          Unit_Price: price.Unit_Price,
          Minimum_Quantity: price.Minimum_Quantity,
          quantity: (price as any).quantity,
          Sales_Type: price.Sales_Type,
          Sales_Code: price.Sales_Code,
          Starting_Date: price.Starting_Date,
          Ending_Date: price.Ending_Date,
          Currency_Code: price.Currency_Code
        });
      });
      
      // Analyser les types de vente récupérés
      if (salesPrices.length > 0) {
        const salesTypes = new Set(salesPrices.map((p: any) => p.Sales_Type || 'null'));
        const salesTypesCount = new Map<string, number>();
        salesPrices.forEach((p: any) => {
          const type = p.Sales_Type || 'null';
          salesTypesCount.set(type, (salesTypesCount.get(type) || 0) + 1);
        });
        console.log(`[iterateItemPrices] Found ${salesPrices.length} prices with Sales_Types:`, Array.from(salesTypes));
        console.log(`[iterateItemPrices] Count by Sales_Type:`, Array.from(salesTypesCount.entries()));
        
        // Vérifier si on a tous les types attendus
        const expectedTypes = ['Customer', 'Customer Price Group', 'All Customers', 'Campaign'];
        const missingTypes = expectedTypes.filter(type => !salesTypes.has(type));
        if (missingTypes.length > 0 && salesTypes.size > 0) {
          console.log(`[iterateItemPrices] ⚠ Missing Sales_Types: ${missingTypes.join(', ')}`);
          console.log(`[iterateItemPrices] ⚠ Only found: ${Array.from(salesTypes).join(', ')}`);
        }
      } else {
        console.log(`[iterateItemPrices] No prices found in this batch`);
      }

      for (const price of salesPrices) {
        yield price as BCItemPrice;
      }

      // Gérer la pagination OData
      url = data['@odata.nextLink'] || null;
      
      if (url) {
        // Si l'URL est relative, la convertir en absolue
        if (url.startsWith('/')) {
          url = `https://api.businesscentral.dynamics.com${url}`;
        }
      }
    } catch (error) {
      console.error('Error in iterateItemPrices:', error);
      throw error;
    }
  }
}

/**
 * Récupère les prix pour un item spécifique (basé sur getItemPriceHistory)
 * Utilise itemSalesPrices sans filtre sur Sales_Type pour récupérer tous les types
 */
export async function getItemPrices(
  accessToken: string,
  companyName: string,
  itemNumber: string
): Promise<BCItemPrice[]> {
  try {
    const workingEnvironment = config.bcEnvironment;
    // Ne pas filtrer par Sales_Type pour récupérer tous les types : Customer, Customer Price Group, All Customers, Campaign, etc.
    // Ne pas utiliser $select car certains champs peuvent causer une erreur 400
    const odataUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(workingEnvironment)}/ODataV4/Company('${encodeURIComponent(companyName)}')/itemSalesPrices?$filter=Item_No eq '${encodeURIComponent(itemNumber)}'`;
    
    const response = await fetch(odataUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching prices for item ${itemNumber}:`, {
        status: response.status,
        statusText: response.statusText,
        url: odataUrl,
      });
      return [];
    }

    const data = await response.json();
    const salesPrices = data.value || [];
    
    // Log détaillé pour vérifier les types de vente récupérés (comme dans l'exemple salesv3)
    console.log(`[getItemPrices] Données reçues de itemSalesPrices pour ${itemNumber}:`, {
      count: salesPrices.length,
      firstItem: salesPrices[0],
      allData: data
    });
    
    // Log détaillé de tous les prix pour debug (comme dans l'exemple)
    console.log(`[getItemPrices] === TOUS LES PRIX DE VENTE pour ${itemNumber} ===`);
    salesPrices.forEach((price: any, index: number) => {
      console.log(`[getItemPrices] Prix ${index + 1}:`, {
        Unit_Price: price.Unit_Price,
        Minimum_Quantity: price.Minimum_Quantity,
        Sales_Type: price.Sales_Type,
        Sales_Code: price.Sales_Code,
        Starting_Date: price.Starting_Date,
        Ending_Date: price.Ending_Date,
        Currency_Code: price.Currency_Code
      });
    });
    
    // Debug spécifique pour Currency_Code (comme dans l'exemple)
    console.log(`[getItemPrices] === DEBUG CURRENCY_CODE pour ${itemNumber} ===`);
    salesPrices.forEach((price: any, index: number) => {
      console.log(`[getItemPrices] Prix ${index + 1}:`, {
        Currency_Code: `"${price.Currency_Code}"`,
        isEmpty: price.Currency_Code === '',
        isNull: price.Currency_Code === null,
        isUndefined: price.Currency_Code === undefined,
        Unit_Price: price.Unit_Price,
        Sales_Type: price.Sales_Type
      });
    });
    
    const prices = salesPrices as BCItemPrice[];
    
    // Log pour vérifier les types de vente récupérés pour cet item
    if (prices.length > 0) {
      const salesTypes = new Set(prices.map((p: any) => p.Sales_Type || 'null'));
      console.log(`[getItemPrices] Item ${itemNumber}: Found ${prices.length} prices with Sales_Types:`, Array.from(salesTypes));
    }
    
    return prices;
  } catch (error) {
    console.error('Error in getItemPrices:', error);
    return [];
  }
}

