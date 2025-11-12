import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

// Global flag to ensure setOptions is only called once
let googleMapsInitialized = false;

const Step1Address = ({ formData, onChange }) => {
  const [addressParts, setAddressParts] = useState({
    street: '',
    number: '',
    postalCode: '',
    city: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentMarker = useRef(null);

  const [apiKeyMissing, setApiKeyMissing] = useState(false);

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
              zoom: 13,
              mapId: 'spraystone-map', // Add Map ID for Advanced Markers
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
      window.initGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          // Initialize map with Map ID
          if (mapRef.current && !mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 50.8503, lng: 4.3517 }, // Brussels center
              zoom: 13,
              mapId: 'spraystone-map', // Add Map ID for Advanced Markers
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
            zoom: 13,
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

  const handlePartChange = (field, value) => {
    const updated = { ...addressParts, [field]: value };
    setAddressParts(updated);
    // Combine all parts into address
    const fullAddress = `${updated.street} ${updated.number}, ${updated.postalCode} ${updated.city}`.trim();
    onChange({ target: { name: 'address', value: fullAddress } });
  };

  const handleAddressInput = async (e) => {
    const value = e.target.value;
    onChange(e);

    // Revert to legacy AutocompleteService to avoid 403 Places API errors
    if (value.length > 2 && window.google && window.google.maps && window.google.maps.places) {
      const { AutocompleteService, PlacesServiceStatus } = await window.google.maps.importLibrary('places');
      if (!autocompleteService.current) {
        autocompleteService.current = new AutocompleteService();
      }

      try {
        // Make two separate requests since "address cannot be mixed with other types"
        const makeRequest = (types) => {
          return new Promise((resolve) => {
            autocompleteService.current.getPlacePredictions(
              {
                input: value,
                componentRestrictions: { country: 'be' },
                types: types
              },
              (predictions, status) => {
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

  const selectPrediction = async (prediction) => {
    // Legacy prediction is a plain object; new API prediction is a class
    const placeId = typeof prediction === 'object' && (prediction.place_id || prediction.placeId) ? (prediction.place_id || prediction.placeId) : prediction;
    if (!placeId || !window.google || !window.google.maps) return;
    const { Place, PlacesService } = await window.google.maps.importLibrary('places');
    if (!placesService.current) {
      placesService.current = new PlacesService(document.createElement('div'));
    }
    try {
      // Try new API Place.fetchFields if possible; otherwise fallback to legacy getDetails
      if (typeof prediction === 'object' && prediction.toPlace) {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location', 'displayName'] });
        handlePlaceResult(place, place.formattedAddress || prediction.text?.text || '');
      } else {
        // Legacy getDetails
        placesService.current.getDetails(
          { placeId, fields: ['address_components', 'formatted_address', 'geometry', 'name'] },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              handleLegacyPlaceResult(place);
            } else {
              // Fallback: try new API Place if legacy fails
              (async () => {
                try {
                  const placeNew = new Place({ id: placeId });
                  await placeNew.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location', 'displayName'] });
                  handlePlaceResult(placeNew, placeNew.formattedAddress || prediction.structured_formatting?.main_text || '');
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

  const handlePlaceResult = (place, formatted) => {
    let street = '';
    let number = '';
    let postalCode = '';
    let city = '';

    if (place.addressComponents) {
      place.addressComponents.forEach((component) => {
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

    setAddressParts({ street, number, postalCode, city });
    onChange({ target: { name: 'address', value: formatted } });

    if (mapInstance.current && place.location) {
      // Clear previous marker
      if (currentMarker.current) {
        currentMarker.current.setMap(null);
      }
      mapInstance.current.setCenter(place.location);
      mapInstance.current.setZoom(16);
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

  const handleLegacyPlaceResult = (place) => {
    let street = '';
    let number = '';
    let postalCode = '';
    let city = '';

    if (place.address_components) {
      place.address_components.forEach(component => {
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

    setAddressParts({ street, number, postalCode, city });
    onChange({ target: { name: 'address', value: formatted } });

    if (mapInstance.current && place.geometry && place.geometry.location) {
      // Clear previous marker
      if (currentMarker.current) {
        currentMarker.current.setMap(null);
      }
      mapInstance.current.setCenter(place.geometry.location);
      mapInstance.current.setZoom(16);
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
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          Where is your building located?
        </h2>
        <p className="text-gray-600 text-center">
          We'll use this for accurate measurements and site planning
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Address with Autocomplete */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            name="address"
            value={formData.address}
            onChange={handleAddressInput}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Start typing your address..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => {
                const key = suggestion.place_id || suggestion.placeId || Math.random();
                const onClick = () => selectPrediction(suggestion);
                const mainText = suggestion.structured_formatting?.main_text || suggestion.mainText?.text || suggestion.text?.text || '';
                const secondaryText = suggestion.structured_formatting?.secondary_text || suggestion.secondaryText?.text || '';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={onClick}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{mainText}</div>
                      <div className="text-xs text-gray-500">{secondaryText}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Address Parts Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={addressParts.street}
            onChange={(e) => handlePartChange('street', e.target.value)}
            placeholder="Street"
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
          <input
            type="text"
            value={addressParts.number}
            onChange={(e) => handlePartChange('number', e.target.value)}
            placeholder="Number"
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
          <input
            type="text"
            value={addressParts.postalCode}
            onChange={(e) => handlePartChange('postalCode', e.target.value)}
            placeholder="Postal code"
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
          <input
            type="text"
            value={addressParts.city}
            onChange={(e) => handlePartChange('city', e.target.value)}
            placeholder="City"
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Google Map */}
      <div className="mt-8 w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '256px' }}
        >
          {apiKeyMissing && (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-green-600 mx-auto mb-2 opacity-30" />
                <p className="text-gray-500 text-sm">Google Maps API key required</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step1Address;
