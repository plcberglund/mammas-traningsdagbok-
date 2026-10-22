# Mammas promenader

En liten webbapp för promenader på rullbandet framför tv:n. Efter varje pass läser mamma av rullbandet, trycker in km och minuter med stora plus/minus-knappar och trycker på "Jag har gått!". Då kommer konfetti och en pepp-ruta.

Appen visar veckomål som en ring, en låtsasresa genom Sverige (Stockholm till Kiruna), totalsiffror, staplar vecka för vecka, medaljer och de senaste promenaderna.

## Mål och medaljer

Det finns 64 medaljer i åtta kategorier: total sträcka, antal promenader, total tid, längsta pass, dagar i rad, klarade veckomål, veckor i rad och städer längs resan. Varje kategori är en trappa där de första stegen är lätta och de sista tar månader. Medaljerna kommer i brons, silver, guld och diamant.

Kortet "Nästa mål" visar de tre medaljer hon är närmast, med en stapel och hur mycket som är kvar. När en ny medalj tas studsar den fram i firandet. Tryck på en medalj för att se när den togs eller vad som krävs.

Datumen räknas fram ur historiken, så de stämmer även om en promenad tas bort i efterhand.

## Köra

Inga beroenden. Öppna `index.html` i en webbläsare, eller lägg upp mappen på GitHub Pages:
Settings → Pages → Deploy from a branch → välj grenen och `/ (root)`.

På mobil/surfplatta: öppna sidan och välj "Lägg till på hemskärmen" så blir den en egen ikon.

## Data

Allt sparas i webbläsarens `localStorage` på den enhet mamma använder. Under Inställningar finns knappar för att spara och läsa in en säkerhetskopia (JSON).

## Anpassa

Rutten och målen ligger överst i `app.js` (`RUTT` och `KATEGORIER`). Lägg till eller ta bort steg i en `steg`-lista så ändras medaljerna. Byt gärna startpunkt till mammas hemstad eller en resa hon drömmer om.
