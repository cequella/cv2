import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

import mapboxgl from 'mapbox-gl';
import ZoomControl from 'mapbox-gl-controls/lib/zoom';

export class Tuple {
  kind: string;
  amount: number;
}
export class Occurrence {
  name: string;
  coord: number[];
  weight: string;
  dead: Tuple[];
  comparation: Tuple[];
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.sass']
})
export class HomePageComponent implements OnInit, AfterViewInit {
  @ViewChild('featureScreen', {static: false}) featureScreen: ElementRef;

  map: any;

  data: Occurrence[];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    let getter = this.http.get('assets/target.json').toPromise().then(
      (content) => {
        this.data = <Occurrence[]>content;
        this.onContentLoad();
      }
    ).catch(
      (err) => console.log(err)
    );
  }

  ngAfterViewInit() {
    mapboxgl.accessToken = environment.apiKey;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [-38.7499, -3.6196],
      zoom: 7,
      minZoom: 0,
      maxZoom: 18,
    });

    this.map.addControl(new ZoomControl(), 'top-right');
    this.map.on('mousemove', (event) => this.onMouseMove(event));
    this.map.on('load', () => this.onLoad());
  }

  onMouseMove(event) {
  }

  onLoad() {
  }

  onContentLoad() {
    let link = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png';
    this.map.loadImage(link,
      (error, image) => {
        if (error) throw error;
        this.createOilStain(image, "target")
      });
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
        let targetInfo = this.map.queryRenderedFeatures(event.point, { layers: [layerName] });
        this.showOilContent(targetInfo[0].properties.marker);
    });
  }

  private mapTargetToIcon(target: Occurrence) {
    return {
      type: "Feature",
      properties: {
        marker: target
      },
      geometry: {
        type: "Point",
        coordinates: target.coord
      },
    };
  }

  private showOilContent(markerData) {
    let occurrence = <Occurrence>JSON.parse(markerData); // Gambiarra

    console.log(occurrence);

    var comparation = "";
    if(occurrence.comparation.length > 0) {
      comparation = "<p><strong>Que equivalem a:</strong></p><ul>";
      comparation += occurrence.comparation
                                .map(x => "<il>"+x.amount+" "+x.kind+"</il>")
                                .reduce((o,c) => o+c);
      comparation += "</ul>";
    }

    new mapboxgl.Popup({
      closeButton: false
    }).setLngLat(occurrence.coord)
      .setHTML(`
        <h1>${occurrence.name}</h1>
        <p><strong>Quantidade:</strong> ${occurrence.weight}</p>
        ${comparation}
        <button>Limpar</button>
        `)
      .addTo(this.map);
  }
}
