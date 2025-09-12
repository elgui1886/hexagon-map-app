# Hexagon Map App

Una applicazione web TypeScript per la visualizzazione di mappe con esagoni H3 popolati con dati. L'applicazione converte la logica originale da Svelte a TypeScript vanilla con Leaflet per la gestione delle mappe.

## Caratteristiche

- 🗺️ **Mappa interattiva** con Leaflet
- 🔢 **Esagoni H3** per la visualizzazione di dati geospaziali
- 🎨 **Colori dinamici** basati sui valori KPI usando chroma-js
- 📊 **Controlli filtri** per KPI e aggregazione
- 🎯 **Zoom automatico** ai dati caricati
- 📱 **Design responsive** con CSS moderno

## Tecnologie utilizzate

- **TypeScript** - Linguaggio principale
- **Vite** - Build tool e dev server
- **Leaflet** - Libreria per mappe interattive
- **H3-js** - Libreria per il sistema di indicizzazione esagonale H3
- **Chroma-js** - Libreria per la manipolazione dei colori
- **CSS Vanilla** - Styling moderno con CSS variables

## Struttura del progetto

```
src/
├── map/
│   └── MapManager.ts          # Classe principale per gestire la mappa
├── stores/
│   └── index.ts              # Sistema di state management
├── styles/
│   └── main.css              # Stili CSS
├── types/
│   └── index.ts              # Definizioni TypeScript
└── main.ts                   # Entry point dell'applicazione
```

## Installazione e avvio

1. **Installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

3. **Apri il browser** all'indirizzo mostrato nel terminale (solitamente http://localhost:3000)

## Utilizzo

1. **Carica dati di esempio** cliccando il pulsante "Load Sample Data"
2. **Cambia KPI** dal menu a tendina (Speed, Fuel, Distance)
3. **Modifica aggregazione** (Sum o Average)
4. **Regola risoluzione H3** (6-10)
5. **Adatta vista** ai dati con "Fit to Data"

## Build per produzione

```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `dist/`.

## Comandi disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Crea build di produzione
- `npm run preview` - Anteprima della build di produzione
- `npm run serve` - Serve la build sulla porta 3000

## Migrazione da Svelte

L'applicazione originale in Svelte è stata convertita seguendo questi principi:

1. **State Management**: Gli store Svelte sono stati sostituiti con un sistema basato su EventTarget
2. **Reattività**: I reactive statements (`$:`) sono stati convertiti in subscriptions agli eventi
3. **Lifecycle**: `onMount/onDestroy` sono stati sostituiti con metodi di classe
4. **Binding**: I binding Svelte sono stati sostituiti con event listeners manuali

## Personalizzazione

### Aggiungere nuovi KPI

Modifica l'interfaccia `H3DataEntry` in `src/types/index.ts` e aggiungi le opzioni nel select HTML.

### Cambiare la scala colori

Modifica i colori nella funzione `renderHexagons()` della classe `MapManager`.

### Modificare lo stile

Aggiorna le variabili CSS in `src/styles/main.css` per personalizzare l'aspetto.

## API del MapManager

La classe `MapManager` espone i seguenti metodi pubblici:

- `loadSampleData()` - Carica dati di esempio
- `getMap()` - Restituisce l'istanza Leaflet
- `destroy()` - Pulisce risorse e listener

## Contribuire

1. Fork del repository
2. Crea un branch per la feature
3. Commit delle modifiche
4. Push del branch
5. Apri una Pull Request