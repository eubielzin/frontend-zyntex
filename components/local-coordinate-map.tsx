"use client"

import * as React from "react"
import type { LatLngExpression, Map as LeafletMap, Marker, TileLayer } from "leaflet"

type LocalCoordinateMapProps = {
  latitude?: number | string | null
  longitude?: number | string | null
  onChange: (coordinates: { latitude: number; longitude: number }) => void
}

const DEFAULT_CENTER = {
  latitude: -14.235,
  longitude: -51.9253,
}

type MapLayerMode = "mapa" | "satelite"

const TILE_LAYERS: Record<
  MapLayerMode,
  {
    attribution: string
    url: string
  }
> = {
  mapa: {
    attribution: "&copy; OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  satelite: {
    attribution:
      "Tiles &copy; Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
}

function parseCoordinate(value?: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.replace(",", "."))
    return Number.isFinite(parsedValue) ? parsedValue : undefined
  }

  return undefined
}

function getPosition(latitude?: number | string | null, longitude?: number | string | null) {
  const parsedLatitude = parseCoordinate(latitude)
  const parsedLongitude = parseCoordinate(longitude)

  if (
    typeof parsedLatitude === "number" &&
    typeof parsedLongitude === "number" &&
    (parsedLatitude !== 0 || parsedLongitude !== 0)
  ) {
    return {
      hasCoordinate: true,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    }
  }

  return {
    hasCoordinate: false,
    latitude: DEFAULT_CENTER.latitude,
    longitude: DEFAULT_CENTER.longitude,
  }
}

export function LocalCoordinateMap({
  latitude,
  longitude,
  onChange,
}: LocalCoordinateMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<LeafletMap | null>(null)
  const markerRef = React.useRef<Marker | null>(null)
  const tileLayerRef = React.useRef<TileLayer | null>(null)
  const pinIconRef = React.useRef<import("leaflet").DivIcon | null>(null)
  const onChangeRef = React.useRef(onChange)
  const pendingPositionRef = React.useRef({ latitude, longitude })
  const [layerMode, setLayerMode] = React.useState<MapLayerMode>("mapa")
  const [hasMarker, setHasMarker] = React.useState(false)

  const centerOnMarker = React.useCallback(() => {
    const marker = markerRef.current
    const map = mapRef.current
    if (!marker || !map) return
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 17), { animate: true })
  }, [])

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Mantém a posição mais recente acessível dentro do setup assíncrono do mapa
  React.useEffect(() => {
    pendingPositionRef.current = { latitude, longitude }
  }, [latitude, longitude])

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    let disposed = false

    const setupMap = async () => {
      const L = await import("leaflet")

      if (disposed || !containerRef.current) {
        return
      }

      const position = getPosition(latitude, longitude)
      const center: LatLngExpression = [position.latitude, position.longitude]
      const pinIcon = L.divIcon({
        className: "",
        html: '<span class="local-coordinate-pin"></span>',
        iconAnchor: [13, 26],
        iconSize: [26, 26],
      })
      const map = L.map(containerRef.current, {
        attributionControl: true,
        maxZoom: 22,
        scrollWheelZoom: true,
      }).setView(center, position.hasCoordinate ? 17 : 4)

      const tileLayer = L.tileLayer(TILE_LAYERS.mapa.url, {
        attribution: TILE_LAYERS.mapa.attribution,
        maxNativeZoom: 19,
        maxZoom: 22,
      }).addTo(map)

      map.attributionControl.setPrefix("")

      const updateCoordinates = (nextLatitude: number, nextLongitude: number) => {
        markerRef.current?.setLatLng([nextLatitude, nextLongitude])
        onChangeRef.current({
          latitude: Number(nextLatitude.toFixed(7)),
          longitude: Number(nextLongitude.toFixed(7)),
        })
      }

      map.on("click", (event) => {
        updateCoordinates(event.latlng.lat, event.latlng.lng)
      })

      mapRef.current = map
      pinIconRef.current = pinIcon
      tileLayerRef.current = tileLayer

      // Se as coordenadas chegaram antes do Leaflet terminar de carregar,
      // adiciona o marcador agora com os valores mais recentes
      const pending = getPosition(pendingPositionRef.current.latitude, pendingPositionRef.current.longitude)
      if (pending.hasCoordinate && !markerRef.current) {
        const marker = L.marker([pending.latitude, pending.longitude], {
          draggable: true,
          icon: pinIcon,
        }).addTo(map)

        marker.on("dragend", () => {
          const pos = marker.getLatLng()
          onChangeRef.current({
            latitude: Number(pos.lat.toFixed(7)),
            longitude: Number(pos.lng.toFixed(7)),
          })
        })

        markerRef.current = marker
        map.setView([pending.latitude, pending.longitude], 17)
        setHasMarker(true)
      }

      setTimeout(() => map.invalidateSize(), 0)

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })

      resizeObserver.observe(containerRef.current)

      map.once("unload", () => {
        resizeObserver.disconnect()
      })
    }

    setupMap()

    return () => {
      disposed = true
      markerRef.current = null
      tileLayerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    const currentTileLayer = tileLayerRef.current

    if (!map || !currentTileLayer) {
      return
    }

    currentTileLayer.removeFrom(map)

    import("leaflet").then((L) => {
      if (!mapRef.current) {
        return
      }

      tileLayerRef.current = L.tileLayer(TILE_LAYERS[layerMode].url, {
        attribution: TILE_LAYERS[layerMode].attribution,
        maxNativeZoom: 19,
        maxZoom: 22,
      }).addTo(mapRef.current)
    })
  }, [layerMode])

  React.useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    const position = getPosition(latitude, longitude)

    if (!position.hasCoordinate) {
      markerRef.current?.remove()
      markerRef.current = null
      setHasMarker(false)
      return
    }

    if (!markerRef.current) {
      import("leaflet").then((L) => {
        if (!mapRef.current) {
          return
        }

        const marker = L.marker([position.latitude, position.longitude], {
          draggable: true,
          icon:
            pinIconRef.current ??
            L.divIcon({
              className: "",
              html: '<span class="local-coordinate-pin"></span>',
              iconAnchor: [13, 26],
              iconSize: [26, 26],
            }),
        }).addTo(mapRef.current)

        marker.on("dragend", () => {
          const markerPosition = marker.getLatLng()
          onChangeRef.current({
            latitude: Number(markerPosition.lat.toFixed(7)),
            longitude: Number(markerPosition.lng.toFixed(7)),
          })
        })

        markerRef.current = marker
        mapRef.current.setView([position.latitude, position.longitude], 18)
        setHasMarker(true)
      })
      return
    }

    const marker = markerRef.current
    const currentPosition = marker.getLatLng()
    const changed =
      Math.abs(currentPosition.lat - position.latitude) > 0.0000001 ||
      Math.abs(currentPosition.lng - position.longitude) > 0.0000001

    if (!changed) {
      return
    }

    marker.setLatLng([position.latitude, position.longitude])
    map.setView([position.latitude, position.longitude], Math.max(map.getZoom(), 18))
  }, [latitude, longitude])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(26,40,31,0.05)]">
      <div className="relative">
        <div className="absolute right-3 top-3 z-[1000] inline-flex overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_8px_24px_rgba(26,40,31,0.16)]">
          <button
            type="button"
            onClick={() => setLayerMode("mapa")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              layerMode === "mapa"
                ? "bg-[#25352C] text-white"
                : "text-[#536154] hover:bg-[#f4f6f0]"
            }`}
          >
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("satelite")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              layerMode === "satelite"
                ? "bg-[#25352C] text-white"
                : "text-[#536154] hover:bg-[#f4f6f0]"
            }`}
          >
            Satélite
          </button>
        </div>
        <div ref={containerRef} className="h-[320px] w-full" />
        {hasMarker && (
          <button
            type="button"
            onClick={centerOnMarker}
            title="Centralizar no marcador"
            className="absolute bottom-3 left-3 z-1000 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-shadow"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <circle cx="12" cy="10" r="4" fill="#cf9d09" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#cf9d09" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="10" r="7" stroke="#cf9d09" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
