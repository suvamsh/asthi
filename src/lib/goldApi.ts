const GOLD_API_URL = 'https://api.metals.dev/v1/latest';

export async function getGoldPrice(): Promise<number | null> {
  try {
    const response = await fetch(`${GOLD_API_URL}?api_key=demo&currency=USD&unit=oz`);
    const data = await response.json();

    if (data.metals && data.metals.gold) {
      return data.metals.gold;
    }

    // Fallback to approximate price if API fails
    return null;
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return null;
  }
}
