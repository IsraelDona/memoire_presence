import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';



const MINISTERE_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const USER_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const DEFAULT_CENTER = {
    latitude: 6.3703,
    longitude: 2.3912,
};

function PresenceMap({ userPosition, rayonKm = 1, centerPosition = DEFAULT_CENTER, centerLabel = "Zone autorisée", userLocationName = null }) {

    const center = userPosition
        ? [userPosition.latitude, userPosition.longitude]
        : [centerPosition.latitude, centerPosition.longitude];

    const zoom = userPosition ? 14 : 15;
    const mapKey = `${centerPosition.latitude}-${centerPosition.longitude}`;

    return (
        <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4ddc8' }}>
            <MapContainer
                key={mapKey}
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Cercle zone autorisée */}
                <Circle
                    center={[centerPosition.latitude, centerPosition.longitude]}
                    radius={rayonKm * 1000}
                    pathOptions={{
                        color: '#2d6b47',
                        fillColor: '#2d6b47',
                        fillOpacity: 0.1,
                        weight: 2,
                    }}
                />

                {/* Marqueur centre */}
                <Marker
                    position={[centerPosition.latitude, centerPosition.longitude]}
                    icon={MINISTERE_ICON}
                >
                    <Popup>
                        <strong>{centerLabel}</strong>
                        <br />
                        Rayon autorisé autour : {rayonKm} km
                    </Popup>
                </Marker>

                {/* Marqueur utilisateur */}
                {userPosition && (
                    <Marker
                        position={[userPosition.latitude, userPosition.longitude]}
                        icon={USER_ICON}
                    >
                        <Popup>
                            <strong>{userLocationName || 'Position capturée'}</strong>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

export default PresenceMap;