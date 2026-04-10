// ══════════════════════════════════════════════════════
//  COPROSYNC v2 — Production App
//  Supabase backend, PWA, multi-rôles, emails
// ══════════════════════════════════════════════════════

const SUPA_URL = 'https://sifjbqtnrfydxcemhsnz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZmpicXRucmZ5ZHhjZW1oc256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzIyMjYsImV4cCI6MjA4ODkwODIyNn0.aRZUunTn1W5hLNHRXDSWjp7hKcBtxQlFKSM05MTQyVE';
window.COPRO_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
// ── RÉSIDENCE LE FLORÉAL — Configuration ──
const COPRO = {
  nom: 'Résidence le Floréal',
  adresse: '13-19 Rue du Moucherotte, 38360 Sassenage',
  lat: 45.20313, lng: 5.66341,  // centre résidence — source coordonneesgps.net
  tours: ['Tour 13','Tour 15','Tour 17','Tour 19'],
  etages: 15,
  // Zones contextuelles par catégorie de signalement
  zones: {
    ascenseur: [
      'Tour 13 — Ascenseur impair','Tour 13 — Ascenseur pair',
      'Tour 15 — Ascenseur impair','Tour 15 — Ascenseur pair',
      'Tour 17 — Ascenseur impair','Tour 17 — Ascenseur pair',
      'Tour 19 — Ascenseur impair','Tour 19 — Ascenseur pair',
    ],
    fuite: [
      'Tour 13 — Cave / sous-sol','Tour 15 — Cave / sous-sol','Tour 17 — Cave / sous-sol','Tour 19 — Cave / sous-sol',
      'Tour 13 — Colonne montante','Tour 15 — Colonne montante','Tour 17 — Colonne montante','Tour 19 — Colonne montante',
      'Local chaufferie','Local technique','Parking visiteurs','Parking privé',
    ],
    securite: [
      'Portail principal (n°13)','Portail central (n°15-17)','Portail (n°19)',
      'Portillon Tour 13','Portillon Tour 15','Portillon Tour 17','Portillon Tour 19',
      'Interphone Tour 13','Interphone Tour 15','Interphone Tour 17','Interphone Tour 19',
      'Vidéosurveillance','Éclairage sécurité',
    ],
    proprete: [
      'Local poubelles Tour 13','Local poubelles Tour 15','Local poubelles Tour 17','Local poubelles Tour 19',
      'Couloir Tour 13','Couloir Tour 15','Couloir Tour 17','Couloir Tour 19',
      'Hall Tour 13','Hall Tour 15','Hall Tour 17','Hall Tour 19',
      'Parking visiteurs','Parking privé','Espaces verts / allées',
    ],
    parking: [
      'Parking visiteurs — Allée A','Parking visiteurs — Allée B','Parking visiteurs — Allée C',
      'Parking privé — Allée A','Parking privé — Allée B','Parking privé — Allée C',
      'Garages — Box individuels','Accès parking (portail)','Éclairage parking',
    ],
    espaces_verts: [
      'Aire de jeux enfants','Pelouse côté Tour 13','Pelouse côté Tour 19',
      'Allées piétonnes','Haies / arbustes','Arbres','Mobilier urbain',
    ],
    serrurerie: [
      'Portail principal (n°13)','Portail central (n°15-17)','Portail (n°19)',
      'Porte hall Tour 13','Porte hall Tour 15','Porte hall Tour 17','Porte hall Tour 19',
      'Local technique','Local poubelles Tour 13','Local poubelles Tour 15','Local poubelles Tour 17','Local poubelles Tour 19',
      'Garage — Box','Cave',
    ],
    electricite: [
      'Tour 13 — Hall / communs','Tour 15 — Hall / communs','Tour 17 — Hall / communs','Tour 19 — Hall / communs',
      'Éclairage parking visiteurs','Éclairage parking privé','Éclairage extérieur','Tableau électrique commun',
      'Local technique électrique',
    ],
    autre: [],
  },
  // Contrats initiaux à insérer en DB si besoin
  contratsInitiaux: [
    { fournisseur:'ACAF', type_contrat:'Ascenseurs', description:'Maintenance des 8 ascenseurs — 2 par tour (impair/pair)', contact_nom:'ACAF — Service clients', contact_tel:'04 76 XX XX XX' },
  ],
};

// Coordonnées précises — Résidence le Floréal, Sassenage (WGS84)
// Centre résidence relevé : N 45.20313 E 5.66341
// Les 4 tours sont alignées NE→SW le long de la rue du Moucherotte
// Tour 13 = sud, Tour 19 = nord, espacement ~25m entre tours
const TOUR_COORDS = {
  'Tour 13': [45.20268, 5.66375],  // sud — numéro 13 rue du Moucherotte
  'Tour 15': [45.20295, 5.66355],  // centre-sud
  'Tour 17': [45.20320, 5.66335],  // centre-nord (proche du centre relevé)
  'Tour 19': [45.20348, 5.66315],  // nord — numéro 19 rue du Moucherotte
  'Parking visiteurs': [45.20290, 5.66400],
  'Parking privé':     [45.20310, 5.66415],
  'Garages':           [45.20270, 5.66420],
  'Aire de jeux':      [45.20300, 5.66290],
  'Portails / portillons': [45.20260, 5.66360],
};

const { createClient } = supabase;
const sb = createClient(SUPA_URL, SUPA_KEY);
