export async function fetchPokeAPI(pathOrUrl) {
  const path = pathOrUrl.replace('https://pokeapi.co/api/v2/', '');
  const res = await fetch(`/api/pokeapi/${path}`);
  if (!res.ok) throw new Error(`PokeAPI error: ${res.status}`);
  return res.json();
}
