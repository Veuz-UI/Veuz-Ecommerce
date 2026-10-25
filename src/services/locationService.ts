export interface UserAddress {
  id: string;
  name: string;
  country: string;
  city: string;
  streetAddress: string;
  buildingNo?: string;
  zipCode?: string;
  phone?: string;
  isDefault?: boolean;
}

export const DELIVERY_CITIES: string[] = [
  'Khobar Shamaliya',
  'Al Khobar',
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Dhahran',
  'Makkah',
  'Madinah',
  'Jubail',
  'Yanbu',
  'Abha',
  'Tabuk',
  'Al-Ahsa',
  'Qatif',
  'Taif',
  'Hail',
  'Jizan',
  'Najran',
  'Buraidah',
  'Khamis Mushait',
];

export const LOCATION_CHANGED_EVENT = 'veuz:location-changed';
export const ADDRESS_UPDATED_EVENT = 'veuz:user-address-updated';

export function getSelectedLocation(): string {
  if (typeof window === 'undefined') return 'Khobar Shamaliya';

  // 1. If user is logged in, use their default/selected address
  try {
    const rawUser = localStorage.getItem('veuz_user');
    const token = localStorage.getItem('veuz_token');
    if (token && rawUser) {
      const user = JSON.parse(rawUser);
      const addresses = getUserAddresses(user);
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr?.city) {
        return defaultAddr.city;
      }
    }
  } catch (e) {}

  // 2. Saved manually selected location or auto-detected location
  const saved = localStorage.getItem('veuz_selected_location');
  if (saved && saved.trim()) return saved.trim();

  const autoDetected = localStorage.getItem('veuz_auto_detected_location');
  if (autoDetected && autoDetected.trim()) return autoDetected.trim();

  return 'Khobar Shamaliya';
}

export function setSelectedLocation(locationName: string): void {
  if (typeof window === 'undefined') return;
  const clean = locationName.trim();
  localStorage.setItem('veuz_selected_location', clean);
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT, { detail: clean }));
}

export function getUserAddresses(user: any): UserAddress[] {
  if (!user) return [];
  if (Array.isArray(user.addresses) && user.addresses.length > 0) {
    return user.addresses;
  }
  if (user.address && typeof user.address === 'object' && (user.address.city || user.address.streetAddress)) {
    return [
      {
        id: user.address.id || 'default-1',
        name: user.address.name || user.name || 'Recipient',
        country: user.address.country || 'Saudi Arabia',
        city: user.address.city || '',
        streetAddress: user.address.streetAddress || '',
        buildingNo: user.address.buildingNo || '',
        zipCode: user.address.zipCode || '',
        phone: user.address.phone || user.mobile || user.phone || '',
        isDefault: user.address.isDefault ?? true,
      },
    ];
  }
  return [];
}

/**
 * Automatically detects real-time location from browser GPS / Google location service for guest users.
 * If user is logged in, their selected/default address is used instead.
 */
export async function autoDetectGuestRealTimeLocation(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. If user is logged in, strictly prioritize their own selected address
  try {
    const rawUser = localStorage.getItem('veuz_user');
    const token = localStorage.getItem('veuz_token');
    if (token && rawUser) {
      const user = JSON.parse(rawUser);
      const addresses = getUserAddresses(user);
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr?.city) {
        setSelectedLocation(defaultAddr.city);
        return defaultAddr.city;
      }
    }
  } catch (e) {}

  // 2. If guest has manually chosen a city in this session, keep it
  const isManuallySelected = sessionStorage.getItem('veuz_location_manually_selected') === 'true';
  if (isManuallySelected) {
    const saved = localStorage.getItem('veuz_selected_location');
    if (saved) return saved;
  }

  // 3. Trigger real-time browser geolocation (uses Google Location Services / device GPS)
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      fallbackIpLocation().then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode coordinates via BigDataCloud client API (fast, high-precision, no API key required)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const detectedCity = data.city || data.locality || data.principalSubdivision || data.countryName;
            if (detectedCity && typeof detectedCity === 'string') {
              const formatted = detectedCity.trim();
              setSelectedLocation(formatted);
              localStorage.setItem('veuz_auto_detected_location', formatted);
              resolve(formatted);
              return;
            }
          }
        } catch (e) {
          // Fallback reverse geocode via OpenStreetMap Nominatim
          try {
            const resOsm = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (resOsm.ok) {
              const dataOsm = await resOsm.json();
              const addr = dataOsm.address || {};
              const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state || '';
              if (detectedCity) {
                const formatted = detectedCity.trim();
                setSelectedLocation(formatted);
                localStorage.setItem('veuz_auto_detected_location', formatted);
                resolve(formatted);
                return;
              }
            }
          } catch (e2) {}
        }
        fallbackIpLocation().then(resolve);
      },
      (err) => {
        // Fallback to real-time network IP detection if permission denied or GPS timeout
        fallbackIpLocation().then(resolve);
      },
      { timeout: 9000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

async function fallbackIpLocation(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.region;
      if (city) {
        const formatted = String(city).trim();
        setSelectedLocation(formatted);
        localStorage.setItem('veuz_auto_detected_location', formatted);
        return formatted;
      }
    }
  } catch (e) {}

  try {
    const res2 = await fetch('https://ipwho.is/');
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.success && data2.city) {
        const formatted = String(data2.city).trim();
        setSelectedLocation(formatted);
        localStorage.setItem('veuz_auto_detected_location', formatted);
        return formatted;
      }
    }
  } catch (e) {}

  return null;
}
