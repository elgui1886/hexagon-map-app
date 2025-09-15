import { Component, inject, ElementRef, viewChild, OnInit, OnDestroy } from '@angular/core';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div #mapContainer class="map"></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .map {
      width: 100%;
      height: 100%;
      position: relative;
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly mapService = inject(MapService);

  // ViewChild for map container
  readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');

  ngOnInit(): void {
    // Initialize map after view is ready
    setTimeout(() => {
      const container = this.mapContainer().nativeElement;
      if (container) {
        this.mapService.initMap(container);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }
}
