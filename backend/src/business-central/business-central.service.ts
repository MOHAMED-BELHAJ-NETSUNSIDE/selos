import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BCPurchaseOrder {
  id: string;
  number: string;
  vendorNumber: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  currencyCode: string;
  status?: string;
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

export interface BCPurchaseOrderLine {
  id: string;
  itemId: string;
  quantity: number;
}

@Injectable()
export class BusinessCentralService {
  private readonly logger = new Logger(BusinessCentralService.name);
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly bcEnvironment: string;
  private readonly companyId?: string;
  private readonly companyName?: string;
  private readonly oauthScope: string;
  private readonly tokenUrl: string;
  private readonly requestTimeout: number = 30000;
  private readonly maxRetries: number = 5;
  private readonly retryBaseDelay: number = 1000;

  constructor(private configService: ConfigService) {
    this.tenantId = this.configService.get<string>('BC_TENANT_ID') || '';
    this.clientId = this.configService.get<string>('BC_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('BC_CLIENT_SECRET') || '';
    this.bcEnvironment = this.configService.get<string>('BC_ENVIRONMENT') || 'Production';
    this.companyId = this.configService.get<string>('BC_COMPANY_ID');
    this.companyName = this.configService.get<string>('BC_COMPANY_NAME');
    this.oauthScope = 'https://api.businesscentral.dynamics.com/.default';
    this.tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    // Log de debug pour vérifier le chargement des variables
    this.logger.debug(`BC Configuration loaded: tenantId=${this.tenantId ? '***' : 'MISSING'}, clientId=${this.clientId ? '***' : 'MISSING'}, clientSecret=${this.clientSecret ? '***' : 'MISSING'}, environment=${this.bcEnvironment}`);

    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      this.logger.warn('Business Central credentials not configured. BC integration will fail.');
      this.logger.warn(`Missing: ${!this.tenantId ? 'BC_TENANT_ID ' : ''}${!this.clientId ? 'BC_CLIENT_ID ' : ''}${!this.clientSecret ? 'BC_CLIENT_SECRET' : ''}`);
    }
  }

  /**
   * Obtient un token d'accès OAuth2
   */
  async getAccessToken(): Promise<string> {
    // Vérifier que les credentials sont configurés
    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      const missing: string[] = [];
      if (!this.tenantId) missing.push('BC_TENANT_ID');
      if (!this.clientId) missing.push('BC_CLIENT_ID');
      if (!this.clientSecret) missing.push('BC_CLIENT_SECRET');
      throw new BadRequestException(
        `Variables d'environnement Business Central manquantes: ${missing.join(', ')}. Vérifiez votre fichier .env.local ou .env`
      );
    }

    try {
      this.logger.debug(`Requesting access token from: ${this.tokenUrl}`);
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.oauthScope,
          grant_type: 'client_credentials',
        }),
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      const responseText = await response.text();
      let errorDetails = '';

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          errorDetails = errorData.error_description || errorData.error || responseText;
          this.logger.error(`Token request failed (${response.status}): ${errorDetails}`);
        } catch {
          errorDetails = responseText;
          this.logger.error(`Token request failed (${response.status}): ${errorDetails}`);
        }

        if (response.status === 401) {
          throw new BadRequestException(
            `Authentification échouée. Vérifiez votre BC_CLIENT_ID et BC_CLIENT_SECRET. Détails: ${errorDetails}`
          );
        } else if (response.status === 400) {
          throw new BadRequestException(
            `Requête invalide. Vérifiez votre BC_TENANT_ID. Détails: ${errorDetails}`
          );
        } else {
          throw new BadRequestException(
            `Erreur lors de l'obtention du token (${response.status}): ${errorDetails}`
          );
        }
      }

      const data = JSON.parse(responseText);
      if (!data.access_token) {
        this.logger.error('No access token in response', data);
        throw new BadRequestException('Aucun token d\'accès reçu de Business Central');
      }

      this.logger.debug('Access token obtained successfully');
      return data.access_token;
    } catch (error: any) {
      // Si c'est déjà une BadRequestException, la relancer
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error('Failed to get access token', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      throw new BadRequestException(
        `Impossible de se connecter à Business Central: ${error.message || 'Erreur inconnue'}. Vérifiez les credentials et la connexion réseau.`
      );
    }
  }

  /**
   * Résout l'ID de l'entreprise à partir de son nom
   */
  async resolveCompanyId(accessToken: string): Promise<string> {
    if (this.companyId) {
      return this.companyId;
    }

    // Tester l'accès à l'environnement configuré
    let workingEnvironment = this.bcEnvironment;
    if (!(await this.testEnvironmentAccess(accessToken, this.bcEnvironment))) {
      // Essayer les environnements alternatifs
      const alternativeEnvironments = ['Production', 'Sandbox', 'Development', 'Test'];
      
      for (const env of alternativeEnvironments) {
        if (env === this.bcEnvironment) continue;
        
        if (await this.testEnvironmentAccess(accessToken, env)) {
          workingEnvironment = env;
          break;
        }
      }
    }

    const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(workingEnvironment)}/api/v2.0/companies`;
    
    const response = await this.httpRequest(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!Array.isArray(data.value)) {
      throw new Error('Unexpected companies response format');
    }

    // Chercher l'entreprise par nom
    if (this.companyName) {
      const company = data.value.find((c: { name?: string }) => 
        c.name && c.name.toLowerCase() === this.companyName!.toLowerCase()
      );

      if (!company) {
        throw new Error(`Company not found: ${this.companyName} in environment: ${workingEnvironment}`);
      }

      return company.id;
    }

    // Si pas de nom spécifié, prendre la première entreprise
    if (data.value.length > 0) {
      return data.value[0].id;
    }

    throw new Error('No company found');
  }

  /**
   * Teste l'accès à un environnement Business Central
   */
  private async testEnvironmentAccess(
    accessToken: string,
    environmentName: string
  ): Promise<boolean> {
    const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(environmentName)}/api/v2.0/companies`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.requestTimeout),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Array.isArray(data.value);
    } catch (error) {
      this.logger.error('Environment access test failed', error);
      return false;
    }
  }

  /**
   * Fait une requête HTTP avec retry
   */
  private async httpRequest(
    url: string,
    options: RequestInit = {},
    retries: number = this.maxRetries
  ): Promise<Response> {
    let lastError: Error | null = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(this.requestTimeout),
        });

        // Succès
        if (response.ok) {
          return response;
        }

        // Sauvegarder la réponse pour l'analyse d'erreur
        lastResponse = response;

        // Erreur 429 ou 5xx - retry
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * this.retryBaseDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Pour les erreurs 400, 403, 404, on veut voir le détail de l'erreur
        // On crée une erreur avec la réponse attachée
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = response;
        (error as any).responseText = errorText;
        throw error;
      } catch (error) {
        lastError = error as Error;
        
        // Si c'est une erreur 400/403/404, on ne retry pas
        if (error instanceof Error && (error as any).response) {
          const status = (error as any).response.status;
          if (status === 400 || status === 403 || status === 404) {
            throw error;
          }
        }
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * this.retryBaseDelay;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Crée un bon de commande (sales order) sur Business Central
   * Note: On crée un salesOrder car le vendeur est lié à un client BC, pas un fournisseur
   */
  async createSalesOrderOnBC(orderData: {
    customerNumber: string;
    orderDate: string;
    requestedDeliveryDate?: string;
    currencyCode?: string;
  }): Promise<{ success: boolean; bcId?: string; bcNumber?: string; bcEtag?: string; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesOrders`;

      // Validation des données essentielles
      if (!orderData.customerNumber) {
        return { success: false, error: 'Le numéro client est obligatoire' };
      }

      const bcData: any = {
        customerNumber: orderData.customerNumber.trim(),
        orderDate: orderData.orderDate,
        currencyCode: orderData.currencyCode || 'TND',
      };

      // Ajouter la date de livraison seulement si elle est valide et non vide
      if (orderData.requestedDeliveryDate && orderData.requestedDeliveryDate.trim()) {
        const deliveryDate = orderData.requestedDeliveryDate.trim();
        // Vérifier que la date est valide
        if (new Date(deliveryDate).toString() !== 'Invalid Date') {
          bcData.requestedDeliveryDate = deliveryDate;
        }
      }

      this.logger.debug(`Creating sales order on BC: ${JSON.stringify(bcData)}`);
      this.logger.debug(`BC API URL: ${url}`);

      let response: Response;
      try {
        response = await this.httpRequest(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(bcData),
        });
      } catch (httpError: any) {
        // Si httpRequest lance une erreur, c'est qu'on a une réponse non-OK
        // On doit récupérer la réponse pour voir les détails
        this.logger.error(`HTTP Request failed: ${httpError.message}`);
        
        // Si l'erreur contient une réponse, on essaie de la parser
        if (httpError.responseText) {
          let errorDetails = httpError.responseText;
          try {
            const errorJson = JSON.parse(httpError.responseText);
            errorDetails = errorJson.error?.message || errorJson.error?.code || errorJson.error_description || JSON.stringify(errorJson);
            this.logger.error(`BC Error Response: ${JSON.stringify(errorJson, null, 2)}`);
          } catch {
            this.logger.error(`BC Error Response (text): ${httpError.responseText}`);
          }
          
          if (httpError.response?.status === 400) {
            return { 
              success: false, 
              error: `Erreur de validation Business Central (400): ${errorDetails}` 
            };
          }
          
          return {
            success: false,
            error: `Erreur Business Central (${httpError.response?.status || 'unknown'}): ${errorDetails}`,
          };
        }
        
        throw httpError;
      }

      const responseData = await response.json();
      this.logger.debug(`BC Response: ${JSON.stringify(responseData)}`);
      
      return {
        success: true,
        bcId: responseData.id || null,
        bcNumber: responseData.number || null,
        bcEtag: responseData['@odata.etag'] || null,
      };
    } catch (error: any) {
      this.logger.error('Failed to create sales order on BC', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Analyser l'erreur pour donner un message plus clair
      let errorMessage = 'Erreur lors de la création du bon de commande sur Business Central';
      
      if (error.message) {
        if (error.message.includes('HTTP 400')) {
          errorMessage = 'Erreur de validation Business Central. Vérifiez les données envoyées (customerNumber, orderDate, currencyCode).';
        } else if (error.message.includes('HTTP 403')) {
          errorMessage = 'Accès refusé. Vérifiez les permissions dans Business Central.';
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'Ressource non trouvée dans Business Central.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Ajoute une ligne de bon de commande (sales order line) sur Business Central
   * Le location est défini via un PATCH après la création de la ligne
   * Selon la documentation: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_salesorderline
   * La propriété est locationId (GUID), pas locationCode
   */
  async addSalesOrderLineToBC(
    orderIdBC: string,
    itemBCId: string,
    quantity: number,
    currencyCode: string = 'TND',
    locationBcId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesOrders(${encodeURIComponent(orderIdBC)})/salesOrderLines`;

      const bcData: any = {
        item: {
          id: itemBCId,
        },
        quantity: parseFloat(quantity.toString()),
      };

      this.logger.debug(`Adding purchase order line to BC: ${JSON.stringify(bcData)}`);

      const response = await this.httpRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bcData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Erreur HTTP ${response.status}`;
        
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        
        return { success: false, error: errorMessage };
      }

      const lineData = await response.json();
      
      // Si un locationBcId (GUID) est fourni, mettre à jour la ligne avec un PATCH
      // Selon la documentation Microsoft, salesOrderLine utilise locationId (GUID)
      if (locationBcId && lineData.id) {
        try {
          const patchUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesOrders(${encodeURIComponent(orderIdBC)})/salesOrderLines(${encodeURIComponent(lineData.id)})`;
          
          // Utiliser locationId (GUID) selon la documentation
          const patchData: any = {
            locationId: locationBcId,
          };
          
          this.logger.debug(`Updating location on sales order line: ${JSON.stringify(patchData)}`);
          
          const patchResponse = await this.httpRequest(patchUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'If-Match': lineData['@odata.etag'] || '*',
            },
            body: JSON.stringify(patchData),
          });
          
          if (patchResponse.ok) {
            this.logger.debug(`Location updated successfully on sales order line: ${locationBcId}`);
          } else {
            const patchError = await patchResponse.json().catch(() => ({}));
            this.logger.warn(`Failed to update location on sales order line: ${JSON.stringify(patchError)}`);
            // Ne pas échouer si la mise à jour du location échoue, la ligne a été créée
          }
        } catch (patchError: any) {
          this.logger.warn(`Error updating location on sales order line: ${patchError.message}`);
          // Ne pas échouer si la mise à jour du location échoue, la ligne a été créée
        }
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error('Failed to add purchase order line to BC', error);
      
      let errorMessage = 'Erreur lors de l\'ajout de la ligne sur Business Central';
      
      if (error.message) {
        if (error.message.includes('Blocked')) {
          errorMessage = 'Article bloqué dans Business Central. L\'article ne peut pas être ajouté à une commande.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Vérifie si un sales order a une expédition dans Business Central (salesShipment) et retourne le numéro d'expédition
   */
  async checkSalesOrderShipped(bcNumber: string): Promise<{ shipped: boolean; shipmentNumber?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // Chercher les expéditions liées à ce numéro de commande
      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesShipments?$filter=orderNumber eq '${encodeURIComponent(bcNumber)}'&$top=1`;

      this.logger.debug(`Checking if sales order ${bcNumber} is shipped: ${url}`);

      const response = await this.httpRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      const shipments = responseData.value || [];
      
      this.logger.debug(`Found ${shipments.length} shipment(s) for sales order ${bcNumber}`);

      if (shipments.length > 0) {
        const shipmentNumber = shipments[0].number || shipments[0].id || null;
        this.logger.debug(`Shipment number for sales order ${bcNumber}: ${shipmentNumber}`);
        return {
          shipped: true,
          shipmentNumber: shipmentNumber || undefined,
        };
      }

      return { shipped: false };
    } catch (error: any) {
      // Si l'erreur est 404 ou si aucune expédition n'est trouvée, retourner false
      if (error.message?.includes('HTTP 404')) {
        return { shipped: false };
      }
      
      this.logger.warn(`Failed to check if sales order is shipped: ${error.message}`);
      return { shipped: false }; // En cas d'erreur, on considère que ce n'est pas expédié
    }
  }

  /**
   * Récupère les lignes d'expédition (salesShipmentLines) pour un bon de commande expédié
   */
  async getSalesShipmentLines(bcNumber: string): Promise<{ success: boolean; lines?: Array<{ itemId: string; quantity: number; lineObjectNumber?: string | null }>; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // Chercher les expéditions liées à ce numéro de commande
      const shipmentsUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesShipments?$filter=orderNumber eq '${encodeURIComponent(bcNumber)}'&$top=1`;

      this.logger.debug(`Getting sales shipment lines for order ${bcNumber}: ${shipmentsUrl}`);

      const shipmentsResponse = await this.httpRequest(shipmentsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const shipmentsData = await shipmentsResponse.json();
      const shipments = shipmentsData.value || [];

      if (shipments.length === 0) {
        return { success: false, error: 'Aucune expédition trouvée pour ce bon de commande' };
      }

      const shipmentId = shipments[0].id;
      if (!shipmentId) {
        return { success: false, error: 'ID d\'expédition non trouvé' };
      }

      // Récupérer les lignes de l'expédition
      // Selon la documentation Microsoft: GET companies({id})/salesShipments({id})/salesShipmentLines
      // On récupère toutes les lignes pour voir la structure complète
      const linesUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesShipments(${encodeURIComponent(shipmentId)})/salesShipmentLines`;

      this.logger.debug(`Getting sales shipment lines from: ${linesUrl}`);

      const linesResponse = await this.httpRequest(linesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const linesData = await linesResponse.json();
      
      // Logger la structure complète pour debug
      if (linesData.value && linesData.value.length > 0) {
        this.logger.debug(`First shipment line structure: ${JSON.stringify(linesData.value[0])}`);
      }

      const lines = (linesData.value || []).map((line: any) => {
        // Essayer différentes façons de récupérer l'ID de l'article
        // Selon les logs, itemId est null mais lineObjectNumber contient le numéro d'article
        let itemId = null;
        
        if (line.itemId) {
          itemId = line.itemId;
        } else if (line.item && typeof line.item === 'object' && line.item.id) {
          itemId = line.item.id;
        } else if (line.item && typeof line.item === 'string') {
          itemId = line.item;
        }
        
        const quantity = parseFloat(line.quantity || 0);
        const lineObjectNumber = line.lineObjectNumber || null;
        
        this.logger.debug(`Shipment line: itemId=${itemId}, quantity=${quantity}, lineObjectNumber=${lineObjectNumber}, item=${JSON.stringify(line.item)}`);
        
        return {
          itemId: itemId || null, // Peut être null, on utilisera lineObjectNumber pour la correspondance
          quantity: quantity,
          lineObjectNumber: lineObjectNumber, // Utiliser ce champ pour la correspondance
        };
      }).filter((line: any) => line.quantity > 0); // Filtrer seulement les lignes avec quantité > 0

      this.logger.debug(`Found ${lines.length} shipment line(s) for order ${bcNumber}`);

      return {
        success: true,
        lines,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get sales shipment lines: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des lignes d\'expédition',
      };
    }
  }

  /**
   * Vérifie si un sales order a une facture associée dans Business Central et retourne le numéro de facture
   */
  async checkSalesOrderInvoiced(bcNumber: string): Promise<{ invoiced: boolean; invoiceNumber?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // Chercher les factures de vente liées à ce numéro de commande
      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesInvoices?$filter=orderNumber eq '${encodeURIComponent(bcNumber)}'&$top=1`;

      this.logger.debug(`Checking if sales order ${bcNumber} is invoiced: ${url}`);

      const response = await this.httpRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      const invoices = responseData.value || [];
      
      this.logger.debug(`Found ${invoices.length} invoice(s) for sales order ${bcNumber}`);

      if (invoices.length > 0) {
        const invoiceNumber = invoices[0].number || invoices[0].id || null;
        this.logger.debug(`Invoice number for sales order ${bcNumber}: ${invoiceNumber}`);
        return {
          invoiced: true,
          invoiceNumber: invoiceNumber || undefined,
        };
      }

      return { invoiced: false };
    } catch (error: any) {
      // Si l'erreur est 404 ou si aucune facture n'est trouvée, retourner false
      if (error.message?.includes('HTTP 404')) {
        return { invoiced: false };
      }
      
      this.logger.warn(`Failed to check if sales order is invoiced: ${error.message}`);
      return { invoiced: false }; // En cas d'erreur, on considère que ce n'est pas facturé
    }
  }

  /**
   * Récupère les détails d'une facture de vente (salesInvoice) depuis Business Central par son numéro
   * Retourne les montants HT, TTC et TVA
   */
  async getSalesInvoiceDetails(invoiceNumber: string): Promise<{ 
    success: boolean; 
    totalAmountExcludingTax?: number; 
    totalAmountIncludingTax?: number; 
    totalTaxAmount?: number; 
    error?: string 
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // Chercher la facture de vente par son numéro
      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesInvoices?$filter=number eq '${encodeURIComponent(invoiceNumber)}'&$top=1`;

      this.logger.debug(`Fetching sales invoice details from BC: ${url}`);

      const response = await this.httpRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      const invoices = responseData.value || [];

      if (invoices.length === 0) {
        this.logger.warn(`No sales invoice found with number: ${invoiceNumber}`);
        return {
          success: false,
          error: `Facture ${invoiceNumber} non trouvée dans Business Central`,
        };
      }

      const invoice = invoices[0];
      const totalAmountExcludingTax = invoice.totalAmountExcludingTax ? parseFloat(invoice.totalAmountExcludingTax) : undefined;
      const totalAmountIncludingTax = invoice.totalAmountIncludingTax ? parseFloat(invoice.totalAmountIncludingTax) : undefined;
      const totalTaxAmount = invoice.totalTaxAmount ? parseFloat(invoice.totalTaxAmount) : undefined;

      this.logger.debug(
        `Sales invoice ${invoiceNumber} details: HT=${totalAmountExcludingTax}, TTC=${totalAmountIncludingTax}, TVA=${totalTaxAmount}`,
      );

      return {
        success: true,
        totalAmountExcludingTax,
        totalAmountIncludingTax,
        totalTaxAmount,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get sales invoice details: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des détails de la facture',
      };
    }
  }

  /**
   * Récupère les lignes d'une facture de vente (salesInvoiceLines) depuis Business Central par le numéro de facture
   * Retourne les détails de chaque ligne (unité, prix, quantités, montants, taxes, etc.)
   */
  async getSalesInvoiceLines(invoiceNumber: string): Promise<{
    success: boolean;
    lines?: Array<{
      itemId?: string;
      itemNumber?: string;
      unitOfMeasureCode?: string;
      unitPrice?: number;
      quantity?: number;
      discountAmount?: number;
      discountPercent?: number;
      amountExcludingTax?: number;
      totalTaxAmount?: number;
      taxPercent?: number;
      amountIncludingTax?: number;
      netAmount?: number;
      netTaxAmount?: number;
      netAmountIncludingTax?: number;
      shipmentDate?: string;
    }>;
    error?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // D'abord, récupérer l'ID de la facture
      const invoiceUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesInvoices?$filter=number eq '${encodeURIComponent(invoiceNumber)}'&$top=1`;

      this.logger.debug(`Fetching sales invoice ID from BC: ${invoiceUrl}`);

      const invoiceResponse = await this.httpRequest(invoiceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const invoiceData = await invoiceResponse.json();
      const invoices = invoiceData.value || [];

      if (invoices.length === 0) {
        this.logger.warn(`No sales invoice found with number: ${invoiceNumber}`);
        return {
          success: false,
          error: `Facture ${invoiceNumber} non trouvée dans Business Central`,
        };
      }

      const invoiceId = invoices[0].id;
      if (!invoiceId) {
        return {
          success: false,
          error: 'ID de facture non trouvé',
        };
      }

      // Récupérer les lignes de la facture
      const linesUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesInvoices(${encodeURIComponent(invoiceId)})/salesInvoiceLines`;

      this.logger.debug(`Fetching sales invoice lines from BC: ${linesUrl}`);

      const linesResponse = await this.httpRequest(linesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const linesData = await linesResponse.json();
      const lines = (linesData.value || []).map((line: any) => {
        const parseDecimal = (value: any): number | undefined => {
          if (value === null || value === undefined) return undefined;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? undefined : parsed;
        };

        const parseDate = (value: any): string | undefined => {
          if (!value) return undefined;
          return value;
        };

        // Log pour déboguer la structure des lignes BC
        this.logger.debug(
          `Ligne BC brute: itemId=${line.itemId}, itemNumber=${line.itemNumber}, lineObjectNumber=${line.lineObjectNumber}, no=${line.no}`,
        );

        return {
          itemId: line.itemId || undefined,
          itemNumber: line.itemNumber || line.lineObjectNumber || line.no || undefined,
          unitOfMeasureCode: line.unitOfMeasureCode || undefined,
          unitPrice: parseDecimal(line.unitPrice),
          quantity: parseDecimal(line.quantity),
          discountAmount: parseDecimal(line.discountAmount),
          discountPercent: parseDecimal(line.discountPercent),
          amountExcludingTax: parseDecimal(line.amountExcludingTax),
          totalTaxAmount: parseDecimal(line.totalTaxAmount),
          taxPercent: parseDecimal(line.taxPercent),
          amountIncludingTax: parseDecimal(line.amountIncludingTax),
          netAmount: parseDecimal(line.netAmount),
          netTaxAmount: parseDecimal(line.netTaxAmount),
          netAmountIncludingTax: parseDecimal(line.netAmountIncludingTax),
          shipmentDate: parseDate(line.shipmentDate),
        };
      });

      this.logger.debug(`Found ${lines.length} line(s) for sales invoice ${invoiceNumber}`);

      return {
        success: true,
        lines,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get sales invoice lines: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des lignes de facture',
      };
    }
  }

  /**
   * Récupère le statut d'un sales order depuis Business Central
   * Note: Si le sales order n'existe plus (404), cela signifie généralement qu'il a été facturé
   */
  async getSalesOrderStatusFromBC(bcId: string, bcNumber?: string): Promise<{ success: boolean; status?: string; fullyShipped?: boolean; shipmentNumber?: string; invoiced?: boolean; invoiceNumber?: string; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesOrders(${encodeURIComponent(bcId)})`;

      this.logger.debug(`Fetching sales order status from BC: ${url}`);

      const response = await this.httpRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      this.logger.debug(`BC Sales Order Response: ${JSON.stringify(responseData)}`);

      const orderNumber = bcNumber || responseData.number;

      // Vérifier si la commande est expédiée (dans salesShipment)
      let fullyShipped = false;
      let shipmentNumber: string | undefined = undefined;
      if (orderNumber) {
        const shipmentCheck = await this.checkSalesOrderShipped(orderNumber);
        fullyShipped = shipmentCheck.shipped;
        shipmentNumber = shipmentCheck.shipmentNumber;
      }

      // Vérifier si la commande est facturée
      let invoiced = false;
      let invoiceNumber: string | undefined = undefined;
      if (orderNumber) {
        const invoiceCheck = await this.checkSalesOrderInvoiced(orderNumber);
        invoiced = invoiceCheck.invoiced;
        invoiceNumber = invoiceCheck.invoiceNumber;
      }

      return {
        success: true,
        status: responseData.status || null,
        fullyShipped,
        shipmentNumber,
        invoiced,
        invoiceNumber,
      };
    } catch (error: any) {
      // Si le sales order n'existe plus (404), cela signifie qu'il a probablement été facturé
      if (error.message?.includes('HTTP 404')) {
        this.logger.debug(`Sales order ${bcId} not found in BC, checking if it's invoiced`);
        
        // Si on a le numéro de commande, vérifier s'il existe une expédition et/ou une facture
        if (bcNumber) {
          const shipmentCheck = await this.checkSalesOrderShipped(bcNumber);
          const invoiceCheck = await this.checkSalesOrderInvoiced(bcNumber);
          
          if (invoiceCheck.invoiced) {
            // La commande a été facturée, elle n'existe plus dans salesOrders
            return {
              success: true,
              status: 'Invoiced', // Statut spécial pour indiquer qu'elle est facturée
              fullyShipped: shipmentCheck.shipped,
              shipmentNumber: shipmentCheck.shipmentNumber,
              invoiced: true,
              invoiceNumber: invoiceCheck.invoiceNumber,
            };
          }
        }
        
        // Si pas de facture trouvée, retourner une erreur
        return { 
          success: false, 
          error: 'Bon de commande non trouvé dans Business Central. Il a peut-être été supprimé ou facturé.' 
        };
      }

      this.logger.error('Failed to get sales order status from BC', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      let errorMessage = 'Erreur lors de la récupération du statut depuis Business Central';

      if (error.message) {
        if (error.message.includes('HTTP 403')) {
          errorMessage = 'Accès refusé. Vérifiez les permissions dans Business Central.';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Crée une facture de retour (Sales Credit Memo) sur Business Central
   */
  async createSalesCreditMemoOnBC(creditMemoData: {
    customerNumber: string;
    postingDate: string;
    currencyCode?: string;
    lines: Array<{
      itemBCId: string;
      itemNumber?: string;
      quantity: number;
      unitPrice?: number;
    }>;
  }): Promise<{ 
    success: boolean; 
    bcId?: string; 
    bcNumber?: string; 
    bcEtag?: string; 
    error?: string 
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesCreditMemos`;

      // Validation des données essentielles
      if (!creditMemoData.customerNumber) {
        return { success: false, error: 'Le numéro client est obligatoire' };
      }

      if (!creditMemoData.lines || creditMemoData.lines.length === 0) {
        return { success: false, error: 'Au moins une ligne est requise' };
      }

      const bcData: any = {
        customerNumber: creditMemoData.customerNumber.trim(),
        postingDate: creditMemoData.postingDate,
        currencyCode: creditMemoData.currencyCode || 'TND',
      };

      this.logger.debug(`Creating sales credit memo on BC: ${JSON.stringify(bcData)}`);
      this.logger.debug(`BC API URL: ${url}`);

      let response: Response;
      try {
        response = await this.httpRequest(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(bcData),
        });
      } catch (httpError: any) {
        this.logger.error(`HTTP Request failed: ${httpError.message}`);
        
        if (httpError.responseText) {
          let errorDetails = httpError.responseText;
          try {
            const errorJson = JSON.parse(httpError.responseText);
            errorDetails = errorJson.error?.message || errorJson.error?.code || errorJson.error_description || JSON.stringify(errorJson);
            this.logger.error(`BC Error Response: ${JSON.stringify(errorJson, null, 2)}`);
          } catch {
            this.logger.error(`BC Error Response (text): ${httpError.responseText}`);
          }
          
          if (httpError.response?.status === 400) {
            return { 
              success: false, 
              error: `Erreur de validation Business Central (400): ${errorDetails}` 
            };
          }
          
          return {
            success: false,
            error: `Erreur Business Central (${httpError.response?.status || 'unknown'}): ${errorDetails}`,
          };
        }
        
        throw httpError;
      }

      const responseData = await response.json();
      this.logger.debug(`BC Response: ${JSON.stringify(responseData)}`);
      
      const creditMemoId = responseData.id;
      const creditMemoNumber = responseData.number;
      const etag = responseData['@odata.etag'];

      // Ajouter les lignes
      for (const line of creditMemoData.lines) {
        const lineUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesCreditMemos(${encodeURIComponent(creditMemoId)})/salesCreditMemoLines`;
        
        const lineData: any = {
          quantity: parseFloat(line.quantity.toString()),
        };

        // Pour les credit memo lines, BC nécessite item: { id: ... } (comme pour sales order lines)
        // itemNumber n'est pas supporté directement sur salesCreditMemoLine
        if (!line.itemBCId) {
          this.logger.error(`Missing itemBCId for line: ${JSON.stringify(line)}`);
          continue;
        }
        
        lineData.item = {
          id: line.itemBCId,
        };

        if (line.unitPrice !== undefined && line.unitPrice !== null && line.unitPrice > 0) {
          lineData.unitPrice = parseFloat(line.unitPrice.toString());
        }

        try {
          this.logger.debug(`Adding credit memo line: ${JSON.stringify(lineData)}`);
          this.logger.debug(`Line URL: ${lineUrl}`);
          
          const lineResponse = await this.httpRequest(lineUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(lineData),
          });
          
          const lineResponseData = await lineResponse.json();
          this.logger.debug(`Credit memo line added successfully: ${JSON.stringify(lineResponseData)}`);
        } catch (lineError: any) {
          let errorDetails = lineError.message;
          
          if (lineError.responseText) {
            try {
              const errorJson = JSON.parse(lineError.responseText);
              errorDetails = errorJson.error?.message || errorJson.error?.code || errorJson.error_description || JSON.stringify(errorJson);
              this.logger.error(`BC Line Error Response: ${JSON.stringify(errorJson, null, 2)}`);
            } catch {
              errorDetails = lineError.responseText;
              this.logger.error(`BC Line Error Response (text): ${lineError.responseText}`);
            }
          }
          
          this.logger.error(`Failed to add credit memo line: HTTP ${lineError.response?.status || 'unknown'}: ${errorDetails}`);
          this.logger.error(`Line data that failed: ${JSON.stringify(lineData)}`);
          // Continuer avec les autres lignes même si une échoue
        }
      }
      
      // Récupérer le numéro final depuis BC (au cas où il n'était pas dans la réponse initiale)
      let finalCreditMemoNumber = creditMemoNumber;
      if (creditMemoId && !finalCreditMemoNumber) {
        try {
          const getUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/salesCreditMemos(${encodeURIComponent(creditMemoId)})`;
          const getResponse = await this.httpRequest(getUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          });
          const getResponseData = await getResponse.json();
          finalCreditMemoNumber = getResponseData.number || creditMemoNumber;
          this.logger.debug(`Retrieved final credit memo number: ${finalCreditMemoNumber}`);
        } catch (getError: any) {
          this.logger.warn(`Could not retrieve final credit memo number: ${getError.message}`);
          // On continue avec le numéro initial si disponible
        }
      }
      
      return {
        success: true,
        bcId: creditMemoId || null,
        bcNumber: finalCreditMemoNumber || null,
        bcEtag: etag || null,
      };
    } catch (error: any) {
      this.logger.error('Failed to create sales credit memo on BC', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      let errorMessage = 'Erreur lors de la création de la facture de retour sur Business Central';
      
      if (error.message) {
        if (error.message.includes('HTTP 400')) {
          errorMessage = 'Erreur de validation Business Central. Vérifiez les données envoyées.';
        } else if (error.message.includes('HTTP 403')) {
          errorMessage = 'Accès refusé. Vérifiez les permissions dans Business Central.';
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'Ressource non trouvée dans Business Central.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Récupère tous les magasins (locations) depuis Business Central
   */
  async getLocations(accessToken: string, companyId: string): Promise<any[]> {
    const url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/locations`;
    
    const locations: any[] = [];
    let nextLink: string | null = url;
    
    while (nextLink) {
      const response = await this.httpRequest(nextLink, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      if (Array.isArray(data.value)) {
        locations.push(...data.value);
      }
      
      nextLink = data['@odata.nextLink'] || null;
    }
    
    return locations;
  }

  /**
   * Récupère le stock d'un article par magasin depuis Business Central
   * Utilise itemLedgerEntries pour calculer le stock réel en additionnant les remainingQuantity
   */
  async getItemStockByLocation(
    itemNumber: string,
    locationCode: string
  ): Promise<number | null> {
    try {
      const accessToken = await this.getAccessToken();
      const companyId = await this.resolveCompanyId(accessToken);

      // Construire l'URL avec filtres pour itemNumber et locationCode
      // Essayer d'abord avec itemNumber et locationCode
      let url = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/itemLedgerEntries?$filter=itemNumber eq '${encodeURIComponent(itemNumber)}' and locationCode eq '${encodeURIComponent(locationCode)}'`;
      
      this.logger.debug(`Fetching stock for item ${itemNumber} at location ${locationCode}: ${url}`);

      let response: Response;
      let data: any;
      
      try {
        response = await this.httpRequest(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        // Vérifier le statut HTTP
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`HTTP ${response.status} ${response.statusText} for item ${itemNumber} at location ${locationCode}: ${errorText}`);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        data = await response.json();
      } catch (httpError: any) {
        // Si l'endpoint itemLedgerEntries n'existe pas ou retourne une erreur, essayer une alternative
        this.logger.warn(`itemLedgerEntries failed, trying alternative approach: ${httpError.message}`);
        
        // Essayer avec OData V4 si disponible (utiliser companyName si disponible)
        if (this.companyName) {
          const odataUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/ODataV4/Company('${encodeURIComponent(this.companyName)}')/itemLedgerEntries?$filter=Item_No eq '${encodeURIComponent(itemNumber)}' and Location_Code eq '${encodeURIComponent(locationCode)}'`;
          
          this.logger.debug(`Trying OData V4 endpoint: ${odataUrl}`);
          
          try {
            response = await this.httpRequest(odataUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
              },
            });

            // Vérifier le statut HTTP
            if (!response.ok) {
              const errorText = await response.text();
              this.logger.error(`OData V4 HTTP ${response.status} ${response.statusText}: ${errorText}`);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            data = await response.json();
          } catch (odataError: any) {
            this.logger.error(`OData V4 also failed: ${odataError.message}`, odataError.stack);
            throw httpError; // Relancer l'erreur originale
          }
        } else {
          throw httpError; // Si pas de companyName, relancer l'erreur originale
        }
      }

      // Log la structure complète de la réponse pour debug
      this.logger.debug(`BC API Response keys: ${JSON.stringify(Object.keys(data))}`);
      if (data.value && data.value.length > 0) {
        this.logger.debug(`First entry keys: ${JSON.stringify(Object.keys(data.value[0]))}`);
        this.logger.debug(`First entry sample: ${JSON.stringify(data.value[0])}`);
      }
      
      const entries = data.value || [];

      if (entries.length === 0) {
        this.logger.debug(`No ledger entries found for item ${itemNumber} at location ${locationCode}`);
        return 0; // Pas de stock si aucune entrée
      }

      // Dans Business Central, le stock disponible par location doit être calculé différemment
      // On ne peut pas simplement additionner toutes les remainingQuantity car cela inclut
      // toutes les transactions historiques (positives et négatives)
      // 
      // La bonne approche est d'utiliser l'endpoint items avec expansion sur itemWarehouseEntries
      // ou de filtrer les itemLedgerEntries pour ne prendre que celles qui sont encore "ouvertes"
      // 
      // Pour l'instant, essayons d'utiliser l'endpoint items directement avec un filtre par location
      // Si cela ne fonctionne pas, on calculera en utilisant uniquement les entrées positives
      
      // Essayer d'abord de récupérer depuis l'item directement
      try {
        const itemUrl = `https://api.businesscentral.dynamics.com/v2.0/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(this.bcEnvironment)}/api/v2.0/companies(${encodeURIComponent(companyId)})/items?$filter=number eq '${encodeURIComponent(itemNumber)}'&$expand=itemWarehouseEntries($filter=locationCode eq '${encodeURIComponent(locationCode)}')`;
        
        this.logger.debug(`Trying to get stock from items endpoint: ${itemUrl}`);
        
        const itemResponse = await this.httpRequest(itemUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          if (itemData.value && itemData.value.length > 0) {
            const item = itemData.value[0];
            // Vérifier si itemWarehouseEntries existe et contient des données
            if (item.itemWarehouseEntries && item.itemWarehouseEntries.length > 0) {
              const warehouseEntry = item.itemWarehouseEntries[0];
              const availableQty = parseFloat(
                warehouseEntry.availableQuantity ||
                warehouseEntry.Available_Quantity ||
                warehouseEntry.available_quantity ||
                warehouseEntry.quantity ||
                warehouseEntry.Quantity ||
                0
              ) || 0;
              
              this.logger.debug(`Stock from itemWarehouseEntries for item ${itemNumber} at location ${locationCode}: ${availableQty}`);
              return availableQty;
            }
          }
        }
      } catch (itemError: any) {
        this.logger.debug(`Could not get stock from items endpoint: ${itemError.message}, falling back to ledger entries calculation`);
      }

      // Fallback: Calculer le stock disponible en utilisant les itemLedgerEntries
      // Dans BC, le stock disponible = somme des remainingQuantity > 0 (entrées encore disponibles)
      // On ignore les remainingQuantity négatives ou nulles car elles représentent des sorties ou des entrées complètement consommées
      let totalStock = 0;
      let positiveEntriesCount = 0;
      
      entries.forEach((entry: any, index: number) => {
        // Utiliser remainingQuantity (quantité restante de chaque transaction)
        const remainingQty = parseFloat(
          entry.remainingQuantity || 
          entry.Remaining_Quantity || 
          entry.remaining_quantity ||
          entry.RemainingQuantity ||
          0
        ) || 0;
        
        // Seulement additionner les remainingQuantity positives (entrées encore disponibles)
        // Les valeurs négatives sont des sorties partielles qui ne doivent pas être comptées
        if (remainingQty > 0) {
          totalStock += remainingQty;
          positiveEntriesCount++;
        }
        
        // Log détaillé pour les 10 premières entrées
        if (index < 10) {
          const qty = parseFloat(
            entry.quantity ||
            entry.Quantity ||
            entry.Quantity_Base ||
            0
          ) || 0;
          
          this.logger.debug(`Entry ${index + 1}: itemNumber=${entry.itemNumber || entry.Item_No || entry.item_No || 'N/A'}, locationCode=${entry.locationCode || entry.Location_Code || entry.location_Code || 'N/A'}, quantity=${qty}, remainingQuantity=${remainingQty}, entryType=${entry.entryType || entry.Entry_Type || entry.entry_Type || 'N/A'}, included=${remainingQty > 0 ? 'YES' : 'NO'}`);
        }
      });

      this.logger.debug(`Stock calculated for item ${itemNumber} at location ${locationCode}: ${totalStock} (from ${positiveEntriesCount} positive entries out of ${entries.length} total entries)`);

      return totalStock;
    } catch (error: any) {
      this.logger.error(`Failed to get stock for item ${itemNumber} at location ${locationCode}: ${error.message}`, error.stack);
      // En cas d'erreur, retourner null plutôt que de faire échouer toute la requête
      return null;
    }
  }

  /**
   * Récupère le stock de plusieurs articles par magasin depuis Business Central
   * Retourne un Map avec la clé "itemNumber-locationCode" et la valeur du stock
   */
  async getMultipleItemsStockByLocation(
    items: Array<{ itemNumber: string; locationCode: string }>
  ): Promise<Map<string, number | null>> {
    const stockMap = new Map<string, number | null>();

    // Récupérer le stock pour chaque combinaison item-location
    // On peut faire des appels en parallèle pour améliorer les performances
    const promises = items.map(async ({ itemNumber, locationCode }) => {
      const key = `${itemNumber}-${locationCode}`;
      const stock = await this.getItemStockByLocation(itemNumber, locationCode);
      return { key, stock };
    });

    const results = await Promise.all(promises);
    results.forEach(({ key, stock }) => {
      stockMap.set(key, stock);
    });

    return stockMap;
  }
}

