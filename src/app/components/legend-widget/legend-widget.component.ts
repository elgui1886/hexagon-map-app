import { Component } from '@angular/core';

export interface LegendItem {
  id: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-legend-widget',
  standalone: true,
  templateUrl: './legend-widget.component.html',
  styleUrl: './legend-widget.component.scss'
})
export class LegendWidgetComponent {
  // Widget title and description
  readonly title = 'Legenda';
  readonly description = 'Little explanation for the user';

  // Legend items
  readonly legendItems: LegendItem[] = [
    { id: 'speeding', label: 'Speeding', color: '#dc3545' },
    { id: 'idle', label: 'Idle', color: '#fd7e14' },
    { id: 'driving', label: 'Driving', color: '#6c757d' }
  ];
}
