import type { AppState, StateEventType, MapViewState, H3Data, Filters, AppConfig } from '../types/index.js';

// Simple state management system using EventTarget for reactivity
export class StateManager extends EventTarget {
  private state: AppState;

  constructor() {
    super();
    
    // Initialize default state
    this.state = {
      mapViewState: {
        center: [40.7128, -74.006],
        zoom: 10
      },
      h3Data: {},
      currentResolution: 8,
      filters: {
        kpi: 'speed',
        aggregation: 'sum'
      },
      appConfig: {
        default_map_center: [40.7128, -74.006],
        default_map_zoom: 10
      }
    };
  }

  // Get current state
  getState(): AppState {
    return { ...this.state };
  }

  // Update map view state
  updateMapViewState(newState: Partial<MapViewState>): void {
    this.state.mapViewState = { ...this.state.mapViewState, ...newState };
    this.emit('map-view-updated', this.state.mapViewState);
  }

  // Update H3 data
  updateH3Data(data: H3Data): void {
    this.state.h3Data = data;
    this.emit('h3-data-updated', data);
  }

  // Update filters
  updateFilters(filters: Partial<Filters>): void {
    this.state.filters = { ...this.state.filters, ...filters };
    this.emit('filters-updated', this.state.filters);
  }

  // Update current resolution
  updateCurrentResolution(resolution: number): void {
    this.state.currentResolution = resolution;
    this.emit('resolution-updated', resolution);
  }

  // Update app config
  updateAppConfig(config: Partial<AppConfig>): void {
    this.state.appConfig = { ...this.state.appConfig, ...config };
  }

  // Emit custom events
  private emit(type: StateEventType, data: any): void {
    const event = new CustomEvent(type, { detail: data });
    this.dispatchEvent(event);
  }

  // Subscribe to state changes
  subscribe(type: StateEventType, callback: (data: any) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    this.addEventListener(type, handler);

    // Return unsubscribe function
    return () => {
      this.removeEventListener(type, handler);
    };
  }
}

// Global state manager instance
export const stateManager = new StateManager();

// Convenience functions to match Svelte store pattern
export const mapViewState = {
  get: () => stateManager.getState().mapViewState,
  set: (value: MapViewState) => stateManager.updateMapViewState(value),
  update: (updater: (state: MapViewState) => MapViewState) => {
    const current = stateManager.getState().mapViewState;
    const updated = updater(current);
    stateManager.updateMapViewState(updated);
  },
  subscribe: (callback: (state: MapViewState) => void) => {
    // Call immediately with current state
    callback(stateManager.getState().mapViewState);
    return stateManager.subscribe('map-view-updated', callback);
  }
};

export const h3Data = {
  get: () => stateManager.getState().h3Data,
  set: (value: H3Data) => stateManager.updateH3Data(value),
  subscribe: (callback: (data: H3Data) => void) => {
    callback(stateManager.getState().h3Data);
    return stateManager.subscribe('h3-data-updated', callback);
  }
};

export const currentResolution = {
  get: () => stateManager.getState().currentResolution,
  set: (value: number) => stateManager.updateCurrentResolution(value),
  subscribe: (callback: (resolution: number) => void) => {
    callback(stateManager.getState().currentResolution);
    return stateManager.subscribe('resolution-updated', callback);
  }
};

export const filters = {
  get: () => stateManager.getState().filters,
  set: (value: Filters) => stateManager.updateFilters(value),
  update: (updater: (filters: Filters) => Filters) => {
    const current = stateManager.getState().filters;
    const updated = updater(current);
    stateManager.updateFilters(updated);
  },
  subscribe: (callback: (filters: Filters) => void) => {
    callback(stateManager.getState().filters);
    return stateManager.subscribe('filters-updated', callback);
  }
};

export const appConfig = {
  get: () => stateManager.getState().appConfig,
  set: (value: AppConfig) => stateManager.updateAppConfig(value),
  subscribe: (callback: (config: AppConfig) => void) => {
    callback(stateManager.getState().appConfig);
    return () => {}; // App config doesn't change often, so no real subscription needed
  }
};