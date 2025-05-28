# ✅ TODO: Email-Verifizierung im Vue-Frontend

## 📁 ROUTING

- [ ] Erstelle eine neue Vue-Route: `/auth/verify`
  - Diese Route wird aufgerufen, wenn der Nutzer auf den Link in der Verifizierungs-E-Mail klickt.
  - Sie enthält keine Authentifizierung, da Nutzer nicht eingeloggt sein muss.

---

## 🧪 TOKEN-VERARBEITUNG

- [ ] Lies den `token`-Parameter aus der URL (`?token=...`)
  - Nutze z. B. `this.$route.query.token` oder `useRoute()` (in Vue 3 mit Composition API)
- [ ] Prüfe, ob der Token vorhanden ist
  - Wenn nicht: Fehler anzeigen und auf Startseite oder Fehlerseite umleiten

---

## 🔁 ANFRAGE AN BACKEND

- [ ] Sende eine `GET`-Anfrage an das Backend:
  - `GET https://<dein-backend>/auth/verify-email?token=<token>`
- [ ] Backend wird den Token prüfen (Signatur + DB) und antworten mit Erfolgs- oder Fehlermeldung

---

## 🧾 UI REAKTIONEN

- [ ] Bei erfolgreicher Verifizierung:
  - Zeige dem User eine Erfolgsmeldung (z. B. ✅ "E-Mail erfolgreich verifiziert")
  - Leite anschließend automatisch weiter zur Login-Seite (`/login`)
- [ ] Bei fehlgeschlagenem Token:
  - Zeige dem User eine Fehlermeldung (❌ Token ungültig oder abgelaufen)
  - Optional: Button "Erneut senden" oder Weiterleitung auf `/resend-verification`

---

## 🧱 FEHLERFALL-BEHANDLUNG

- [ ] Behandle diese Szenarien:
  - Kein Token in der URL
  - Token ist abgelaufen oder manipuliert
  - Backend nicht erreichbar
- [ ] Für jeden Fall soll eine verständliche Nachricht erscheinen, kein leerer Screen

---

## ✉️ VERIFIKATIONS-LINK (Server-seitig)

- [ ] Stelle sicher, dass der Link in der Mail auf diese neue Route zeigt:
  - Beispiel: `https://<frontend-domain>/auth/verify?token=<jwt-token>`

---

## 🔐 BACKEND HINWEIS (Dokumentation)

- [ ] Stelle sicher, dass die Backendroute `/auth/verify-email`:
  - Public ist (ohne JWT-Guard oder andere Authentifizierung)
  - Keine sensible Daten zurückgibt
