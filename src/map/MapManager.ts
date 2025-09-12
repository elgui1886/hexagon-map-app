import chroma from 'chroma-js';
import L from 'leaflet';
import * as h3 from 'h3-js';
import type { MapViewState, H3Data } from '../types/index.js';
import { mapViewState, h3Data, currentResolution, filters, appConfig } from '../stores/index.js';

export class MapManager {
  private mapContainer: HTMLElement;
  private map: L.Map | null = null;
  private hexagonLayer: L.LayerGroup | null = null;
  private mapUpdateTimer: number | null = null;
  private initialDataLoaded = false;
  private unsubscribeFunctions: (() => void)[] = [];

  private readonly MAP_UPDATE_DEBOUNCE = 500;

  constructor(mapContainer: HTMLElement) {
    this.mapContainer = mapContainer;
    this.initMap();
    this.setupSubscriptions();
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    // Get initial config from store
    const config = appConfig.get();
    const center = config?.default_map_center || [40.7128, -74.006];
    const zoom = config?.default_map_zoom || 10;

    // Create map
    this.map = L.map(this.mapContainer, {
      center: center as [number, number],
      zoom: zoom,
      zoomControl: true,
      attributionControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Create hexagon layer
    this.hexagonLayer = L.layerGroup().addTo(this.map);

    // Set up event listeners
    this.map.on('moveend', this.handleMapChange.bind(this));
    this.map.on('zoomend', this.handleMapChange.bind(this));

    // Initialize map state
    this.updateMapState();

    console.log('Map initialized:', { center, zoom });
  }

  private setupSubscriptions(): void {
    // Subscribe to h3Data changes
    const unsubH3Data = h3Data.subscribe((data) => {
      this.renderHexagons(data);
    });

    // Subscribe to mapViewState forceFit changes
    const unsubMapView = mapViewState.subscribe((state) => {
      if (state.forceFit) {
        this.fitToHexagons();
      }
    });

    // Subscribe to filter changes
    const unsubFilters = filters.subscribe(() => {
      // Re-render hexagons when filters change
      this.renderHexagons(h3Data.get());
    });

    this.unsubscribeFunctions.push(unsubH3Data, unsubMapView, unsubFilters);
  }

  private handleMapChange(): void {
    if (!this.map) return;

    // Debounce map updates
    if (this.mapUpdateTimer) {
      clearTimeout(this.mapUpdateTimer);
    }

    this.mapUpdateTimer = window.setTimeout(() => {
      this.updateMapState();
    }, this.MAP_UPDATE_DEBOUNCE);
  }

  private updateMapState(): void {
    if (!this.map) return;

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    const newState: MapViewState = {
      center: [center.lat, center.lng],
      zoom: zoom,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }
    };

    mapViewState.set(newState);
    console.log('Map state updated:', newState);
  }

  private renderHexagons(data: H3Data): void {
    if (!this.map || !this.hexagonLayer) return;

    console.log('Rendering hexagons:', Object.keys(data).length);
    this.hexagonLayer.clearLayers();

    const hexagons = Object.keys(data);
    
    // Only fit bounds on very first data load
    if (!this.initialDataLoaded && hexagons.length > 0 && !mapViewState.get()?.bounds) {
      this.fitToHexagons();
      this.initialDataLoaded = true;
    }

    // Process data for visualization
    const values: number[] = [];
    const currentFilters = filters.get();

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
    const scale = chroma.scale(['#00b300', '#ffd700', '#ff0000', '#8b0000'])
      .mode('lch')
      .domain([min, min + (max - min) * 0.25, min + (max - min) * 0.5, max]);

    // Render hexagons
    for (const [h3Index, entries] of Object.entries(data)) {
      try {
        // Convert H3 index to polygon coordinates
        const hexBoundary = h3.cellToBoundary(h3Index);
        const coords = hexBoundary.map(([lat, lng]) => [lat, lng] as [number, number]);

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
          fillOpacity: 0.35
        });

        // Add popup with data
        polygon.bindPopup(`
          <strong>H3 Index:</strong> ${h3Index}<br>
          <strong>Vehicles:</strong> ${Array.from(new Set(entries.map(e => e.vehicle_id))).length}<br>
          <strong>${currentFilters.aggregation === 'sum' ? 'Sum' : 'Average'} of ${currentFilters.kpi}:</strong> ${total.toFixed(2)}
        `);

        this.hexagonLayer.addLayer(polygon);
      } catch (error) {
        console.error('Error rendering hexagon:', h3Index, error);
      }
    }
  }

  private fitToHexagons(): void {
    if (!this.map) return;

    const data = h3Data.get();
    const hexagons = Object.keys(data);

    if (hexagons.length === 0) return;

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    hexagons.forEach(h3Index => {
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
    this.map.fitBounds([
      [minLat, minLng],
      [maxLat, maxLng]
    ], { padding: [50, 50] });

    // Reset forceFit flag
    mapViewState.update(state => ({
      ...state,
      forceFit: false
    }));
  }

  // Load sample data for demonstration
  public loadSampleData(): void {
    // Generate some sample H3 data around New York area
    const sampleData: H3Data = {};
    const centerLat = 40.7128;
    const centerLng = -74.006;
    const resolution = currentResolution.get();

    // Generate hexagons in a grid pattern around the center
    for (let latOffset = -0.1; latOffset <= 0.1; latOffset += 0.02) {
      for (let lngOffset = -0.1; lngOffset <= 0.1; lngOffset += 0.02) {
        try {
          const h3Index = h3.latLngToCell(centerLat + latOffset, centerLng + lngOffset, resolution);
          
          // Generate random sample data
          const vehicleCount = Math.floor(Math.random() * 10) + 1;
          const entries = [];
          
          for (let i = 0; i < vehicleCount; i++) {
            entries.push({
              vehicle_id: `vehicle_${Math.floor(Math.random() * 1000)}`,
              kpis: {
                speed: Math.random() * 60,
                fuel: Math.random() * 100,
                distance: Math.random() * 500
              }
            });
          }
          
          sampleData[h3Index] = entries;
        } catch (error) {
          // Skip invalid coordinates
        }
      }
    }

    h3Data.set(sampleData);
  }

  // Get map instance
  public getMap(): L.Map | null {
    return this.map;
  }

  // Cleanup method
  public destroy(): void {
    if (this.mapUpdateTimer) {
      clearTimeout(this.mapUpdateTimer);
    }
    
    // Unsubscribe from all store subscriptions
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    
    if (this.map) {
      this.map.remove();
    }
  }
}