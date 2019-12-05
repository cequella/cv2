import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
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
  beachs: string;
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
  image: any;

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
      //style: 'mapbox://styles/jfilipedias/ck3nc19d25gre1cqpyqpdpm4r',
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
    if(this.image == null) {
      let link = 'assets/Mancha 1.png';
      this.map.loadImage(link,
        (error, image) => {
          if (error) throw error;
          this.image = image;
          this.map.addImage("target", this.image);
          this.createOilStain()
        });
    } else {
      this.createOilStain()
    }
  }

  @HostListener('click', ['$event']) onMarkerClick(bla) {
    if(bla.target.id == 'clean') {
      let beachName = bla.target.name;
      let marker = this.data.filter(x => x.name === beachName)[0];

      debugger;
      this.map.removeLayer("target");

      debugger;
      this.data = this.data.filter(x => x.name != beachName);
      this.onContentLoad();
    }
  }

  private createOilStain() {
    var temp = this.data.map(target => this.mapTargetToIcon(target));

    this.map.addLayer({
      id: "target",
      type: "symbol",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: temp
        }
      },
      layout: {
        "icon-image": "target",
        "icon-size": 0.1,
        "icon-allow-overlap": true
      }
    });

    this.map.on('click', "target",
      (event) => {
        let targetInfo = this.map.queryRenderedFeatures(event.point, { layers: ["target"] });
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

    var comparation = "";
    if(occurrence.comparation.length > 0) {
      comparation = "<p><strong>Que equivalem a:</strong><br/>";
      comparation += occurrence.comparation
                                .map(x => `${x.amount} ${x.kind}<br/>`)
                                .reduce((o,c) => o+c);
      comparation += "</p>";
    }

    new mapboxgl.Popup({
      closeButton: false
    }).setLngLat(occurrence.coord)
      .setHTML(`
        <h1>${occurrence.name}</h1>
        <p><strong>Praias afetadas:</strong><br/> ${occurrence.beachs}</p>
        <p><strong>Quantidade:</strong><br/> ${occurrence.weight}</p>
        ${comparation}
        <button id="clean" name="${occurrence.name}">Limpar</button>
        `)
      .addTo(this.map);
  }
}
