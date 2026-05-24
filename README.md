# Configuration du Projet (Frontend & Backend)

Ce dépôt contient le frontend et le backend Eclipse. La base de données PostgreSQL se génère automatiquement au lancement du backend.

## 1. Prérequis pour la Base de Données
1. Installez **PostgreSQL** sur votre machine.
2. Ouvrez votre outil PostgreSQL (ex: pgAdmin) et créez une base de données **vide** (nommez-la comme vous le souhaitez, par exemple `mon_projet_db`).

## 2. Configuration et Lancement du Backend (Eclipse)
1. Ouvrez Eclipse.
2. Allez dans **File** -> **Import** -> **Existing Maven Projects**.
3. Sélectionnez le dossier `backend/` de ce dépôt.
4. Ouvrez le fichier `src/main/resources/application.properties`.
5. Modifiez les lignes suivantes avec vos propres identifiants PostgreSQL locaux :
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/LE_NOM_DE_VOTRE_BASE_VIDE
   spring.datasource.username=VOTRE_UTILISATEUR_POSTGRES
   spring.datasource.password=VOTRE_MOT_DE_PASSE_POSTGRES
   ```
6. Faites un clic droit sur le projet -> **Run As** -> **Spring Boot App** (ou *Java Application*).

*Note : Au premier démarrage, Hibernate va créer automatiquement toutes les tables nécessaires à l'authentification dans votre base PostgreSQL vide.*

## 3. Lancement du Frontend
1. Ouvrez un terminal dans le dossier `frontend/`.
2. Installez les dépendances et lancez le serveur (ex: `npm install && npm start`).
3. L'application est prête ! Vous pouvez créer un compte et vous connecter, le front communiquera directement avec le backend sur `http://localhost:8080`.
