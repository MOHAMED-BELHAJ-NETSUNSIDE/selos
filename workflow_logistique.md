Fonctionnalités et workflow
Vue d'ensemble
Module de gestion de stock intégré à Business Central. Les opérations se font dans Selos (backend principal). Lors de la validation d'un bon de commande, une facture d'achat validée est créée dans Selos Retails pour le vendeur (Salesperson). L'envoi vers Business Central est obligatoire lors de la validation.
________________________________________
Fonctionnalités principales
1. Gestion des vendeurs (Salesperson) — Selos
•	CRUD des vendeurs
•	Informations personnelles : prénom, nom, email, téléphone, adresse, TVA, date d'embauche, statut
•	Login et mot de passe pour Selos Retails (authentification indépendante)
•	Code vendeur auto-généré (format VEN-XXXXXX)
•	Lien obligatoire avec un client Business Central (BCCustomer)
•	Informations du dépôt intégrées directement dans la table Salesperson (pas de table séparée)
•	Nom du dépôt auto-généré à partir du nom du vendeur
2. Dépôt intégré au vendeur — Selos
•	Un vendeur = un seul dépôt (informations intégrées dans Salesperson)
•	Informations du dépôt : nom, adresse, téléphone, statut, remarque
•	Création automatique des informations du dépôt lors de la création du vendeur
•	Le nom du dépôt est généré automatiquement à partir du nom du vendeur
•	Contrôle d'accès : le vendeur voit uniquement son dépôt
3. Types de chargement (ChargementType) — Selos
•	Modèles de chargement prédéfinis par vendeur (le dépôt est identifié via le vendeur)
•	Liste d'items Business Central (table bc_items) avec quantités
•	Les produits utilisés proviennent exclusivement de la table bc_items (synchronisés depuis Business Central)
•	Un vendeur = un chargement type maximum (car un vendeur = un dépôt)
•	Création automatique d'un bon de commande lors de la création
4. Bons de commande (PurchaseOrder) — Selos
•	Création automatique lors de la création d'un chargement type
•	Statuts : "non_valide", "valide", "envoye_bc", "annule"
•	Lignes avec items Business Central (bc_items) et quantités
•	Les items utilisés proviennent de la table bc_items
•	Validation qui :
•	Envoie obligatoirement vers Business Central
•	Alimente le stock local
•	Crée une facture d'achat validée dans Selos Retails pour le vendeur
5. Factures d'achat (PurchaseInvoice) — Selos Retails
•	Création automatique lors de la validation d'un bon de commande
•	Statut : "valide" (créée directement validée)
•	Liée au vendeur (Salesperson) propriétaire du dépôt
•	Lignes avec items Business Central (bc_items) et quantités du bon de commande
•	Consultation dans l'interface Selos Retails
6. Consultation du stock (StockTotal) — Selos
•	Stock actuel par item Business Central (bc_items) et dépôt
•	Filtrage par item (bc_items), dépôt, vendeur
•	Les items proviennent de la table bc_items synchronisée depuis Business Central
•	Calculs en temps réel
•	Le vendeur voit uniquement le stock de son dépôt
7. Intégration Business Central — Selos
•	Service d'authentification OAuth2
•	Création obligatoire de Purchase Orders sur BC lors de la validation
•	Récupération de l'ID BC et du numéro
•	Gestion des erreurs : si BC échoue, la validation échoue aussi
________________________________________
Workflow complet corrigé
Workflow 1 : Création d'un vendeur (Salesperson) — Selos
1.	L'administrateur crée un vendeur dans Selos
•	Sélectionne obligatoirement un client Business Central (BCCustomer) existant
•	Fournit le login et le mot de passe pour Selos Retails (authentification indépendante)
•	Optionnellement fournit : prénom, nom, email, téléphone, adresse, date d'embauche, statut
•	Optionnellement fournit les informations du dépôt : adresse, téléphone, statut, remarque
2.	Le système récupère automatiquement les informations du client Business Central
•	Extrait le prénom et nom depuis le displayName du client BC
•	Récupère le téléphone depuis phoneNumber
•	Récupère l'email depuis email
•	Récupère le numéro TVA depuis taxRegistrationNumber
•	Récupère le code BC (number) pour la traçabilité
•	Si des informations sont fournies dans le formulaire, elles prennent priorité sur celles de BC
3.	Le système génère automatiquement
•	Un code vendeur unique (format VEN-XXXXXX)
•	Le nom du dépôt à partir du prénom et nom du vendeur (ex: "John Doe")
•	Hash le mot de passe pour Selos Retails
4.	Le système crée le vendeur avec les informations du dépôt intégrées
•	Les informations du dépôt sont stockées directement dans la table Salesperson
•	Nom du dépôt : généré automatiquement (prénom + nom)
•	Adresse du dépôt : optionnelle, peut être fournie lors de la création
•	Téléphone du dépôt : optionnel
•	Statut du dépôt : actif par défaut (1)
•	Remarque du dépôt : optionnelle
5.	Résultat
•	Vendeur créé avec toutes ses informations
•	Lien établi avec le client Business Central (relation 1-1)
•	Informations du dépôt intégrées dans la table Salesperson
•	Code vendeur auto-généré
•	Login et mot de passe configurés pour Selos Retails
•	Le vendeur peut maintenant se connecter à Selos Retails et gérer son dépôt
________________________________________
Workflow 2 : Création d'un chargement type — Selos
1.	L'utilisateur crée un chargement type dans Selos
•	Sélectionne un vendeur (qui possède automatiquement un dépôt intégré)
•	Le système utilise automatiquement les informations du dépôt du vendeur
•	Sélectionne des items depuis la table bc_items (items Business Central synchronisés)
•	Ajoute les items sélectionnés avec leurs quantités
•	Donne un nom (optionnel)
2.	Le système crée automatiquement un bon de commande dans Selos
•	Génère un numéro unique (ex: BC-2024-000001)
•	Statut initial : "non_valide"
•	Crée les lignes du bon de commande à partir des items (bc_items) du chargement type
•	Les items utilisés proviennent exclusivement de la table bc_items
•	Lie le chargement type au bon de commande (relation 1-1)
•	Lie le bon de commande au vendeur (Salesperson)
3.	Résultat
•	Chargement type créé et sauvegardé dans Selos
•	Bon de commande créé avec statut "non_valide" dans Selos
•	Lignes du bon de commande créées
•	Bon de commande lié au vendeur
•	Aucun stock alimenté à ce stade
•	Aucune facture créée à ce stade
________________________________________
Workflow 3 : Validation d'un bon de commande — Selos
1.	L'utilisateur valide le bon de commande dans Selos
•	Fournit le numéro fournisseur (vendorNumber) — obligatoire
•	Optionnel : date de réception, devise
2.	Le système envoie obligatoirement vers Business Central
•	Authentification OAuth2
•	Création du Purchase Order sur BC (obligatoire)
•	Ajout des lignes avec les items de la table bc_items (liés à BC uniquement)
•	Les items doivent être synchronisés dans bc_items pour être utilisés
•	Récupération de l'ID BC et du numéro BC
•	Si erreur BC : la validation échoue complètement (pas de stock alimenté, pas de facture)
3.	Si BC réussit, le système met à jour le bon de commande local dans Selos
•	Statut → "envoye_bc"
•	Enregistre l'ID BC, le numéro BC, l'ETag
•	Enregistre la date d'envoi
4.	Le système alimente le stock local dans Selos
•	Pour chaque ligne du bon de commande :
•	Met à jour ou crée StockTotal (incrémente le stock)
•	Crée une StockTransaction (type "entree")
•	Met à jour ou crée StockSolde
•	Met à jour la quantité reçue dans la ligne
5.	Le système crée une facture d'achat validée dans Selos Retails
•	Identifie le vendeur (Salesperson) lié au bon de commande
•	Génère un numéro unique de facture (ex: FA-2024-000001)
•	Crée la facture avec statut "valide" directement
•	Crée les lignes de facture à partir des lignes du bon de commande
•	Lie la facture au vendeur (Salesperson)
•	Lie la facture au bon de commande (traçabilité)
6.	Résultat
•	Bon de commande validé dans Selos
•	Synchronisé avec BC (obligatoire)
•	Stock local alimenté dans Selos
•	Facture d'achat validée créée dans Selos Retails pour le vendeur
•	Le vendeur peut consulter sa facture dans Selos Retails
________________________________________
Workflow 4 : Consultation du stock — Selos
1.	L'utilisateur consulte le stock dans Selos
•	Si vendeur : voit automatiquement le stock de son dépôt (informations intégrées dans Salesperson)
•	Si administrateur : peut filtrer par item (bc_items), vendeur (le dépôt est identifié via le vendeur)
2.	Le système affiche
•	Stock actuel par item Business Central (bc_items) et vendeur/dépôt
•	Détails : item (bc_items), vendeur, dépôt (nom du dépôt depuis Salesperson), quantité, statut
•	Les items affichés proviennent de la table bc_items
•	Calculs en temps réel depuis StockTotal
________________________________________
Workflow 5 : Consultation des factures d'achat — Selos Retails
1.	Le vendeur se connecte à Selos Retails
•	Authentification avec son login et mot de passe (stockés dans Salesperson)
•	Le vendeur n'a pas besoin d'être un User dans Selos principal
•	Authentification indépendante via la table Salesperson
2.	Le vendeur consulte ses factures d'achat
•	Liste de toutes ses factures d'achat validées
•	Filtres : date, bon de commande, montant
•	Détails : items Business Central (bc_items), quantités, prix
3.	Le système affiche
•	Factures d'achat liées au vendeur (via la relation Salesperson)
•	Informations du bon de commande associé
•	Lignes de facture avec items (bc_items) et quantités
________________________________________
Relations entre les fonctionnalités (corrigées)
 
BCCustomer (Business Central)
    ↓ (lien obligatoire 1-1)
Salesperson (vendeur avec dépôt intégré)
    ├─ Informations personnelles (firstName, lastName, email, telephone, etc.)
    ├─ Login et password (pour Selos Retails)
    ├─ Informations du dépôt intégrées (depotName, depotAdresse, depotTel, etc.)
    └─ Code vendeur auto-généré
    ↓
ChargementType
    ↓
PurchaseOrder (Selos)
    ↓
PurchaseOrderLine
    ↓
BCItem (Business Central)
    ↓
StockTotal (stock actuel)
    ↓
StockTransaction (historique)
    ↓
StockSolde (soldes)
    ↓
PurchaseInvoice (Selos Retails) ← Salesperson
    ↓
PurchaseInvoiceLine
    ↓
Business Central (obligatoire lors de validation)
________________________________________
États et transitions
États d'un bon de commande
1.	"non_valide" (création)
•	Créé automatiquement avec le chargement type
•	Peut être modifié ou supprimé
•	Stock non alimenté
•	Facture non créée
2.	"envoye_bc" (validation réussie)
•	Validé et envoyé vers BC (obligatoire)
•	ID BC récupéré
•	Stock alimenté dans Selos
•	Facture d'achat validée créée dans Selos Retails
•	Synchronisé avec BC
3.	"annule" (annulation)
•	Bon de commande annulé
•	Stock non modifié (si déjà validé, nécessite une opération inverse)
•	Facture non créée ou annulée
Note : Si l'envoi vers BC échoue, le bon de commande reste en statut "non_valide" et aucune action n'est effectuée (pas de stock alimenté, pas de facture créée).
________________________________________
Points importants
1.	Tout se passe dans Selos : création du chargement type et validation du bon de commande
2.	Création automatique : un chargement type crée automatiquement un bon de commande
3.	Validation déclenche : envoi obligatoire vers BC + alimentation du stock + création de la facture d'achat
4.	Business Central obligatoire : si BC échoue, la validation échoue complètement
5.	Facture d'achat : créée automatiquement dans Selos Retails lors de la validation, avec statut "valide"
6.	Lien vendeur : la facture est liée au vendeur (Salesperson)
7.	Un vendeur = un dépôt intégré : les informations du dépôt sont stockées directement dans la table Salesperson (pas de table séparée)
8.	Lien obligatoire avec BCCustomer : lors de la création d'un vendeur, un client Business Central doit être sélectionné
9.	Récupération automatique des informations : le système récupère automatiquement les informations du client BC (nom, prénom, téléphone, email, TVA)
10.	Code vendeur auto-généré : format VEN-XXXXXX
11.	Nom du dépôt auto-généré : à partir du prénom et nom du vendeur
12.	Authentification Selos Retails : le vendeur utilise son login et mot de passe (stockés dans Salesperson) pour se connecter à Selos Retails, pas besoin d'être un User dans Selos principal
13.	Items Business Central obligatoires : tous les produits/items utilisés dans les chargements type, bons de commande et factures proviennent exclusivement de la table bc_items (items synchronisés depuis Business Central)
14.	Synchronisation bc_items : les items doivent être synchronisés depuis Business Central dans la table bc_items avant de pouvoir être utilisés dans les chargements type
15.	Traçabilité : toutes les opérations sont enregistrées
16.	Contrôle d'accès : les vendeurs voient uniquement leur dépôt et leurs factures
________________________________________
Cas d'usage typiques
Scénario 1 : Création d'un nouveau vendeur
1.	L'administrateur sélectionne un client Business Central existant dans Selos
2.	L'administrateur fournit le login et le mot de passe pour Selos Retails
3.	Optionnellement, l'administrateur peut modifier ou compléter les informations (prénom, nom, email, téléphone, etc.)
4.	Optionnellement, l'administrateur peut fournir les informations du dépôt (adresse, téléphone, remarque)
5.	Le système récupère automatiquement les informations du client BC
6.	Le système génère automatiquement le code vendeur (VEN-XXXXXX)
7.	Le système génère automatiquement le nom du dépôt (prénom + nom)
8.	Le système crée le vendeur avec les informations du dépôt intégrées
9.	Le vendeur peut maintenant se connecter à Selos Retails avec son login et gérer son dépôt
Scénario 2 : Nouveau chargement type et validation
1.	Créer un chargement type dans Selos pour un vendeur (le dépôt est identifié via le vendeur)
2.	Sélectionner des items depuis la table bc_items (items Business Central synchronisés)
3.	Ajouter les items sélectionnés avec leurs quantités
4.	Le bon de commande est créé automatiquement dans Selos et lié au vendeur
5.	Valider le bon de commande dans Selos
6.	Le système envoie obligatoirement vers Business Central
7.	Si BC réussit : le stock est alimenté dans Selos
8.	Si BC réussit : une facture d'achat validée est créée dans Selos Retails pour le vendeur
9.	Le vendeur peut se connecter à Selos Retails avec son login et consulter sa facture
Scénario 3 : Consultation des factures par vendeur
1.	Le vendeur se connecte à Selos Retails avec son login et mot de passe (stockés dans Salesperson)
2.	Consulte ses factures d'achat validées (filtrées automatiquement par son ID)
3.	Voit les détails : items Business Central (bc_items), quantités, montants
4.	Peut voir le bon de commande associé
Scénario 4 : Consultation du stock par vendeur
1.	Le vendeur se connecte à Selos (ou Selos Retails selon l'interface)
2.	Consulte automatiquement le stock de son dépôt (identifié via les informations intégrées dans Salesperson)
3.	Voit les quantités disponibles par item Business Central (bc_items)
________________________________________
Résumé en une phrase
Le module permet de créer des vendeurs (Salesperson) dans Selos en sélectionnant obligatoirement un client Business Central, avec récupération automatique des informations du client BC ; le vendeur obtient automatiquement un dépôt intégré (informations stockées directement dans Salesperson) avec nom auto-généré ; le vendeur dispose d'un login et mot de passe pour Selos Retails (authentification indépendante) ; ces vendeurs peuvent créer des chargements type qui génèrent automatiquement des bons de commande ; la validation de ces bons envoie obligatoirement les données vers Business Central, alimente le stock local dans Selos, et crée automatiquement une facture d'achat validée dans Selos Retails pour le vendeur, avec une gestion complète des items Business Central et consultation du stock.
