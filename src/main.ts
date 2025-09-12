import { MapManager } from './map/MapManager.js';
import { mapViewState, currentResolution, filters } from './stores/index.js';

class HexagonMapApp {
  private mapManager: MapManager | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for DOM to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  private setupApp(): void {
    // Get map container
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Initialize map manager
    this.mapManager = new MapManager(mapContainer);

    // Setup event listeners
    this.setupEventListeners();

    // Setup store subscriptions
    this.setupStoreSubscriptions();

    console.log('Hexagon Map App initialized');
  }

  private setupEventListeners(): void {
    // KPI selection
    const kpiSelect = document.getElementById('kpi-select') as HTMLSelectElement;
    if (kpiSelect) {
      kpiSelect.addEventListener('change', () => {
        filters.update(current => ({
          ...current,
          kpi: kpiSelect.value
        }));
      });
    }

    // Aggregation selection
    const aggregationSelect = document.getElementById('aggregation-select') as HTMLSelectElement;
    if (aggregationSelect) {
      aggregationSelect.addEventListener('change', () => {
        filters.update(current => ({
          ...current,
          aggregation: aggregationSelect.value as 'sum' | 'average'
        }));
      });
    }

    // Resolution selection
    const resolutionSelect = document.getElementById('resolution-select') as HTMLSelectElement;
    if (resolutionSelect) {
      resolutionSelect.addEventListener('change', () => {
        const newResolution = parseInt(resolutionSelect.value);
        currentResolution.set(newResolution);
      });
    }

    // Load sample data button
    const loadSampleDataBtn = document.getElementById('load-sample-data');
    if (loadSampleDataBtn) {
      loadSampleDataBtn.addEventListener('click', () => {
        if (this.mapManager) {
          this.mapManager.loadSampleData();
        }
      });
    }

    // Fit to data button
    const fitToDataBtn = document.getElementById('fit-to-data');
    if (fitToDataBtn) {
      fitToDataBtn.addEventListener('click', () => {
        mapViewState.update(state => ({
          ...state,
          forceFit: true
        }));
      });
    }
  }

  private setupStoreSubscriptions(): void {
    // Update UI when map view state changes
    mapViewState.subscribe((state) => {
      const zoomElement = document.getElementById('current-zoom');
      if (zoomElement) {
        zoomElement.textContent = state.zoom.toFixed(0);
      }
    });

    // Update UI when resolution changes
    currentResolution.subscribe((resolution) => {
      const resolutionElement = document.getElementById('current-resolution');
      if (resolutionElement) {
        resolutionElement.textContent = resolution.toString();
      }
    });

    // Update select elements to match store state
    const currentFilters = filters.get();
    const kpiSelect = document.getElementById('kpi-select') as HTMLSelectElement;
    const aggregationSelect = document.getElementById('aggregation-select') as HTMLSelectElement;
    const resolutionSelect = document.getElementById('resolution-select') as HTMLSelectElement;

    if (kpiSelect) {
      kpiSelect.value = currentFilters.kpi;
    }
    if (aggregationSelect) {
      aggregationSelect.value = currentFilters.aggregation;
    }
    if (resolutionSelect) {
      resolutionSelect.value = currentResolution.get().toString();
    }
  }

  // Public method to get map manager instance
  public getMapManager(): MapManager | null {
    return this.mapManager;
  }

  // Cleanup method
  public destroy(): void {
    if (this.mapManager) {
      this.mapManager.destroy();
    }
  }
}

// Initialize the application
const app = new HexagonMapApp();

// Make app available globally for debugging
(window as any).hexagonMapApp = app;

// Handle page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});

export default app;