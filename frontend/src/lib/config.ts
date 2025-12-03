// Configuration pour Business Central
export const config = {
  // Azure AD / OAuth2
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || '',
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '', // Server-side only
  bcEnvironment: process.env.NEXT_PUBLIC_BC_ENVIRONMENT || '',

  // OAuth Scope
  oauthScope: process.env.NEXT_PUBLIC_OAUTH_SCOPE || 'https://api.businesscentral.dynamics.com/.default',
  tokenUrl: process.env.NEXT_PUBLIC_TOKEN_URL || '',

  // Business Central
  companyId: process.env.NEXT_PUBLIC_COMPANY_ID || '',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || '',

  // Request Configuration
  requestTimeout: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '30'),
  maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '5'),
  retryBaseDelay: parseFloat(process.env.NEXT_PUBLIC_RETRY_BASE_DELAY || '1.0'),
} as const;

