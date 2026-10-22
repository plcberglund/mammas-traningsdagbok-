# Mammas promenader

En liten webbapp för promenader på rullbandet framför tv:n. Efter varje pass läser mamma av rullbandet, trycker in km och minuter med stora plus/minus-knappar och trycker på "Jag har gått!". Då kommer konfetti och en pepp-ruta.

Appen visar veckomål som en ring, en låtsasresa genom Sverige (Stockholm till Kiruna), totalsiffror, staplar vecka för vecka, medaljer och de senaste promenaderna.

## Köra

Inga beroenden. Öppna `index.html` i en webbläsare, eller lägg upp mappen på GitHub Pages:
Settings → Pages → Deploy from a branch → välj grenen och `/ (root)`.

På mobil/surfplatta: öppna sidan och välj "Lägg till på hemskärmen" så blir den en egen ikon.

## Data

Allt sparas i webbläsarens `localStorage` på den enhet mamma använder. Under Inställningar finns knappar för att spara och läsa in en säkerhetskopia (JSON).

## Anpassa

Rutten och medaljerna ligger överst i `app.js` (`RUTT` och `MEDALJER`). Byt gärna startpunkt till mammas hemstad eller en resa hon drömmer om.
