# Agger 2026 Reise-App

Mobile-first PWA für Marc, Anne und Twix. Ohne Konfiguration funktioniert die Packliste lokal und offline. Mit Supabase wird sie zwischen beiden Geräten synchronisiert.

## Lokal starten

Im Ordner `app` einen statischen Webserver starten, zum Beispiel mit VS Code Live Server oder:

```powershell
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen. Service Worker und Installation funktionieren nicht über eine direkt geöffnete `file://`-Datei.

## Gemeinsame Packliste aktivieren

1. Kostenloses Projekt auf https://supabase.com erstellen.
2. Im SQL Editor den Inhalt von `supabase.sql` ausführen.
3. Unter Project Settings -> API die Project URL und den `anon public` Key kopieren.
4. Beide Werte in `config.js` eintragen.
5. Vor Veröffentlichung `tripId` und die vier Policies in `supabase.sql` auf einen langen zufälligen Wert ändern.

Der `anon` Key darf in einer Browser-App stehen. Die Sicherheit wird über Row Level Security geregelt. Für sensible oder langfristige Nutzung sollte zusätzlich Supabase Auth aktiviert werden.

## GitHub Pages

1. Den Inhalt dieses Ordners in ein GitHub-Repository legen.
2. Repository Settings -> Pages öffnen.
3. Deploy from a branch, Branch `main`, Ordner `/ (root)` auswählen.
4. Nach dem Deployment die Pages-URL auf beiden Smartphones öffnen und zum Home-Bildschirm hinzufügen.

## Enthalten

- Reiseübersicht und Countdown
- An- und Rückfahrt mit Google-Maps-Links
- Hausinformationen und wichtige Kontakte
- Ausflugsziele und Restaurants
- interaktive Packliste mit eigenen Einträgen
- lokale Offline-Speicherung
- optionale gemeinsame Synchronisierung über Supabase
- installierbare PWA mit Offline-Cache

