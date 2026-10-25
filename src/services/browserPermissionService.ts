import { setSelectedLocation } from './locationService';

/**
 * Triggers the browser's native location permission dialog (Google Location Services / device GPS)
 */
export function requestBrowserLocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || data.countryName;
            if (city) {
              const cleanCity = String(city).trim();
              setSelectedLocation(cleanCity);
              localStorage.setItem('veuz_auto_detected_location', cleanCity);
              resolve(cleanCity);
              return;
            }
          }
        } catch (e) {
          try {
            const resOsm = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (resOsm.ok) {
              const dataOsm = await resOsm.json();
              const addr = dataOsm.address || {};
              const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
              if (city) {
                const cleanCity = String(city).trim();
                setSelectedLocation(cleanCity);
                localStorage.setItem('veuz_auto_detected_location', cleanCity);
                resolve(cleanCity);
                return;
              }
            }
          } catch (e2) {}
        }
        resolve(null);
      },
      (error) => {
        console.warn('Browser location permission:', error?.message);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  });
}

/**
 * Triggers the browser's native notification permission dialog (Screenshot 2 prompt)
 */
export function requestBrowserNotification(): Promise<NotificationPermission | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve(null);
  }

  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }

  if (Notification.permission === 'denied') {
    return Promise.resolve('denied');
  }

  return Notification.requestPermission()
    .then((permission) => {
      if (permission === 'granted') {
        try {
          new Notification('Veuz Safety Equipment', {
            body: 'Notifications enabled! You will receive live delivery updates and safety equipment alerts.',
            icon: '/assets/imgs/theme/logo.svg',
          });
        } catch (e) {}
      }
      return permission;
    })
    .catch((err) => {
      console.warn('Browser notification permission error:', err);
      return null;
    });
}
