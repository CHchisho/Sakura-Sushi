import { Menu, Restaurant, BusStopFeatureCollection } from './types.js'
// const HSL_API_URL = 'https://services1.arcgis.com/sswNXkUiRoWtrx0t/arcgis/rest/services/HSL_pysakit_kevat2018/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson';
const HSL_API_URL =
  'https://services1.arcgis.com/sswNXkUiRoWtrx0t/arcgis/rest/services/HSL_pysakit_kevat2018/FeatureServer/0/query?where=1%3D1&outFields=LYHYTTUNNU,NIMI1,NIMI2&outSR=4326&f=json'

export const getMenu = async (): Promise<Menu> => {
  const response = await fetch('/api/menu')
  return response.json()
}

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const response = await fetch('/api/restaurants')
  return response.json()
}

export const getBusStops = async (): Promise<BusStopFeatureCollection> => {
  const response = await fetch(HSL_API_URL)
  return response.json()
}

const fetchData = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Error ${response.status} occured`)
  }
  const json = response.json()
  return json
}

export { fetchData }
