import { API_BASE } from "./config.js";

export async function fetchStandings(competitionCode) {
  const url = `${API_BASE}/competitions/${competitionCode}/standings`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status} ${res.statusText} - ${body}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
