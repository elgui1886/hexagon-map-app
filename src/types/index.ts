// Types for map state and data structures
export interface MapViewState {
  center: [number, number];
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  forceFit?: boolean;
}

// Configuration for the application
export interface AppConfig {
  default_map_center: [number, number];
  default_map_zoom: number;
}

// H3 hexagon data entry
export interface H3DataEntry {
  vehicle_id: string;
  kpis: Record<string, number>;
}

// H3 data structure - maps H3 index to array of entries
export type H3Data = Record<string, H3DataEntry[]>;

// Filters for data visualization
export interface Filters {
  kpi: string;
  aggregation: 'sum' | 'average';
}

// State interface for the application
export interface AppState {
  mapViewState: MapViewState;
  h3Data: H3Data;
  currentResolution: number;
  filters: Filters;
  appConfig: AppConfig;
}

// Event types for state updates
export type StateEventType = 'map-view-updated' | 'h3-data-updated' | 'filters-updated' | 'resolution-updated';

export interface StateEvent {
  type: StateEventType;
  data: any;
}