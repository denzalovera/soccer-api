import { COMPETITION_CODE } from "./config.js";
import { fetchStandings } from "./api.js";
import { renderStandings } from "./view.js";
import { formatDate } from "./utils.js";

const $ = (id) => document.getElementById(id);

const els = {
  status: $("status"),
  subtitle: $("subtitle"),
  grid: $("grid"),
  legend: $("legend"),
  loadBtn: $("load"),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function setSubtitle(competition, season) {
  const name = competition?.name || "FIFA World Cup";
  els.subtitle.textContent =
    `${name} · ${formatDate(season?.startDate)} – ${formatDate(season?.endDate)} · Matchday ${season?.currentMatchday ?? "?"}`;
}

function setLoading() {
  setStatus("Loading…");
  els.legend.hidden = true;
  els.grid.replaceChildren();
}

function describeError(err) {
  if (err instanceof TypeError) {
    return "Could not reach the API. Make sure serve.py is running (`python3 serve.py`) and you're on http://localhost:8000.";
  }
  return err.message;
}

async function loadStandings() {
  setLoading();

  try {
    const data = await fetchStandings(COMPETITION_CODE);
    const { competition, season, rendered } = renderStandings(data, els.grid);

    if (!rendered) {
      setStatus("No group standings available yet for this competition.");
      return;
    }

    setSubtitle(competition, season);
    setStatus("Free tier: 10 requests/min. Standings refresh on each Reload.");
    els.legend.hidden = false;
  } catch (err) {
    setStatus(`Error: ${describeError(err)}`, true);
  }
}

function attachEventListeners() {
  els.loadBtn.addEventListener("click", loadStandings);
}

async function init() {
  attachEventListeners();
  await loadStandings();
}

init();
