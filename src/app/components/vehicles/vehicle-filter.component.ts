import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Vehicle {
  id: string;
  name: string;
  color: string;
  selected: boolean;
}

@Component({
  selector: 'app-vehicle-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-filter.component.html',
  styleUrls: ['./vehicle-filter.component.scss']
})
export class VehicleFilterComponent {
  showVehicles = signal(true);
  // Outputs
  readonly vehicleToggled = output<string>();
  readonly allVehiclesToggled = output<boolean>();
  readonly deselectAllClicked = output<void>();

  // Vehicle list with sample data (limited to 10 vehicles)
  readonly vehicles = signal<Vehicle[]>([
    { id: '4532550600', name: '4532550600', color: '#e74c3c', selected: true },
    { id: '4631320935', name: '4631320935', color: '#3498db', selected: true },
    { id: 'alex-quintero', name: 'Alex Quintero', color: '#9b59b6', selected: true },
    { id: 'andyR', name: 'AndyR (Tom Savage2)', color: '#f39c12', selected: true },
    { id: 'angelas-duster', name: "Angela's Duster", color: '#2ecc71', selected: true },
    { id: 'bar-navarro', name: 'Bar (Rosemary Navarro)', color: '#e67e22', selected: true },
    { id: 'barry-mccormack', name: 'Barry McCormack', color: '#1abc9c', selected: true },
    { id: 'bills-focus', name: "Bill's Focus", color: '#34495e', selected: true },
    { id: 'colin-smith', name: 'Colin Smith', color: '#8e44ad', selected: true },
    { id: 'conors-bmw', name: "Conor's BMW", color: '#27ae60', selected: true }
  ]);

  // Computed properties
  readonly allVehiclesSelected = computed(() =>
    this.vehicles().every(vehicle => vehicle.selected)
  );

  readonly selectedCount = computed(() =>
    this.vehicles().filter(vehicle => vehicle.selected).length
  );

  // Methods
  onToggleVehicle(vehicleId: string) {
    this.vehicles.update(vehicles =>
      vehicles.map(vehicle =>
        vehicle.id === vehicleId
          ? { ...vehicle, selected: !vehicle.selected }
          : vehicle
      )
    );
    this.vehicleToggled.emit(vehicleId);
  }
  onToggleAllVehicles() {
    const newSelectionState = !this.allVehiclesSelected();
    this.vehicles.update(vehicles =>
      vehicles.map(vehicle => ({ ...vehicle, selected: newSelectionState }))
    );
    this.allVehiclesToggled.emit(newSelectionState);
  }
  onDeselectAll() {
    this.vehicles.update(vehicles =>
      vehicles.map(vehicle => ({ ...vehicle, selected: false }))
    );
    this.deselectAllClicked.emit();
  }
  toggleVisibility() {
    this.showVehicles.set(!this.showVehicles());
  }
}
