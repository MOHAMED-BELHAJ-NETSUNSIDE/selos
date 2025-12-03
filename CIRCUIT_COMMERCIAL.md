# Circuit Commercial - Documentation de la Logique

## Vue d'ensemble

Le **Circuit Commercial** est une fonctionnalité du module **Secteurs** qui permet d'organiser et de planifier les visites commerciales en affectant des zones géographiques à des jours spécifiques de la semaine, selon différentes fréquences de visite.

## Principe de fonctionnement

Le Circuit Commercial permet de :
- Associer un secteur à un circuit commercial
- Affecter des zones géographiques à chaque jour de la semaine (Lundi à Dimanche)
- Définir une fréquence de visite pour chaque zone
- Planifier automatiquement les visites des clients selon leur zone d'appartenance

## Structure des données

### Modèle CircuitCommercial
- **Un secteur** = **Un circuit commercial** (relation 1:1)
- Chaque circuit commercial contient plusieurs zones affectées à des jours

### Modèle CircuitCommercialZone
Chaque zone dans le circuit est caractérisée par :
- **zoneId** : Identifiant de la zone géographique
- **jour** : Jour de la semaine (1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche)
- **frequence** : Type de fréquence de visite (`semaine`, `quinzaine`, `mois`)
- **groupes** : Paramètre optionnel selon la fréquence (voir détails ci-dessous)

## Types de fréquences de visite

### 1. Fréquence "Par semaine"

**Description** : Les clients de cette zone doivent être visités **chaque semaine** le jour spécifié.

**Configuration** :
- `frequence` : `"semaine"`
- `groupes` : Non requis (null)

**Exemple** :
- **Zone** : "Ariana"
- **Fréquence** : Par semaine
- **Jour** : Lundi (jour = 1)

**Résultat** : Les clients rattachés à la zone "Ariana" doivent être visités **chaque lundi de chaque semaine**.

**Calendrier de visite** :
- Semaine 1 : Lundi
- Semaine 2 : Lundi
- Semaine 3 : Lundi
- ... (toutes les semaines)

---

### 2. Fréquence "Par quinzaine"

**Description** : Les clients de cette zone doivent être visités **toutes les deux semaines** le jour spécifié, selon un groupe de semaines.

**Configuration** :
- `frequence` : `"quinzaine"`
- `groupes` : **Obligatoire**, doit être soit :
  - `"1,3"` : Semaines impaires (groupe 1,3) → Semaines 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51
  - `"2,4"` : Semaines paires (groupe 2,4) → Semaines 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52

**Exemple 1 - Groupe 1,3 (Semaines impaires)** :
- **Zone** : "Romana"
- **Fréquence** : Par quinzaine
- **Groupes** : `"1,3"`
- **Jour** : Mardi (jour = 2)

**Résultat** : Les clients rattachés à la zone "Romana" doivent être visités **chaque mardi des semaines impaires** (semaines 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51).

**Calendrier de visite** :
- Semaine 1 : Mardi ✓
- Semaine 2 : Pas de visite
- Semaine 3 : Mardi ✓
- Semaine 4 : Pas de visite
- Semaine 5 : Mardi ✓
- ... (pattern répété)

**Exemple 2 - Groupe 2,4 (Semaines paires)** :
- **Zone** : "Bizerte"
- **Fréquence** : Par quinzaine
- **Groupes** : `"2,4"`
- **Jour** : Jeudi (jour = 4)

**Résultat** : Les clients rattachés à la zone "Bizerte" doivent être visités **chaque jeudi des semaines paires** (semaines 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52).

**Calendrier de visite** :
- Semaine 1 : Pas de visite
- Semaine 2 : Jeudi ✓
- Semaine 3 : Pas de visite
- Semaine 4 : Jeudi ✓
- Semaine 5 : Pas de visite
- ... (pattern répété)

---

### 3. Fréquence "Par mois"

**Description** : Les clients de cette zone doivent être visités **une fois par mois** le jour spécifié, pendant une semaine précise du mois.

**Configuration** :
- `frequence` : `"mois"`
- `groupes` : **Obligatoire**, doit être :
  - `"1"` : 1ère semaine du mois
  - `"2"` : 2ème semaine du mois
  - `"3"` : 3ème semaine du mois
  - `"4"` : 4ème semaine du mois

**Exemple** :
- **Zone** : "Mnihla"
- **Fréquence** : Par mois
- **Groupes** : `"2"` (2ème semaine du mois)
- **Jour** : Dimanche (jour = 7)

**Résultat** : Les clients rattachés à la zone "Mnihla" doivent être visités **chaque dimanche de la 2ème semaine de chaque mois**.

**Calendrier de visite** :
- Janvier : Dimanche de la 2ème semaine ✓
- Février : Dimanche de la 2ème semaine ✓
- Mars : Dimanche de la 2ème semaine ✓
- ... (chaque mois)

**Note** : La détermination de la semaine du mois se fait généralement en fonction du premier jour du mois et du jour de la semaine cible.

---

## Règles de validation

### Validation des groupes

1. **Pour la fréquence "quinzaine"** :
   - Le champ `groupes` est **obligatoire**
   - Doit être exactement `"1,3"` ou `"2,4"`
   - Aucune autre valeur n'est acceptée

2. **Pour la fréquence "mois"** :
   - Le champ `groupes` est **obligatoire**
   - Doit être exactement `"1"`, `"2"`, `"3"` ou `"4"`
   - Aucune autre valeur n'est acceptée

3. **Pour la fréquence "semaine"** :
   - Le champ `groupes` n'est **pas requis** (peut être null)

### Validation des zones

- Toutes les zones affectées à un circuit commercial doivent appartenir au **même canal** que le secteur
- Une zone ne peut pas être affectée deux fois au même jour dans le même circuit commercial (contrainte unique)

## Logique de calcul des dates de visite

### Pour la fréquence "semaine"

```javascript
// Pseudo-code
function calculerDatesVisiteSemaine(jourSemaine, dateDebut, dateFin) {
  const dates = [];
  let dateCourante = dateDebut;
  
  // Trouver le premier jour de la semaine correspondant
  while (dateCourante.getDay() !== jourSemaine) {
    dateCourante = dateCourante + 1 jour;
  }
  
  // Ajouter toutes les semaines suivantes
  while (dateCourante <= dateFin) {
    dates.push(dateCourante);
    dateCourante = dateCourante + 7 jours;
  }
  
  return dates;
}
```

### Pour la fréquence "quinzaine"

```javascript
// Pseudo-code
function calculerDatesVisiteQuinzaine(jourSemaine, groupes, dateDebut, dateFin) {
  const dates = [];
  let dateCourante = dateDebut;
  
  // Trouver le premier jour de la semaine correspondant
  while (dateCourante.getDay() !== jourSemaine) {
    dateCourante = dateCourante + 1 jour;
  }
  
  // Calculer le numéro de semaine ISO
  while (dateCourante <= dateFin) {
    const numeroSemaine = getISOWeekNumber(dateCourante);
    
    if (groupes === "1,3") {
      // Semaines impaires
      if (numeroSemaine % 2 === 1) {
        dates.push(dateCourante);
      }
    } else if (groupes === "2,4") {
      // Semaines paires
      if (numeroSemaine % 2 === 0) {
        dates.push(dateCourante);
      }
    }
    
    dateCourante = dateCourante + 7 jours;
  }
  
  return dates;
}
```

### Pour la fréquence "mois"

```javascript
// Pseudo-code
function calculerDatesVisiteMois(jourSemaine, groupeSemaine, dateDebut, dateFin) {
  const dates = [];
  let dateCourante = dateDebut;
  
  // Pour chaque mois dans la plage
  while (dateCourante <= dateFin) {
    const premierJourMois = new Date(dateCourante.getFullYear(), dateCourante.getMonth(), 1);
    
    // Trouver le premier jour de la semaine correspondant dans le mois
    let jourCible = premierJourMois;
    while (jourCible.getDay() !== jourSemaine) {
      jourCible = jourCible + 1 jour;
    }
    
    // Calculer la semaine du mois (1, 2, 3 ou 4)
    const semaineDuMois = Math.floor((jourCible.getDate() - 1) / 7) + 1;
    
    // Si c'est la bonne semaine, ajouter la date
    if (semaineDuMois === parseInt(groupeSemaine)) {
      dates.push(jourCible);
    }
    
    // Passer au mois suivant
    dateCourante = new Date(dateCourante.getFullYear(), dateCourante.getMonth() + 1, 1);
  }
  
  return dates;
}
```

## Exemples complets

### Exemple 1 : Zone "Ariana" - Fréquence hebdomadaire

**Configuration** :
```json
{
  "zoneId": 1,
  "jour": 1,
  "frequence": "semaine",
  "groupes": null
}
```

**Résultat** : Visite chaque lundi de chaque semaine.

**Dates de visite (exemple pour janvier 2024)** :
- 1er janvier 2024 (Lundi)
- 8 janvier 2024 (Lundi)
- 15 janvier 2024 (Lundi)
- 22 janvier 2024 (Lundi)
- 29 janvier 2024 (Lundi)

---

### Exemple 2 : Zone "Romana" - Fréquence quinzaine (groupe 1,3)

**Configuration** :
```json
{
  "zoneId": 2,
  "jour": 2,
  "frequence": "quinzaine",
  "groupes": "1,3"
}
```

**Résultat** : Visite chaque mardi des semaines impaires.

**Dates de visite (exemple pour janvier-février 2024)** :
- 2 janvier 2024 (Mardi) - Semaine 1 ✓
- 9 janvier 2024 (Mardi) - Semaine 2 ✗
- 16 janvier 2024 (Mardi) - Semaine 3 ✓
- 23 janvier 2024 (Mardi) - Semaine 4 ✗
- 30 janvier 2024 (Mardi) - Semaine 5 ✓
- 6 février 2024 (Mardi) - Semaine 6 ✗
- 13 février 2024 (Mardi) - Semaine 7 ✓

---

### Exemple 3 : Zone "Mnihla" - Fréquence mensuelle (groupe 2)

**Configuration** :
```json
{
  "zoneId": 3,
  "jour": 7,
  "frequence": "mois",
  "groupes": "2"
}
```

**Résultat** : Visite chaque dimanche de la 2ème semaine du mois.

**Dates de visite (exemple pour 2024)** :
- 14 janvier 2024 (Dimanche) - 2ème semaine de janvier ✓
- 11 février 2024 (Dimanche) - 2ème semaine de février ✓
- 10 mars 2024 (Dimanche) - 2ème semaine de mars ✓
- 14 avril 2024 (Dimanche) - 2ème semaine d'avril ✓
- ...

---

## Implémentation technique

### Structure de la base de données

```sql
CREATE TABLE circuit_commercial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secteur_id INT NOT NULL UNIQUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (secteur_id) REFERENCES secteur(id) ON DELETE CASCADE
);

CREATE TABLE circuit_commercial_zone (
  id INT AUTO_INCREMENT PRIMARY KEY,
  circuit_commercial_id INT NOT NULL,
  zone_id INT NOT NULL,
  jour INT NOT NULL COMMENT '1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche',
  frequence ENUM('semaine', 'quinzaine', 'mois') NOT NULL DEFAULT 'semaine',
  groupes VARCHAR(50) NULL COMMENT 'Pour quinzaine: "1,3" ou "2,4". Pour mois: "1", "2", "3" ou "4"',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (circuit_commercial_id) REFERENCES circuit_commercial(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zone(id) ON DELETE CASCADE,
  UNIQUE KEY unique_zone_jour (circuit_commercial_id, zone_id, jour)
);
```

### Validation côté backend

La validation est effectuée dans le service `CircuitCommercialService` :

1. Vérification que toutes les zones appartiennent au même canal que le secteur
2. Validation des groupes selon la fréquence :
   - Quinzaine : groupes doivent être "1,3" ou "2,4"
   - Mois : groupe doit être "1", "2", "3" ou "4"
   - Semaine : groupes non requis

## Notes importantes

1. **Numérotation des semaines** : Pour la fréquence "quinzaine", la numérotation des semaines suit généralement la norme ISO 8601 (semaine commençant le lundi).

2. **Calcul de la semaine du mois** : Pour la fréquence "mois", la détermination de la semaine du mois peut varier selon la méthode utilisée. Il est recommandé d'utiliser une méthode cohérente basée sur le premier jour du mois.

3. **Clients et zones** : Les clients doivent être rattachés à une zone pour que la logique de visite s'applique. La zone du client doit correspondre à une zone configurée dans le circuit commercial du secteur.

4. **Contraintes** : Une zone ne peut pas être affectée deux fois au même jour dans le même circuit commercial (contrainte d'unicité).

## Cas d'usage

Cette fonctionnalité permet de :
- Planifier automatiquement les visites commerciales
- Optimiser les itinéraires des commerciaux
- Assurer une couverture régulière des clients selon leur zone
- Gérer différents rythmes de visite selon l'importance ou la localisation des zones
- Faciliter la planification hebdomadaire, bimensuelle ou mensuelle

