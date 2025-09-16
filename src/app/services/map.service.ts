import { Injectable, inject, effect, signal, untracked } from '@angular/core';
import chroma from 'chroma-js';
import L from 'leaflet';
import * as h3 from 'h3-js';
import type { MapViewState, H3Data } from '../types';
import { StateService } from './state.service';

// Fix for Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

@Injectable({
  providedIn: 'root',
})
export class MapService {
  // Injected services
  private readonly stateService = inject(StateService);

  // Private properties
  private map: L.Map | null = null;
  private hexagonLayer: L.LayerGroup | null = null;
  private mapUpdateTimer: number | null = null;
  private initialDataLoaded = false;
  private rawDataCache: H3Data = {}; // Cache dei dati originali a risoluzione massima

  // Private readonly properties
  private readonly MAP_UPDATE_DEBOUNCE = 500;

  // Signals for internal state
  private readonly _isInitialized = signal(false);

  // Readonly signals
  readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    // Set up effects to react to state changes
    this._setupEffects();
  }

  initMap(mapContainer: HTMLElement): void {
    if (!mapContainer || this._isInitialized()) {
      console.log('Map container not available or already initialized');
      return;
    }

    console.log('Initializing map with container:', mapContainer);

    // Get initial config from state service
    const config = this.stateService.appConfig();
    const center = config.default_map_center;
    const zoom = config.default_map_zoom;

    try {
      // Create map
      this.map = L.map(mapContainer, {
        center: center as [number, number],
        zoom: zoom,
        zoomControl: false, // Disable default zoom control
        attributionControl: true,
      });

      console.log('Map instance created:', this.map);

      // Add custom zoom control in bottom-right position
      L.control
        .zoom({
          position: 'bottomright',
        })
        .addTo(this.map);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(this.map);

      console.log('Tile layer added');

      // Create hexagon layer
      this.hexagonLayer = L.layerGroup().addTo(this.map);

      // Set up event listeners
      this.map.on('moveend', this._handleMapChange.bind(this));
      this.map.on('zoomend', this._handleMapChange.bind(this));

      // Initialize map state
      this._updateMapState();
      this._isInitialized.set(true);

      console.log('Map initialized successfully:', { center, zoom });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
  // Load sample data for demonstration
  loadSampleData(): void {
    if (!(this.rawDataCache && Object.keys(this.rawDataCache).length > 0)) {
      // Genera dati UNA SOLA VOLTA alla risoluzione massima (15)
      const rawData: H3Data = {};
      const centerLat = 40.7128;
      const centerLng = -74.006;
      const maxResolution = 10; // Risoluzione massima per massimo dettaglio

      console.log('Loading raw data at max resolution:', maxResolution);

      // Generate hexagons in a dense grid pattern around the center
      for (let latOffset = -0.1; latOffset <= 0.1; latOffset += 0.005) {
        for (let lngOffset = -0.1; lngOffset <= 0.1; lngOffset += 0.005) {
          try {
            const h3Index = h3.latLngToCell(
              centerLat + latOffset,
              centerLng + lngOffset,
              maxResolution
            );

            // Initialize array if not exists
            if (!rawData[h3Index]) {
              rawData[h3Index] = [];
            }

            // Generate random sample data (fewer vehicles per small hexagon)
            const vehicleCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < vehicleCount; i++) {
              rawData[h3Index].push({
                vehicle_id: `vehicle_${Math.floor(
                  Math.random() * 1000
                )}_${h3Index.slice(-4)}`,
                kpis: {
                  speed: Math.random() * 60,
                  fuel: Math.random() * 100,
                  distance: Math.random() * 500,
                },
              });
            }
          } catch (error) {
            // Skip invalid coordinates
          }
        }
      }

      // Salva i dati grezzi nella cache
      this.rawDataCache = rawData;
    }

    // Aggrega i dati alla risoluzione corrente e aggiorna lo stato
    const currentResolution = this.stateService.currentResolution();
    console.log('Aggregating initial data to resolution:', currentResolution);
    const aggregatedData = this._aggregateDataToResolution(
      this.rawDataCache,
      currentResolution
    );

    this.stateService.updateH3Data(aggregatedData);
  }
  // Fit to data method
  fitToData(): void {
    this.stateService.updateMapViewState({ forceFit: true });
  }
  // Get map instance (for external access if needed)
  getMap(): L.Map | null {
    return this.map;
  }
  // Cleanup method
  destroy(): void {
    if (this.mapUpdateTimer) {
      clearTimeout(this.mapUpdateTimer);
    }

    if (this.map) {
      this.map.remove();
    }

    this._isInitialized.set(false);
  }

  private _handleMapChange(): void {
    if (!this.map) return;

    // Log current zoom level
    const currentZoom = this.map.getZoom();
    console.log('Map change detected - Current zoom level:', currentZoom);

    // Calculate optimal H3 resolution based on zoom level
    const optimalH3Resolution = this._calculateOptimalH3Resolution(currentZoom);
    const currentH3Resolution = this.stateService.currentResolution();

    console.log('H3 Resolution analysis:', {
      zoom: currentZoom,
      currentH3Resolution,
      optimalH3Resolution,
      needsUpdate: optimalH3Resolution !== currentH3Resolution,
    });

    // Update H3 resolution if it should change
    if (optimalH3Resolution !== currentH3Resolution) {
      console.log(
        `Updating H3 resolution: ${currentH3Resolution} → ${optimalH3Resolution}`
      );
      this.stateService.updateCurrentResolution(optimalH3Resolution);
    }

    // Debounce map updates
    if (this.mapUpdateTimer) {
      clearTimeout(this.mapUpdateTimer);
    }

    this.mapUpdateTimer = window.setTimeout(() => {
      this._updateMapState();
    }, this.MAP_UPDATE_DEBOUNCE);
  }
  /**
   * Calculate optimal H3 resolution based on map zoom level
   * Higher zoom = higher H3 resolution (smaller hexagons)
   *
   * Mapping strategy:
   * - Zoom > 16: H3 res 10 (~65m hexagons) - Street level
   * - Zoom 13-16: H3 res 9 (~174m hexagons) - Block level
   * - Zoom 10-12: H3 res 8 (~461m hexagons) - Neighborhood
   * - Zoom 7-9: H3 res 7 (~1.22km hexagons) - District
   * - Zoom < 7: H3 res 6 (~3.23km hexagons) - City level
   */
  private _calculateOptimalH3Resolution(zoomLevel: number): number {
    let resolution: number;
    let description: string;

    if (zoomLevel > 16) {
      resolution = 10;
      description = 'Street level (~65m)';
    } else if (zoomLevel >= 13) {
      resolution = 9;
      description = 'Block level (~174m)';
    } else if (zoomLevel >= 10) {
      resolution = 8;
      description = 'Neighborhood (~461m)';
    } else if (zoomLevel >= 7) {
      resolution = 7;
      description = 'District (~1.22km)';
    } else {
      resolution = 6;
      description = 'City level (~3.23km)';
    }

    console.log(
      `Zoom ${zoomLevel.toFixed(
        1
      )} → H3 resolution ${resolution} (${description})`
    );
    return resolution;
  }
  private _updateMapState(): void {
    if (!this.map) return;

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    console.log('Map state update:', {
      zoom: zoom,
      zoomRange: `${this.map.getMinZoom()} - ${this.map.getMaxZoom()}`,
      center: [center.lat.toFixed(4), center.lng.toFixed(4)],
      boundsSize: {
        latSpan: (bounds.getNorth() - bounds.getSouth()).toFixed(4),
        lngSpan: (bounds.getEast() - bounds.getWest()).toFixed(4),
      },
    });

    const newState: MapViewState = {
      center: [center.lat, center.lng],
      zoom: zoom,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    };

    this.stateService.setMapViewState(newState);
  }
  private _renderHexagons(data: H3Data): void {
    if (!this.map || !this.hexagonLayer) return;

    console.log('Rendering hexagons:', Object.keys(data).length);
    this.hexagonLayer.clearLayers();

    const hexagons = Object.keys(data);

    // Only fit bounds on very first data load
    if (
      !this.initialDataLoaded &&
      hexagons.length > 0 &&
      !this.stateService.mapViewState()?.bounds
    ) {
      this._fitToHexagons();
      this.initialDataLoaded = true;
    }

    // Process data for visualization
    const values: number[] = [];
    const currentFilters = this.stateService.filters();

    for (const [h3Index, entries] of Object.entries(data)) {
      if (entries.length > 0) {
        try {
          // Get hexagon center
          const [lat, lng] = h3.cellToLatLng(h3Index);
          // Check if hexagon is within current map bounds
          if (this.map && this.map.getBounds().contains([lat, lng])) {
            const total = entries.reduce((sum, entry) => {
              return sum + (entry.kpis[currentFilters.kpi] || 0);
            }, 0);
            values.push(total);
          }
        } catch (error) {
          console.error('Error processing hexagon:', h3Index, error);
        }
      }
    }

    if (values.length === 0) return;

    // Create color scale based on data range
    const min = Math.min(...values);
    const max = Math.max(...values);
    console.log('Value range:', { min, max, totalValues: values.length });

    // Log distribution in quartiles
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q2 = sortedValues[Math.floor(sortedValues.length * 0.5)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    console.log('Value distribution:', { q1, q2, q3 });

    // Create color scale with better distribution
    const scale = chroma
      .scale(['#00b300', '#ffd700', '#ff0000', '#8b0000'])
      .mode('lch')
      .domain([min, min + (max - min) * 0.25, min + (max - min) * 0.5, max]);

    // Render hexagons
    for (const [h3Index, entries] of Object.entries(data)) {
      try {
        // Convert H3 index to polygon coordinates
        const hexBoundary = h3.cellToBoundary(h3Index);
        const coords = hexBoundary.map(
          ([lat, lng]) => [lat, lng] as [number, number]
        );

        // Calculate color based on KPI values
        let total = entries.reduce((sum, entry) => {
          return sum + (entry.kpis[currentFilters.kpi] || 0);
        }, 0);

        // Apply aggregation
        if (currentFilters.aggregation === 'average' && entries.length > 0) {
          total = total / entries.length;
        }

        // Create polygon with styling
        const polygon = L.polygon(coords, {
          color: scale(total).hex(),
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.35,
        });

        // Add popup with data
        polygon.bindPopup(`
          <strong>H3 Index:</strong> ${h3Index}<br>
          <strong>Vehicles:</strong> ${
            Array.from(new Set(entries.map((e) => e.vehicle_id))).length
          }<br>
          <strong>${
            currentFilters.aggregation === 'sum' ? 'Sum' : 'Average'
          } of ${currentFilters.kpi}:</strong> ${total.toFixed(2)}
        `);

        this.hexagonLayer!.addLayer(polygon);
      } catch (error) {
        console.error('Error rendering hexagon:', h3Index, error);
      }
    }
  }
  /**
   * Fit map view to current hexagon bounds
   */
  private _fitToHexagons(): void {
    if (!this.map) return;

    const data = this.stateService.h3Data();
    const hexagons = Object.keys(data);

    if (hexagons.length === 0) return;

    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;

    hexagons.forEach((h3Index) => {
      try {
        const boundary = h3.cellToBoundary(h3Index);
        boundary.forEach(([lat, lng]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      } catch (error) {
        console.error('Error processing hexagon bounds:', h3Index, error);
      }
    });

    // Fit map to hexagon bounds
    this.map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [50, 50] }
    );

    // Reset forceFit flag
    this.stateService.updateMapViewState({ forceFit: false });
  }
  // Aggregate H3 data from high resolution to target resolution
  private _aggregateDataToResolution(
    rawData: H3Data,
    targetResolution: number
  ): H3Data {
    const aggregatedData: H3Data = {};

    console.log(
      `Aggregating from resolution ${h3.getResolution(
        Object.keys(rawData)[0]
      )} to ${targetResolution}`
    );

    for (const [h3Index, entries] of Object.entries(rawData)) {
      try {
        // Get current resolution of this hexagon
        const currentResolution = h3.getResolution(h3Index);

        let targetIndex: string;

        if (currentResolution === targetResolution) {
          // Already at target resolution
          targetIndex = h3Index;
        } else if (currentResolution > targetResolution) {
          // Aggregate up (small to large hexagons) - questo è il caso normale
          targetIndex = h3.cellToParent(h3Index, targetResolution);
        } else {
          // currentResolution < targetResolution
          // Non possiamo disaggregare (large to small) senza dati più dettagliati
          // Manteniamo l'esagono corrente
          targetIndex = h3Index;
          console.warn(
            `Cannot disaggregate from resolution ${currentResolution} to ${targetResolution} for hexagon ${h3Index}`
          );
        }

        // Initialize array if not exists
        if (!aggregatedData[targetIndex]) {
          aggregatedData[targetIndex] = [];
        }

        // Add all entries to the target hexagon
        aggregatedData[targetIndex].push(...entries);
      } catch (error) {
        console.error('Error aggregating hexagon:', h3Index, error);
        // Keep original if aggregation fails
        if (!aggregatedData[h3Index]) {
          aggregatedData[h3Index] = [];
        }
        aggregatedData[h3Index].push(...entries);
      }
    }

    const originalCount = Object.keys(rawData).length;
    const aggregatedCount = Object.keys(aggregatedData).length;
    console.log(
      `Aggregation complete: ${originalCount} → ${aggregatedCount} hexagons`
    );

    return aggregatedData;
  }
    private _setupEffects(): void {
    // React to h3Data changes or filters changes
    effect(() => {
      const data = this.stateService.h3Data();
      const isInitialized = untracked(this._isInitialized);
      const filters = this.stateService.filters();

      if (isInitialized) {
        this._renderHexagons(data);
      } else {
        console.log('Map not initialized yet, skipping render');
      }
    });

    // React to mapViewState forceFit changes
    effect(
      () => {
        const state = this.stateService.mapViewState();
        const isInitialized = untracked(this._isInitialized);
        if (state.forceFit && isInitialized) {
          this._fitToHexagons();
        }
      },
      { allowSignalWrites: true }
    );

    // React to resolution changes - regenerate data from cache
    effect(
      () => {
        const currentResolution = this.stateService.currentResolution();
        const isInitialized = untracked(this._isInitialized);
        const cacheSize = Object.keys(this.rawDataCache).length;

        if (isInitialized && cacheSize > 0) {
          const startTime = performance.now();
          const aggregatedData = this._aggregateDataToResolution(
            this.rawDataCache,
            currentResolution
          );
          this.stateService.updateH3Data(aggregatedData);
        }
      },
      { allowSignalWrites: true }
    );
  }
}
