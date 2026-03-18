# StageConnect - PRD (Product Requirements Document)

## Problem Statement
Plateforme moderne de gestion de candidatures (stages/emplois) en français avec deux types d'utilisateurs : candidats et recruteurs. Design minimaliste inspiré de Linear/Notion.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + MongoDB (port 8001)
- **Auth**: JWT (email/mot de passe)
- **Messagerie**: WebSocket temps réel
- **Upload**: CV (fichiers PDF/DOC)
- **Theme**: Dark navy (#0F172A), Inter font, indigo/emerald accents

## User Personas
1. **Candidat** - Étudiant/diplômé cherchant stages/emplois
2. **Recruteur** - Entreprise cherchant des talents

## Core Requirements
- Auth JWT avec rôles (candidat/recruteur)
- Dashboard candidat : profil, feed d'offres, tracker Kanban, messages, calendrier
- Dashboard recruteur : profil entreprise, publication d'offres, gestion candidats, messages, planificateur
- Données démo réalistes multi-secteurs (Tech, Finance, Santé, Marketing)
- UI entièrement en français
- Responsive mobile-first

## What's Been Implemented (Feb 2026)
- [x] Landing page avec CTA "Je suis candidat" / "Je suis recruteur"
- [x] Auth (login/register) avec rôles
- [x] Dashboard candidat complet (stats, recommandations, profil, offres, Kanban, messages, calendrier)
- [x] Dashboard recruteur complet (stats, profil entreprise, publication offres, gestion offres, review candidats, messages, planificateur)
- [x] Feed d'offres avec filtres (domaine, type, recherche)
- [x] Kanban tracker (Envoyée → En cours → Entretien → Acceptée → Refusée)
- [x] Messagerie WebSocket temps réel
- [x] Upload CV
- [x] Calendrier d'entretiens (côté candidat et recruteur)
- [x] Données démo (3 candidats, 3 recruteurs, 8 offres, 3 candidatures)
- [x] Recommandations basées sur les compétences
- [x] Backend 100% testé, Frontend 95% testé

## Prioritized Backlog
### P0 (Done)
- Auth, Dashboards, CRUD complet

### P1 (Next)
- Drag & drop Kanban
- Notifications in-app (nouveau message, changement statut)
- Recherche avancée avec filtres combinés

### P2
- Export CV en PDF depuis le profil
- Statistiques avancées (graphiques recharts)
- Système de favoris/bookmarks pour les offres
- Email de rappel d'entretien

### P3
- Mode multi-langue (FR/EN)
- Application mobile (React Native)
- Intégration LinkedIn
