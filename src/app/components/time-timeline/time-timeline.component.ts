import { Component, output, signal } from '@angular/core';

export interface TimelineOption {
  id: string;
  label: string;
  value: number; // hours relative to now
  isActive?: boolean;
}

@Component({
  selector: 'app-time-timeline',
  standalone: true,
  templateUrl: './time-timeline.component.html',
  styleUrl: './time-timeline.component.scss'
})
export class TimeTimelineComponent {
  // Output events
  readonly timeSelected = output<number>();

  // Current selected time (0 = Now)
  readonly selectedTime = signal<number>(0);

  // Timeline options
  readonly timelineOptions: TimelineOption[] = [
    { id: 'minus24h', label: '-24h', value: -24 },
    { id: 'minus16h', label: '-16h', value: -16 },
    { id: 'minus8h', label: '-8h', value: -8 },
    { id: 'now', label: 'Now', value: 0 },
    { id: 'plus8h', label: '+8h', value: 8 },
    { id: 'plus16h', label: '+16h', value: 16 },
    { id: 'plus24h', label: '+24h', value: 24 }
  ];

  onTimeSelect(option: TimelineOption): void {
    this.selectedTime.set(option.value);
    this.timeSelected.emit(option.value);
    console.log('Time selected:', option.label, option.value);
  }

  isSelected(option: TimelineOption): boolean {
    return this.selectedTime() === option.value;
  }
}