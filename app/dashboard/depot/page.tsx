'use client'

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import './mapbox-overrides.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Depot() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const depotCoordinates: mapboxgl.LngLatLike | undefined = [-2.966384, 53.406605];
  const centerCoordinates: mapboxgl.LngLatLike | undefined = [-2.969384, 53.406605];

  useEffect(() => {
    if (mapContainer.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/kieran260/clnmah019006101qy21yxguuo',
        center: centerCoordinates,
        zoom: 15,
      });

      map.on('load', () => {
        map.loadImage(
          'https://img.icons8.com/ios-filled/50/000000/marker.png',
          (error, image) => {
            if (error) throw error;

            if (image) {
              map.addImage('custom-marker', image);

              map.addSource('points', {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
                      'geometry': {
                        'type': 'Point',
                        'coordinates': depotCoordinates,
                      },
                      'properties': {
                        'title': 'Depot',
                      },
                    },
                  ],
                },
              });

              map.addLayer({
                'id': 'points',
                'type': 'symbol',
                'source': 'points',
                'layout': {
                  'icon-image': 'custom-marker',
                  'text-field': ['get', 'title'],
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                  'text-offset': [0, 1.75],
                  'text-anchor': 'top',
                },
              });

              // Add click event to the layer
              map.on('click', 'points', function () {
                map.flyTo({
                  center: depotCoordinates,
                  zoom: 15,
                });
              });
            }
          }
        );
      });

      return () => {
        map.remove();
      };
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto pb-4">Depot</h1>
      </div>

      <div className="relative flex-grow">
        {/* Overlay div */}
        <div className="flex md:absolute md:drop-shadow-xl left-5 top-5 z-40 w-full md:w-[400px] h-[400px] space-y-4 border rounded-md p-4 bg-card">
          {/* Your overlay content here */}
        </div>

        {/* Map container */}
        <div ref={mapContainer} className="invisible md:visible md:absolute top-0 left-0 w-full h-full" />
      </div>
    </div>
  );
}