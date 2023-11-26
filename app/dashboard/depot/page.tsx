'use client'

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import './mapbox-overrides.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Depot() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const depotCoordinates: mapboxgl.LngLatLike | undefined = [-2.966384, 53.406605];
  const centerCoordinates: mapboxgl.LngLatLike | undefined = [-2.966384, 53.406605];

  useEffect(() => {
    if (mapContainer.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/kieran260/clnnnsf1m00al01o37ltmbokb',
        center: centerCoordinates,
        zoom: 16,
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
                  center: centerCoordinates,
                  zoom: 16,
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

      {/* Add depot form if depot does not exist */}

      {/* conditionally render if depot exists */}
      <div className="flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12">
              <p className="text-muted-foreground font-medium text-sm m-2">Information</p>
            </div>
            <div className="border rounded-t-none rounded-md border-divider h-[450px] flex gap-2 flex-col">
              <div className="flex flex-col items-start gap-2 py-2 px-5">
                <h3 className="text-muted-foreground text-sm font-medium mt-4">Depot Name</h3>
                <div>
                  Depot 1
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 py-2 px-5">
                <h3 className="text-muted-foreground text-sm font-medium">Store</h3>
                <div>
                  Store LTD
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 py-2 px-5">
                <h3 className="text-muted-foreground text-sm font-medium">Location</h3>
                <div>
                  Depot Location, 15 Location, L1 2AB
                </div>
              </div>

            </div>
          </div>

          <div>
            <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12">
              <p className="text-muted-foreground text-sm font-medium m-2">Location</p>
            </div>
            <div className="border rounded-t-none rounded-md border-divider h-[450px]">
              <div ref={mapContainer} className="w-full h-full" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}