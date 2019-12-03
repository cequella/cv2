import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import mapboxgl from 'mapbox-gl';
import ZoomControl from 'mapbox-gl-controls/lib/zoom';

export class Tuple {
  kind: string;
  amount: number;
}
export class Occurrence {
  comparation: Tuple[];
  coord: number[];
  dead: Tuple[];
  name: string;
  weight: number;
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.sass']
})
export class HomePageComponent implements OnInit, AfterViewInit {
  @ViewChild('featureScreen', {static: false}) featureScreen: ElementRef;

  map: any;
  popup: any;

  data: Occurrence[];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    let getter = this.http.get('assets/target.json');
    let subscriber = getter.subscribe(
        (content: Occurrence[]) => {
          this.data = content;
          debugger;
          subscriber.unsubscribe();
        }
    )
  }

  ngAfterViewInit() {
    mapboxgl.accessToken = environment.apiKey;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [-38.7499, -3.6196],
      zoom: 7,
      minZoom: 12,
      maxZoom: 18,
    });

    this.popup = new mapboxgl.Popup({
      closeButton: false
    });

    this.map.addControl(new ZoomControl(), 'top-right');
    this.map.on('mousemove', (event) => this.onMouseMove(event));
    this.map.on('load', () => this.onLoad());

    //this.createOilMarker(this.data[0]);
  }

  onMouseMove(event) {
  }

  onLoad() {
    let link = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png';
    this.map.loadImage(link,
      (error, image) => {
        if (error) throw error;
        this.createOilStain(image, "target")
      });
  }

  private createOilMarker(occurrence: Occurrence) {
    let comparation = occurrence.comparation
                                  .map(x => "<il>"+x.amount+" "+x.kind+"</il>")
                                  .reduce((o,c) => o+c);
    this.popup
      .setLngLat(occurrence.coord)
      .setHTML(`
        <h1>${occurrence.name}</h1>
        <p><strong>Quantidade:</strong> ${occurrence.weight} ton</p>
        <p><strong>Que equivalem a:</strong></p>
        <ul>
        ${comparation}
        </ul>
        <button>Limpar</button>
        `)
      .addTo(this.map);
  }

  private createOilStain(image, layerName) {
    var temp = this.data.map(target => this.mapTargetToIcon(target));

    this.map.addImage(layerName, image);
    this.map.addLayer({
      id: layerName,
      type: "symbol",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: temp
        }
      },
      layout: {
        "icon-image": layerName,
        "icon-size": 0.25,
        "icon-allow-overlap": true
      }
    });

    this.map.on('click', layerName,
      (event) => {
        let a = this.map.queryRenderedFeatures(event.point, { layers: [layerName] });
        console.log(a[0]);
        //console.log(event);
    });
  }

  private mapTargetToIcon(target: Occurrence) {
    return {
      type: "Feature",
      properties: <Occurrence>target,
      geometry: {
        type: "Point",
        coordinates: target.coord
      },
    };
  }
}
