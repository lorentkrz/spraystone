import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { StepProps } from '@/types';
import { useI18n } from '@/i18n';

// Global flag to ensure setOptions is only called once
let googleMapsInitialized = false;

interface GooglePlacePrediction {
  place_id?: string;
  placeId?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  text?: { text?: string };
  toPlace?: () => any;
}

export const Step1Address: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();
  const addressParts = {
    street: formData.street || '',
    number: formData.streetNumber || '',
    postalCode: formData.postalCode || '',
    city: formData.city || ''
  };
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  // const sessionTokenRef = useRef<any>(null); // Reserved for future use
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const currentMarker = useRef<any>(null);

  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Initialize Google Places API with script loading
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured - autocomplete disabled');
      setApiKeyMissing(true);
      return;
    }

    // Only initialize once globally
    if (!googleMapsInitialized) {
      googleMapsInitialized = true;

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        // Already loaded, just ensure places library is ready and init map
        if (window.google.maps.places) {
          if (mapRef.current && !mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 50.8503, lng: 4.3517 },
              zoom: 11,
              mapId: 'spraystone-map',
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });
          }
          setApiKeyMissing(false);
        }
        return;
      }

      // Create script element with loading=async for better performance
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Global callback function
      (window as any).initGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          // Initialize map with Map ID
          if (mapRef.current && !mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 50.8503, lng: 4.3517 },
              zoom: 11,
              mapId: 'spraystone-map',
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });
          }
          setApiKeyMissing(false);
        }
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setApiKeyMissing(true);
      };

      document.head.appendChild(script);
    } else {
      // If already initialized, just ensure map exists
      if (window.google && window.google.maps && window.google.maps.places) {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 50.8503, lng: 4.3517 },
              zoom: 11,
            mapId: 'spraystone-map',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        }
        setApiKeyMissing(false);
      }
    }
  }, []);

  const handlePartChange = (
    field: 'street' | 'number' | 'postalCode' | 'city',
    value: string
  ): void => {
    const nameMap = {
      street: 'street',
      number: 'streetNumber',
      postalCode: 'postalCode',
      city: 'city'
    } as const;
    onChange({
      target: { name: nameMap[field], value }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const applyAddressParts = (parts: {
    street: string;
    number: string;
    postalCode: string;
    city: string;
  }) => {
    handlePartChange('street', parts.street);
    handlePartChange('number', parts.number);
    handlePartChange('postalCode', parts.postalCode);
    handlePartChange('city', parts.city);
  };

  const handleAddressInput = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const value = e.target.value;
    onChange(e);

    // Revert to legacy AutocompleteService to avoid 403 Places API errors
    if (value.length > 2 && window.google && window.google.maps && window.google.maps.places) {
      const { AutocompleteService, PlacesServiceStatus } = await window.google.maps.importLibrary('places') as any;
      if (!autocompleteService.current) {
        autocompleteService.current = new AutocompleteService();
      }

      try {
        // Make two separate requests since "address cannot be mixed with other types"
        const makeRequest = (types: string[]): Promise<any[]> => {
          return new Promise((resolve) => {
            autocompleteService.current.getPlacePredictions(
              {
                input: value,
                componentRestrictions: { country: 'be' },
                types: types
              },
              (predictions: any[], status: any) => {
                if (status === PlacesServiceStatus.OK && predictions) {
                  resolve(predictions);
                } else {
                  resolve([]);
                }
              }
            );
          });
        };

        // Get both address and establishment results
        const [addressResults, establishmentResults] = await Promise.all([
          makeRequest(['address']),
          makeRequest(['establishment'])
        ]);
        const allResults = [...addressResults, ...establishmentResults];
        if (allResults.length > 0) {
          setSuggestions(allResults);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectPrediction = async (prediction: GooglePlacePrediction): Promise<void> => {
    const placeId = typeof prediction === 'object' && (prediction.place_id || prediction.placeId) ? (prediction.place_id || prediction.placeId) : prediction;
    if (!placeId || !window.google || !window.google.maps) return;
    
    const { Place, PlacesService } = await window.google.maps.importLibrary('places') as any;
    if (!placesService.current) {
      placesService.current = new PlacesService(document.createElement('div'));
    }
    
    try {
      if (typeof prediction === 'object' && prediction.toPlace) {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location', 'displayName'] });
        handlePlaceResult(place, place.formattedAddress || prediction.text?.text || '');
      } else {
        // Legacy getDetails
        placesService.current.getDetails(
          { placeId, fields: ['address_components', 'formatted_address', 'geometry', 'name'] },
          (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              handleLegacyPlaceResult(place);
            } else {
              // Fallback: try new API Place if legacy fails
              (async () => {
                try {
                  const placeNew = new Place({ id: placeId });
                  await placeNew.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location', 'displayName'] });
                  handlePlaceResult(placeNew, placeNew.formattedAddress || (prediction as any).structured_formatting?.main_text || '');
                } catch (e) {
                  console.error('New API fallback also failed:', e);
                }
              })();
            }
          }
        );
        return;
      }
    } catch (err) {
      console.error('selectPrediction error:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handlePlaceResult = (place: any, formatted: string): void => {
    let street = '';
    let number = '';
    let postalCode = '';
    let city = '';

    if (place.addressComponents) {
      place.addressComponents.forEach((component: any) => {
        const types = component.types || [];
        if (types.includes('route')) street = component.longText || component.shortText || component.long_name || '';
        if (types.includes('street_number')) number = component.longText || component.shortText || component.long_name || '';
        if (types.includes('postal_code')) postalCode = component.longText || component.shortText || component.long_name || '';
        if (types.includes('locality')) city = component.longText || component.shortText || component.long_name || '';
      });
    }

    if (!street && formatted) {
      const addressParts = formatted.split(',');
      if (addressParts.length >= 2) {
        const firstPart = addressParts[0].trim();
        const streetMatch = firstPart.match(/^(.+?)\s+(\d+.*)$/);
        if (streetMatch) {
          street = streetMatch[1];
          number = streetMatch[2];
        } else {
          street = firstPart;
        }
        for (let i = 1; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          const postalMatch = part.match(/^(\d{4})\s+(.+)$/);
          if (postalMatch) {
            postalCode = postalMatch[1];
            city = postalMatch[2];
          }
        }
      }
    }

    applyAddressParts({ street, number, postalCode, city });

    if (mapInstance.current && place.location) {
      // Clear previous marker
      if (currentMarker.current) {
        currentMarker.current.setMap(null);
      }
      mapInstance.current.setCenter(place.location);
      mapInstance.current.setZoom(14);
      currentMarker.current = new window.google.maps.Marker({
        position: place.location,
        map: mapInstance.current,
        title: place.displayName || formatted,
        animation: window.google.maps.Animation.DROP,
      });
    }

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleLegacyPlaceResult = (place: any): void => {
    let street = '';
    let number = '';
    let postalCode = '';
    let city = '';

    if (place.address_components) {
      place.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes('route')) street = component.long_name;
        if (types.includes('street_number')) number = component.long_name;
        if (types.includes('postal_code')) postalCode = component.long_name;
        if (types.includes('locality')) city = component.long_name;
      });
    }

    const formatted = place.formatted_address || '';
    if (!street && formatted) {
      const addressParts = formatted.split(',');
      if (addressParts.length >= 2) {
        const firstPart = addressParts[0].trim();
        const streetMatch = firstPart.match(/^(.+?)\s+(\d+.*)$/);
        if (streetMatch) {
          street = streetMatch[1];
          number = streetMatch[2];
        } else {
          street = firstPart;
        }
        for (let i = 1; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          const postalMatch = part.match(/^(\d{4})\s+(.+)$/);
          if (postalMatch) {
            postalCode = postalMatch[1];
            city = postalMatch[2];
          }
        }
      }
    }

    applyAddressParts({ street, number, postalCode, city });

    if (mapInstance.current && place.geometry && place.geometry.location) {
      // Clear previous marker
      if (currentMarker.current) {
        currentMarker.current.setMap(null);
      }
      mapInstance.current.setCenter(place.geometry.location);
      mapInstance.current.setZoom(14);
      currentMarker.current = new window.google.maps.Marker({
        position: place.geometry.location,
        map: mapInstance.current,
        title: place.name || formatted,
        animation: window.google.maps.Animation.DROP,
      });
    }

    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex-shrink-0 sm:mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          {t('steps.address.title')}
        </h2>
        <p className="text-gray-600 text-center">
          {t('steps.address.subtitle')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex flex-col rounded-2xl border border-[#eadfcb] bg-white/80 p-4 shadow-sm lg:flex-[1.1]">
          {/* Full Address with Autocomplete */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleAddressInput}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={`${t('steps.address.placeholder')} *`}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900"
              required
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                {suggestions.slice(0, 4).map((suggestion) => {
                  const key =
                    suggestion.place_id || suggestion.placeId || Math.random();
                  const onClick = () => selectPrediction(suggestion);
                  const mainText =
                    suggestion.structured_formatting?.main_text ||
                    suggestion.mainText?.text ||
                    suggestion.text?.text ||
                    '';
                  const secondaryText =
                    suggestion.structured_formatting?.secondary_text ||
                    suggestion.secondaryText?.text ||
                    '';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={onClick}
                      className="flex w-full items-start gap-2 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
                    >
                      <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mainText}
                        </div>
                        <div className="text-xs text-gray-500">
                          {secondaryText}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {suggestions.length > 4 && (
                  <div className="px-4 py-2 text-[11px] text-gray-500">
                    {t('steps.address.moreSuggestionsHint')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Address Parts Grid - Responsive */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={addressParts.street}
              onChange={(e) => handlePartChange('street', e.target.value)}
              placeholder={`${t('steps.address.street')} *`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 sm:col-span-2"
              required
            />
            <input
              type="text"
              value={addressParts.number}
              onChange={(e) => handlePartChange('number', e.target.value)}
              placeholder={`${t('steps.address.number')} *`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
              required
            />
            <input
              type="text"
              value={addressParts.postalCode}
              onChange={(e) => handlePartChange('postalCode', e.target.value)}
              placeholder={`${t('steps.address.postalCode')} *`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
              required
            />
            <input
              type="text"
              value={addressParts.city}
              onChange={(e) => handlePartChange('city', e.target.value)}
              placeholder={`${t('steps.address.city')} *`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 sm:col-span-2"
              required
            />
          </div>
        </div>

        {/* Google Map */}
        <div className="flex aspect-[16/10] min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#eadfcb] bg-white/80 shadow-sm lg:aspect-auto">
          <div
            ref={mapRef}
            className="relative flex-1 min-h-0 bg-gray-100"
          >
            {apiKeyMissing && (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff7ec] to-[#e8dcc8]">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-16 w-16 text-[#c4955e] opacity-40" />
                  <p className="text-[#6b5e4f] text-sm">
                    {t('steps.address.mapsKeyMissing')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
