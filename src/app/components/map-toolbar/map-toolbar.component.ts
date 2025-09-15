import { Component, output } from '@angular/core';

export interface MapToolbarAction {
  id: string;
  icon: string;
  tooltip: string;
  action: () => void;
}

@Component({
  selector: 'app-map-toolbar',
  standalone: true,
  templateUrl: './map-toolbar.component.html',
  styleUrl: './map-toolbar.component.scss'
})
export class MapToolbarComponent {
  // Output events
  readonly toolbarAction = output<string>();

  // Toolbar buttons configuration
  readonly toolbarButtons = [
    {
      id: 'user',
      icon: '👤',
      tooltip: 'User Profile'
    },
    {
      id: 'triangle',
      icon: '▲',
      tooltip: 'Triangle Tool'
    },
    {
      id: 'layers',
      icon: '☰',
      tooltip: 'Layers'
    },
    {
      id: 'diamond',
      icon: '◆',
      tooltip: 'Diamond Tool'
    },
    {
      id: 'chart',
      icon: '📈',
      tooltip: 'Charts'
    },
    {
      id: 'fullscreen',
      icon: '⛶',
      tooltip: 'Fullscreen'
    }
  ];

  onButtonClick(buttonId: string): void {
    this.toolbarAction.emit(buttonId);
    console.log('Map toolbar action:', buttonId);
  }
}
