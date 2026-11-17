# Sauvegarde et restauration Supabase

Les huit collections persistées sont synchronisées. IndexedDB conserve une copie
pour le fonctionnement hors ligne ; les changements en attente sont également
persistés et renvoyés au retour du réseau.

| Données de l’application | Table Supabase |
| --- | --- |
| Missions, photos, dégâts, notes vocales, signatures, documents joints et frais | `missions` |
| Véhicules et fichiers de carte grise / assurance | `vehicles` |
| Clients | `clients` |
| Rappels | `rappels` |
| Types de mission personnalisés | `custom_mission_types` |
| Bibliothèque Documents, contenu des fichiers et associations | `documents` |
| Entreprise, TVA et délais des alertes | `app_settings` |
| Catégories de frais personnalisées | `custom_expense_types` |

## Déploiement

Appliquer `supabase/migrations/202611170001_full_backup.sql` avant de déployer
l’application. Cette migration ajoute trois tables et conserve les cinq tables
existantes. Elle peut être réappliquée.

Le projet utilise un espace partagé sans connexion utilisateur. Les nouvelles
tables reprennent ce modèle avec RLS et des politiques pour les rôles `anon` et
`authenticated`. La clé de service ne doit jamais être intégrée au client.

## Migration des appareils existants

Au premier démarrage, l’application attend le chargement complet d’IndexedDB,
envoie les changements en attente, puis importe les documents, réglages et
catégories de frais encore présents uniquement sur cet appareil. Cette étape
possède un marqueur distinct de l’ancienne migration des missions et véhicules.
Son marqueur n’est écrit qu’après confirmation des envois.

L’import initial conserve les données déjà présentes dans Supabase. Une
installation vierge ne publie pas ses réglages par défaut à la place de ceux
d’un appareil existant. Toute modification explicite des réglages est envoyée.

Un ancien téléphone doit ouvrir la nouvelle version et terminer sa
synchronisation avant que ses données auparavant locales soient récupérables
sur un autre téléphone. Un fichier qui n’avait jamais été joint à une fiche
ne peut pas être reconstitué ; le formulaire Documents permet maintenant de
joindre le fichier et de le télécharger après restauration.

## Vérification

`npm test` couvre notamment les pièces jointes, les réglages, la migration depuis
l’ancienne version, la reprise hors ligne et la restauration des huit collections
dans une installation vierge. La lecture est paginée pour récupérer plus de
1 000 enregistrements. Une erreur sur une collection empêche de confirmer la
synchronisation complète.

Un essai de navigateur avec des données fictives a aussi importé un fichier et
modifié les réglages dans une première origine, puis vérifié leur restauration
dans une deuxième origine sans stockage local commun. Le contenu du fichier a
été comparé octet par octet. Cet essai ne constitue pas une validation sur un
téléphone physique.
