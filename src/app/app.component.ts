import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from './services/state.service';
import { MapService } from './services/map.service';
import { MapComponent } from './components/map/map.component';
import { VehicleFilterComponent } from './components/vehicles/vehicle-filter.component';
import { MapToolbarComponent } from './components/map-toolbar/map-toolbar.component';
import { TimeTimelineComponent } from './components/time-timeline/time-timeline.component';
import { TitleWidgetComponent } from './components/title-widget/title-widget.component';
import { LegendWidgetComponent } from './components/legend-widget/legend-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent, VehicleFilterComponent, MapToolbarComponent, TimeTimelineComponent, TitleWidgetComponent, LegendWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Injected services
  readonly stateService = inject(StateService);
  readonly mapService = inject(MapService);

  // Component properties
  readonly title = signal('Hexagon Map');

  // KPI options for dropdown
  readonly kpiOptions = signal([
    { value: 'speed', label: 'Speed' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'distance', label: 'Distance' }
  ]);

  // Aggregation options for dropdown
  readonly aggregationOptions = signal([
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' }
  ]);

  // Resolution options for dropdown
  readonly resolutionOptions = signal([
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' }
  ]);

  // Sample vehicles for left sidebar
  readonly vehicles = signal([
    { id: 'vehicle1', name: 'Sample Vehicle 1', color: '#ff4444', selected: true },
    { id: 'vehicle2', name: 'Sample Vehicle 2', color: '#44ff44', selected: true },
    { id: 'vehicle3', name: 'Sample Vehicle 3', color: '#4444ff', selected: true }
  ]);

  // Legend items for right sidebar
  readonly legendItems = signal([
    { color: '#ff4444', label: 'Speeding' },
    { color: '#ffaa00', label: 'Idling' },
    { color: '#44aa44', label: 'Driving' }
  ]);

  // Computed properties
  readonly currentZoom = computed(() =>
    this.stateService.mapViewState().zoom?.toFixed(0) || '10'
  );

  readonly hexagonCount = computed(() =>
    this.stateService.hexagonCount()
  );

  readonly allVehiclesSelected = computed(() =>
    this.vehicles().every(v => v.selected)
  );

  // Event handlers
  onKpiChange(kpi: string): void {
    this.stateService.updateFilters({ kpi });
  }

  onAggregationChange(aggregation: 'sum' | 'average'): void {
    this.stateService.updateFilters({ aggregation });
  }

  onResolutionChange(resolution: number): void {
    this.stateService.updateCurrentResolution(resolution);
  }

  onLoadSampleData(): void {
    this.mapService.loadSampleData();
  }

  onFitToData(): void {
    this.mapService.fitToData();
  }

  onToggleAllVehicles(): void {
    console.log('All vehicles toggled from vehicle filter component');
  }

  onToggleVehicle(vehicleId: string): void {
    console.log('Vehicle toggled:', vehicleId);
  }

  onDeselectAllVehicles(): void {
    console.log('All vehicles deselected from vehicle filter component');
  }

  onMapToolbarAction(action: string): void {
    console.log('Map toolbar action:', action);
    // Handle different toolbar actions
    switch (action) {
      case 'user':
        console.log('User profile clicked');
        break;
      case 'triangle':
        console.log('Triangle tool clicked');
        break;
      case 'layers':
        console.log('Layers clicked');
        break;
      case 'diamond':
        console.log('Diamond tool clicked');
        break;
      case 'chart':
        console.log('Charts clicked');
        break;
      case 'fullscreen':
        console.log('Fullscreen clicked');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  onTimeSelected(hours: number): void {
    console.log('Time selected:', hours, 'hours from now');
    // Here you can update the application state based on selected time
    // For example, filter data or update the map display
  }

  onWidgetOptionToggled(optionId: string): void {
    console.log('Widget option toggled:', optionId);
    // Handle widget option changes
    // For example, toggle map layers or update display settings
  }
}
