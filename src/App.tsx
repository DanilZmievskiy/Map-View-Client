import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const token =
  'pk.eyJ1IjoiZGFuaWwtem1pZXZza2l5IiwiYSI6ImNtMWdtdW8wczA0aXgybXF5aHhwd3hjczMifQ.V1ZI22FqToIunmUmqgB0hg'

const places = [
  {
    id: 'hermitage',
    name: 'Государственный Эрмитаж',
    center: [30.3158, 59.9398] as [number, number],
    zoom: 15.3,
    description:
      'Зимний дворец и Эрмитаж образуют парадное сердце города, выходя к Дворцовой площади и набережной Невы с одной из самых сильных городских композиций Петербурга.',
  },
  {
    id: 'isaac',
    name: 'Исаакиевский собор',
    center: [30.3061, 59.9343] as [number, number],
    zoom: 15.8,
    description:
      'Исаакиевский собор раскрывается в широком городском пространстве с длинными перспективами к Адмиралтейству и Мойке. Это один из самых выразительных примеров монументального масштаба в историческом центре.',
  },
  {
    id: 'church-blood',
    name: 'Спас на Крови',
    center: [30.3289, 59.9407] as [number, number],
    zoom: 16.1,
    description:
      'Расположенный у канала Грибоедова, храм собирает в плотную сцену воду, камень и сложный силуэт куполов. Для него лучше работает более близкий ракурс, чем для соседних имперских площадей.',
  },
  {
    id: 'peter-paul',
    name: 'Петропавловская крепость',
    center: [30.3167, 59.9502] as [number, number],
    zoom: 15.2,
    description:
      'Крепость на Заячьем острове отмечает точку основания города в 1703 году. С высоты особенно ясно читаются ее бастионы и осевая структура на фоне расходящихся рукавов Невы.',
  },
  {
    id: 'new-holland',
    name: 'Новая Голландия',
    center: [30.2894, 59.9256] as [number, number],
    zoom: 15.1,
    description:
      'Новая Голландия показывает другой Петербург, где историческая морская инфраструктура стала каркасом общественного острова. Этот фрагмент карты уводит взгляд от парадности к переосмысленным пространствам и жизни у воды.',
  },
  {
    id: 'smolny',
    name: 'Смольный собор',
    center: [30.3959, 59.9486] as [number, number],
    zoom: 15,
    description:
      'Смольный собор расположен восточнее и раскрывает иной ритм города: монастырские ансамбли, изгибы реки и более крупные кварталы. Он добавляет в маршрут более широкий городской жест за пределами плотного центра.',
  },
]

function App() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [error, setError] = useState<string | null>(null)
  const [activePlaceId, setActivePlaceId] = useState(places[0].id)

  useEffect(() => {
    if (!token) {
      setError('Добавьте VITE_MAPBOX_TOKEN в файл .env, чтобы карта загрузилась.')
      return
    }

    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      center: places[0].center,
      zoom: 11.8,
      pitch: 38,
      bearing: -16,
      language: 'ru-RU',
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const activePlace = places.find((place) => place.id === activePlaceId)

    if (!map || !activePlace) {
      return
    }

    map.flyTo({
      center: activePlace.center,
      zoom: activePlace.zoom,
      duration: 2200,
      essential: true,
    })
  }, [activePlaceId])

  useEffect(() => {
    const listElement = listRef.current

    if (!listElement) {
      return
    }

    let frameId = 0

    const updateActivePlace = () => {
      const rootBounds = listElement.getBoundingClientRect()
      let nextPlaceId = places[0].id
      let bestVisibleHeight = 0

      for (const [placeId, element] of itemRefs.current.entries()) {
        const bounds = element.getBoundingClientRect()
        const visibleTop = Math.max(bounds.top, rootBounds.top)
        const visibleBottom = Math.min(bounds.bottom, rootBounds.bottom)
        const visibleHeight = Math.max(0, visibleBottom - visibleTop)

        if (visibleHeight > bestVisibleHeight) {
          bestVisibleHeight = visibleHeight
          nextPlaceId = placeId
        }
      }

      setActivePlaceId((currentId) => (currentId === nextPlaceId ? currentId : nextPlaceId))
    }

    const handleScroll = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(updateActivePlace)
    }

    updateActivePlace()
    listElement.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      cancelAnimationFrame(frameId)
      listElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const setItemRef = (placeId: string) => (element: HTMLElement | null) => {
    if (!element) {
      itemRefs.current.delete(placeId)
      return
    }

    itemRefs.current.set(placeId, element)
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Путеводитель по Санкт-Петербургу</p>
        <h1>Прокручивайте список мест, чтобы перемещать карту по городу.</h1>
        {/* <p className="description">
          Когда карточка становится видимой в левой колонке, камера карты плавно приближает это место.
        </p> */}
        {error ? <div className="notice">{error}</div> : null}
        <div ref={listRef} className="places-list">
          {places.map((place) => (
            <article
              key={place.id}
              id={place.id}
              ref={setItemRef(place.id)}
              className={`place-card ${activePlaceId === place.id ? 'is-active' : ''}`}
            >
              <p className="place-label">{place.name}</p>
              <p className="place-copy">{place.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="map-panel">
        <div ref={mapContainerRef} className="map-container" />
      </section>
    </main>
  )
}

export default App
