import React, { useState } from 'react';
import {
    AdvancedMarker,
    InfoWindow,
    Pin,
    useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { FaHome, FaWarehouse } from 'react-icons/fa';
import { Package } from '@/types/db/Package';


interface MarkerWithInfowindowProps {
    lat: number;
    lng: number;
    title: string;
    depot?: boolean;
    pkg?: Package;
}

const MarkerWithInfowindow: React.FC<MarkerWithInfowindowProps> = ({
    lat,
    lng,
    title,
    depot,
    pkg
}) => {
    const [infowindowOpen, setInfowindowOpen] = useState(false);
    const [markerRef, marker] = useAdvancedMarkerRef();

    return (
        <>
            {depot == true &&
                <AdvancedMarker
                    ref={markerRef}
                    onClick={() => setInfowindowOpen(true)}
                    position={{ lat: lat, lng: lng }}
                    title={title}
                >
                    <Pin background={'#50c1a0'} borderColor={'#e4e4e7'} scale={1.4}>
                        <FaWarehouse size={18} />
                    </Pin>
                </AdvancedMarker>
            }
            {depot == false &&
                <AdvancedMarker
                    ref={markerRef}
                    onClick={() => setInfowindowOpen(true)}
                    position={{ lat: lat, lng: lng }}
                    title={title}
                >
                    <Pin scale={1.2}>
                        <FaHome size={18} />
                    </Pin>
                </AdvancedMarker>
            }


            {infowindowOpen && (depot == false) && (pkg) && (
                <InfoWindow
                    anchor={marker}
                    maxWidth={200}
                    onCloseClick={() => setInfowindowOpen(false)}
                >
                    {`${pkg.recipient_address}`}<br/>
                </InfoWindow>
            )}
            {infowindowOpen && (depot == true) && (
                <InfoWindow
                    anchor={marker}
                    maxWidth={200}
                    onCloseClick={() => setInfowindowOpen(false)}
                >
                    Depot
                </InfoWindow>
            )}
        </>
    );
};

export default MarkerWithInfowindow;
