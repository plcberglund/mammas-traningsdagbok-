# Mammas promenader

En liten webbapp för promenader på rullbandet framför tv:n. Efter varje pass läser mamma av rullbandet, trycker in km och minuter med stora plus/minus-knappar och trycker på "Spara dagens promenad". Då kommer konfetti och en pepp-ruta.

Appen visar nästa medalj, veckomålet som en ring, totalsiffror, staplar vecka för vecka, medaljerna och de senaste promenaderna.

## Medaljer

Medaljerna följer en enda sak: hur långt hon har gått totalt. Första kilometern, fem kilometer, en mil, halvmaraton, maraton och sen städer på en låtsasresa från Umeå söderut längs E4, via Stockholm och Göteborg ner till Malmö (cirka 1400 km). Täta medaljer i början och glesare sen.

Belöningstrappan från Linus har åtta steg: 5, 12, 20, 30, 42, 56, 72 och 90 mil. Avståndet mellan stegen växer lite för varje steg. Kortet "Belöningar från Linus" är en stege med alla belöningssteg. Upplåsta och den närmaste syns i klartext, de längre fram står som hemliga. Stegen och belöningarna står i listan `BELONINGAR` i `app.js`. De är märkta med 🎁, och när hon tar en står det att hon ska skicka ett sms till Linus. Efter varje pass finns en knapp "Berätta för Linus" som öppnar ett färdigt sms. Numret skrivs in under Inställningar på hennes telefon och ligger aldrig i koden. Namnet på den som bjuder står i `GIVARE`.

Kortet "Nästa medalj" visar hur långt det är kvar till nästa. Inga dagar-i-rad eller andra mål som kan brytas, en missad dag kostar ingenting.

## Köra

Inga beroenden. Öppna `index.html` i en webbläsare, eller lägg upp mappen på GitHub Pages:
Settings → Pages → Deploy from a branch → välj grenen och `/ (root)`.

På mobil/surfplatta: öppna sidan och välj "Lägg till på hemskärmen" så blir den en egen ikon.

## Data

Allt sparas i webbläsarens `localStorage` på den enhet mamma använder. Under Inställningar finns knappar för att spara och läsa in en säkerhetskopia (JSON).

## Anpassa

Medaljerna ligger överst i `app.js` i listan `MEDALJER`, en rad per medalj med sträcka, namn och ikon. Byt gärna startpunkt till mammas hemstad eller en resa hon drömmer om.
