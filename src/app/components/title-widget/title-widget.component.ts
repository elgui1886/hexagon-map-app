import { Component, output } from '@angular/core';

export interface WidgetOption {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-title-widget',
  standalone: true,
  templateUrl: './title-widget.component.html',
  styleUrl: './title-widget.component.scss'
})
export class TitleWidgetComponent {
  // Output events
  readonly optionToggled = output<string>();

  // Widget title and description
  readonly title = 'Title widget';
  readonly description = 'Little explanation for the user';

  // Widget options
  readonly widgetOptions: WidgetOption[] = [
    { id: 'vehicle-path', label: 'Vehicle Path (Vehicle history)', selected: true },
    { id: 'vehicle-speeding', label: 'Vehicle speeding', selected: false }
  ];

  readonly sectionTitle = 'AI Data insights';
  readonly sectionDescription = 'Little explanation for the user';

  readonly additionalOptions: WidgetOption[] = [
    { id: 'roadside-inspections', label: 'Roadside Inspections provision (FMCSA)', selected: false }
  ];

  onOptionToggle(optionId: string): void {
    // Find and toggle the option
    const option = [...this.widgetOptions, ...this.additionalOptions].find(opt => opt.id === optionId);
    if (option) {
      option.selected = !option.selected;
      this.optionToggled.emit(optionId);
      console.log('Widget option toggled:', optionId, option.selected);
    }
  }
}
