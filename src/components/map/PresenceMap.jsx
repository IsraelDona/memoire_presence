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

const MINISTERE_POSITION = {
    latitude: 6.3703,
    longitude: 2.3912,
};

function PresenceMap({ userPosition, rayonKm = 1 }) {

    const center = userPosition
        ? [userPosition.latitude, userPosition.longitude]
        : [MINISTERE_POSITION.latitude, MINISTERE_POSITION.longitude];

    const zoom = userPosition ? 14 : 15;

    return (
        <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4ddc8' }}>
            <MapContainer
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
                    center={[MINISTERE_POSITION.latitude, MINISTERE_POSITION.longitude]}
                    radius={rayonKm * 1000}
                    pathOptions={{
                        color: '#2d6b47',
                        fillColor: '#2d6b47',
                        fillOpacity: 0.1,
                        weight: 2,
                    }}
                />

                {/* Marqueur ministère */}
                <Marker
                    position={[MINISTERE_POSITION.latitude, MINISTERE_POSITION.longitude]}
                    icon={MINISTERE_ICON}
                >
                    <Popup>
                        <strong>Ministère de l'Économie et des Finances</strong>
                        <br />
                        Zone autorisée : {rayonKm} km
                    </Popup>
                </Marker>

                {/* Marqueur utilisateur */}
                {userPosition && (
                    <Marker
                        position={[userPosition.latitude, userPosition.longitude]}
                        icon={USER_ICON}
                    >
                        <Popup>
                            <strong>Votre position</strong>
                            <br />
                            Lat : {userPosition.latitude.toFixed(6)}
                            <br />
                            Lng : {userPosition.longitude.toFixed(6)}
                            {userPosition.accuracy && (
                                <>
                                    <br />
                                    Précision : ±{Math.round(userPosition.accuracy)} m
                                </>
                            )}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

export default PresenceMap;