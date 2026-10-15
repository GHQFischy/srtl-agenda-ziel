# Zielbild · Teamtag mit gemeinsamer Agenda

Dieser Ordner enthält den fertigen Website-Stand für die Live-Demo. Die statische Vorlage unter `../../Projektwebsite/` und der erste lokale Agenda-Stand unter `../../Features/Agenda/` sind die vorherigen Ausbaustufen.

## Start und Vorführung

1. `index.html` in Chrome oder Edge öffnen. Internetzugang ist für Anmeldung und Daten nötig. Für die Vorführung vorzugsweise über eine feste HTTP-Adresse oder GitHub Pages öffnen; browserabhängiges Sitzungsverhalten direkt geöffneter Dateien lässt sich so vermeiden.
2. Mit einem von dir angelegten Supabase-Teilnehmerkonto anmelden. Zugangsdaten persönlich eingeben; nicht in Dateien oder Schulungsfolien ablegen.
3. Einen Agendapunkt mit Uhrzeit und Titel hinzufügen. Die Liste wird nach Uhrzeit sortiert und der Punkt zentral gespeichert.
4. Seite neu laden: der Punkt bleibt erhalten. Ein zweiter angemeldeter Browser kann denselben Stand über **Aktualisieren** laden.
5. Einen eigenen, zuvor als Wegwerfpunkt vereinbarten Demoeintrag über **Entfernen** löschen. Alle angemeldeten Konten dürfen alle Punkte entfernen. Es gibt derzeit keinen Papierkorb und keinen Bearbeitungsdialog.
6. Mit **Abmelden** die aktuelle Sitzung beenden.

Als sichtbare Beispiele wurden am 15.10.2026 im Supabase-Projekt angelegt:

- 09:00 · Begrüßung und Ziele
- 10:00 · Workshop: Ideen für unser Projekt

Diese Punkte liegen in der echten gemeinsamen Datenbank, nicht im HTML. Eine Kopie des Website-Ordners erhält daher keine unabhängige Agenda. Vor einer Schulung gewünschte Ausgangsdaten bewusst über die Oberfläche vorbereiten; keinen pauschalen Datenbank-Reset ausführen.

Für eine temporäre statische HTTP-Vorschau kann der Trainer aus diesem Ordner bei vorhandener Python-Installation `python -m http.server 8173 --bind 127.0.0.1` starten und `http://127.0.0.1:8173` öffnen. Das stellt nur Website-Dateien bereit und enthält kein lokales Backend oder Supabase-Mock.

## Als Demo-Zielbild verwenden

Die Entwicklung fachlich in drei Schritten zeigen:

| Stand | Fachlicher Nutzen | Ablage |
|---|---|---|
| Statische Seite | Termin, Status und Kontakt ansehen | `Demos/Projektwebsite/` |
| Feature „Agenda erstellen“ | Punkte auf der Seite hinzufügen und entfernen | `Demos/Features/Agenda/` |
| Dieses Zielbild | Einloggen, gemeinsam planen und nach Neuladen weiterarbeiten | `Demos/Zielbild/Agenda-Site/` |

Für einen vorbereiteten Feature-Branch den Inhalt dieses Ordners in die Website-Wurzel des separaten Demorepositorys übernehmen, einschließlich `vendor/`. Ein Commit kann z. B. `Gemeinsame Agenda mit Teilnehmeranmeldung ergänzen` heißen. Den fertigen Stand vorführen; die SDK- und Auth-Einrichtung nicht in den fünfminütigen Git-Ausblick packen. Termin- und Statusänderungen aus vorherigen Demos beim Übernehmen der vollständigen Zieldatei gegebenenfalls beibehalten und den Diff prüfen.

## Supabase und Zugriff

- Projekt: [teamtag-agenda](https://supabase.com/dashboard/project/gsjudpaaityckuiywusn)
- Projekt-URL und öffentlicher Publishable Key stehen in `config.js`. Diese Werte dürfen im Browser sichtbar sein. Es sind keine Secret-/Service-Role-Schlüssel enthalten.
- Auth: E-Mail/Passwort. Teilnehmer über **Authentication → Users → Add user → Create new user** anlegen und bei Bedarf **Auto confirm user** verwenden. Keine Mitgliedertabelle, kein Kopieren von User-IDs.
- Die öffentliche Registrierung und anonyme Anmeldungen sind ausgeschaltet. Jeder administrativ angelegte, angemeldete Nutzer darf die gemeinsame Agenda lesen, Einträge hinzufügen und entfernen.
- Die Tabelle `public.pm_agenda_items` und ihre drei RLS-Policies schützen die Daten zusätzlich zum Login der Oberfläche. Die Anwendung fragt ausschließlich diese Tabelle ab. Das Feld `created_by` setzt die Datenbank aus dem angemeldeten Konto.
- Agendapunkte aktualisieren sich auf Knopfdruck; es ist keine Echtzeitübertragung konfiguriert.
- Das offizielle Supabase-SDK erneuert die Sitzung. Die Anmeldung liegt im Sitzungsspeicher des Tabs und übersteht Neuladen. Nach Schließen des Tabs bzw. in einem anderen Browser ist eine erneute Anmeldung nötig. Passwörter werden nicht gespeichert.
- Die Anwendung unterstützt hier bewusst E-Mail/Passwort, keine Einladungscallbacks, Registrierung oder Passwort-Zurücksetzen-Seite.

## GitHub Pages

Alle Website-Dateien einschließlich `vendor/` in die gewählte Pages-Veröffentlichungswurzel kopieren; `README.md` wird für den Betrieb nicht benötigt. Keine npm-Installation und kein Build erforderlich. Die relativen Pfade funktionieren auch unter einer Repository-Unteradresse. Veröffentlichen und Cloud-Datenbank sind getrennt: GitHub Pages liefert die Seite, Supabase verwaltet Anmeldung und Daten.

Der Website-Code und statische Inhalte sind bei einer öffentlichen Pages-Site einsehbar. Der Login schützt den interaktiven Agenda-Bereich; vertrauliche Inhalte gehören nicht als statischer Text in die HTML-Datei.

## Verifikation

- Sechs Playwright-Prüfungen unter `../../Pruefung/zielbild.spec.cjs`: Anmeldung als Startansicht, Pflichtfelder, mobile Breite, SDK beim direkten Öffnen und zwei ausschließlich lesende Live-Prüfungen gegen Supabase (anonymer Zugriff gesperrt, Registrierung deaktiviert).
- Live im Browser geprüft: Nutzeranmeldung, Speichern beider Beispielpunkte und Fortbestand nach Neuladen. Die Entfernung vorhandener Cloudpunkte und die Nutzung durch zwei verschiedene Konten wurden nicht automatisiert getestet.
- Noch nicht auf GitHub Pages veröffentlicht. Diese Ablage ist das vorbereitete Zielbild.

## Mitgelieferte Bibliothek

`vendor/supabase.min.js` ist das offizielle `@supabase/supabase-js` **2.117.3**, bezogen über `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3`. Die Version wurde am 15.10.2026 anhand des npm-Registers geprüft. Die zugehörige MIT-Lizenz liegt unter `vendor/LICENSE.supabase`. Die Datei ist lokal mitgeliefert, damit die Präsentation keinen zusätzlichen Bibliotheks-CDN benötigt. Für ein Update Version bewusst auswählen und die Browserabläufe erneut prüfen.
