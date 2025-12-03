import { config } from './config';

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

