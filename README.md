# Application Bancaire - Gestion de Comptes

Ce projet a été réalisé par Edouard et Yasmine.

## Description du Projet

Cette application bancaire est conçue pour offrir une gestion complète des comptes clients. Elle permet aux utilisateurs de gérer leurs comptes, effectuer des virements, visualiser l'historique des transactions, et assurer un suivi de leurs connexions. L’objectif est de fournir une solution bancaire conviviale.

## Fonctionnalités Principales

### Gestion des Comptes
- **Ajout et Suppression de Comptes** : Les utilisateurs peuvent créer de nouveaux comptes ou supprimer des comptes existants, en toute simplicité.
- **Affichage des Comptes** : Visualisation des comptes disponibles, incluant le solde et l'évolution des mouvements financiers sous forme de graphique.

### Transactions
- **Virements Internes** : Les utilisateurs peuvent transférer des fonds entre leurs comptes.
- **Virements Externes** : Possibilité d’envoyer des fonds vers les comptes d’autres utilisateurs ou de bénéficiaires externes.
- **Historique des Transactions** : Les utilisateurs peuvent consulter l'historique de tous les virements effectués, le filtrer, et le télécharger en format CSV pour un suivi simplifiée.

### Historique des Connexions
- Suivi des connexions pour une meilleure transparence.

## Sécurité

- **Politique de Mot de Passe** : Conformément aux recommandations de la CNIL, un mot de passe devra contenir au minimum :
  - 12 caractères,
  - au moins 1 chiffre,
  - 1 lettre majuscule,
  - et 1 caractère spécial.
  - chiffrer et hasher le mot de passe 

- **Attaque Brut Force**:
On a utilisé SlowApi et son mécanisme SlowDown pour empêcher les attaques Brut Force lors de la connexion 

- **Attaque XSS**:
On a utilisé DomPurify pour gérer les attaques XSS coté front

## Sécurité (à venir)

Nous utilisons pour l'instant Fast API et une db.json, nous devrons donc apporter de nouvelles couches de sécurité lors du déploiement.  

- **Protection contre les Attaques Courantes** :
  - **Prévention des Attaques CSRF côté serveur**: une couche de protection sera ajoutée du côté serveur
  - **Prévention des Attaques CSRF** (Cross-Site Request Forgery): Nous mettrons en place des token CSRF
  - **Protection contre les Injections SQL** : Toutes les entrées utilisateur seront traitées pour prévenir les tentatives d’injection SQL (à implémenter lors de la connexion avec une base de donnée).


## Technologies utilisées

### Frontend
- **HTML**
- **CSS**
  - **Bootstrap 4**
  - **Custom CSS**
- **JavaScript**
  - **jQuery**

### Backend 
- **FastAPI (Python)**