/**
 * Geolocation Auto-Detection Engine for Mumbai Municipal Wards.
 * Calculates Haversine geodesic distance from citizen's GPS coordinates
 * to the nearest municipal administrative ward centroid.
 */

interface WardCentroid {
  wardId: number;
  name: string;
  lat: number;
  lng: number;
}

const WARD_CENTROIDS: WardCentroid[] = [
  { wardId: 1, name: 'Ward 01: Colaba & Fort', lat: 18.9220, lng: 72.8347 },
  { wardId: 2, name: 'Ward 02: Malabar Hill & Tardeo', lat: 18.9548, lng: 72.8055 },
  { wardId: 3, name: 'Ward 03: Byculla & Mazgaon', lat: 18.9750, lng: 72.8300 },
  { wardId: 4, name: 'Ward 04: Bandra West & Khar', lat: 19.0596, lng: 72.8295 },
  { wardId: 5, name: 'Ward 05: Dadar & Matunga', lat: 19.0178, lng: 72.8478 },
  { wardId: 6, name: 'Ward 06: Andheri East & Marol', lat: 19.1136, lng: 72.8697 },
  { wardId: 7, name: 'Ward 07: Andheri West & Juhu', lat: 19.1363, lng: 72.8277 },
  { wardId: 8, name: 'Ward 08: Kurla & Sakinaka', lat: 19.0726, lng: 72.8845 },
  { wardId: 9, name: 'Ward 09: Borivali West & Gorai', lat: 19.2288, lng: 72.8541 },
  { wardId: 10, name: 'Ward 10: Ghatkopar & Vikhroli', lat: 19.0860, lng: 72.9090 },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function detectClosestWard(): Promise<{ wardId: number; wardName: string; distanceKm: number } | null> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let closestWard = WARD_CENTROIDS[0];
        let minDistance = haversineDistanceKm(latitude, longitude, closestWard.lat, closestWard.lng);

        for (const ward of WARD_CENTROIDS.slice(1)) {
          const dist = haversineDistanceKm(latitude, longitude, ward.lat, ward.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestWard = ward;
          }
        }

        resolve({
          wardId: closestWard.wardId,
          wardName: closestWard.name,
          distanceKm: Math.round(minDistance * 10) / 10,
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
