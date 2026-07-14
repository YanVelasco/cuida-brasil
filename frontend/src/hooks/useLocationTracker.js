import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gestorService } from '../services/api';

export default function useLocationTracker() {
  const { user } = useAuth();

  useEffect(() => {
    // Apenas monitora usuários com perfil de GESTOR
    if (!user || user.perfil !== 'GESTOR') return;

    let watchId;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Envia a atualização para o backend silenciosamente
            await gestorService.atualizarLocalizacao({
              latitude: lat,
              longitude: lng
            });
            console.log(`Localização atualizada: ${lat}, ${lng}`);
          } catch (err) {
            console.error("Erro ao atualizar localização no backend:", err);
          }
        },
        (error) => {
          console.error("Erro no rastreamento de localização:", error);
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 5000 
        }
      );
    } else {
      console.warn("Geolocalização não é suportada neste navegador.");
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);
}
