import { Injectable, signal, computed } from '@angular/core';
import type { AppState, MapViewState, H3Data, Filters, AppConfig } from '../types';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // State signals using Angular 18 signals
  private readonly _mapViewState = signal<MapViewState>({
    center: [40.7128, -74.006],
    zoom: 10
  });

  private readonly _h3Data = signal<H3Data>({});

  private readonly _currentResolution = signal<number>(8);

  private readonly _filters = signal<Filters>({
    kpi: 'speed',
    aggregation: 'sum'
  });

  private readonly _appConfig = signal<AppConfig>({
    default_map_center: [40.7128, -74.006],
    default_map_zoom: 10
  });

  // Public readonly signals for components to consume
  readonly mapViewState = this._mapViewState.asReadonly();
  readonly h3Data = this._h3Data.asReadonly();
  readonly currentResolution = this._currentResolution.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly appConfig = this._appConfig.asReadonly();

  // Computed signals for derived state
  readonly hexagonCount = computed(() => Object.keys(this._h3Data()).length);

  readonly currentKpiData = computed(() => {
    const data = this._h3Data();
    const currentFilters = this._filters();
    const result: Record<string, number> = {};

    for (const [h3Index, entries] of Object.entries(data)) {
      if (entries.length > 0) {
        const total = entries.reduce((sum, entry) => {
          return sum + (entry.kpis[currentFilters.kpi] || 0);
        }, 0);

        result[h3Index] = currentFilters.aggregation === 'average' && entries.length > 0
          ? total / entries.length
          : total;
      }
    }

    return result;
  });

  // Methods to update state
  updateMapViewState(newState: Partial<MapViewState>): void {
    this._mapViewState.update(current => ({ ...current, ...newState }));
  }

  setMapViewState(state: MapViewState): void {
    this._mapViewState.set(state);
  }

  updateH3Data(data: H3Data): void {
    this._h3Data.set(data);
  }

  updateFilters(filters: Partial<Filters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  setFilters(filters: Filters): void {
    this._filters.set(filters);
  }

  updateCurrentResolution(resolution: number): void {
    this._currentResolution.set(resolution);
  }

  updateAppConfig(config: Partial<AppConfig>): void {
    this._appConfig.update(current => ({ ...current, ...config }));
  }

  // Get complete state (for compatibility if needed)
  getState(): AppState {
    return {
      mapViewState: this._mapViewState(),
      h3Data: this._h3Data(),
      currentResolution: this._currentResolution(),
      filters: this._filters(),
      appConfig: this._appConfig()
    };
  }

  // Reset methods
  resetToDefaults(): void {
    const config = this._appConfig();
    this._mapViewState.set({
      center: config.default_map_center,
      zoom: config.default_map_zoom
    });
    this._h3Data.set({});
    this._currentResolution.set(8);
    this._filters.set({
      kpi: 'speed',
      aggregation: 'sum'
    });
  }
}
