# App-Syndic

Application web de gestion de copropriete (CoproSync).

## Arborescence

```text
App-Syndic-main/
  index.html
  manifest.json
  sw.js
  vercel.json
  supabase_schema.sql
  assets/
    css/
      app.css
    js/
      core/
        config.js
        state.js
        helpers.js
        app-start.js
        bootstrap-session.js
      services/
        data-loaders.js
        realtime-notifications.js
        logging.js
        email.js
        pwa.js
      features/
        auth/auth.js
        navigation/navigation.js
        ui/modal.js
        ui/render-router.js
        dashboard/dashboard.js
        tickets/ticket-detail.js
        tickets/ticket-form.js
        tickets/ticket-map.js
        assets/contrats.js
        assets/cles.js
        assets/journal.js
        users/users.js
        notifications/notifications-page.js
        profile/profile.js
        register/qr-and-register-link.js
        register/register-page.js
        reports/rapport.js
        mobile/mobile-interactions.js
        annonces/annonces.js
        agenda/agenda.js
        theme/theme.js
        search/search.js
        contacts/contacts.js
        onboarding/onboarding.js
        documents/documents.js
        votes/votes.js
        messages/messages.js
```

## Decoupage applique

- `index.html`: structure de page, metas SEO/PWA, import des librairies externes.
- `assets/css/app.css`: tout le style de l'application.
- `assets/js/core/*`: configuration, etat global, helpers, demarrage, bootstrap session.
- `assets/js/services/*`: services transverses (data, realtime, logs, email, pwa).
- `assets/js/features/*`: fonctionnalites metier decouplees par domaine.

## Chargement des modules

Les scripts sont charges dans `index.html` dans un ordre volontaire pour conserver les dependances globales entre modules.
Chaque fichier peut etre modifie de maniere isolee tant que les API globales qu'il expose restent stables.
