import { formatDate, formatGoalDifference, groupSortKey } from "./utils.js";

export function renderStandings(data, container) {
  container.replaceChildren();

  const competition = data.competition || {};
  const season = data.season || {};
  const standings = (data.standings || []).filter((s) => s.type === "TOTAL");

  if (!standings.length) {
    return { competition, season, rendered: 0 };
  }

  const is48Team = standings.length >= 12;
  const sorted = [...standings].sort(
    (a, b) => groupSortKey(a.group).localeCompare(groupSortKey(b.group))
  );

  const frag = document.createDocumentFragment();
  for (const group of sorted) {
    frag.appendChild(buildGroupCard(group, is48Team, season.currentMatchday));
  }
  container.appendChild(frag);

  return { competition, season, rendered: sorted.length };
}

function buildGroupCard(group, is48Team, seasonMatchday) {
  const card = document.createElement("section");
  card.className = "group";

  const label = (group.group || "Standings").replace(/_/g, " ");
  const stage = (group.stage || "").replace(/_/g, " ");
  const metaParts = [stage, `MD ${seasonMatchday ?? "?"}`].filter(Boolean);

  const title = document.createElement("h2");
  title.append(label);

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = metaParts.join(" · ");
  title.append(" ", meta);

  card.appendChild(title);
  card.appendChild(buildTable(group.table || [], is48Team));
  return card;
}

function buildTable(rows, is48Team) {
  const table = document.createElement("table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const sortedRows = [...rows].sort((a, b) => a.position - b.position);
  for (const row of sortedRows) {
    tbody.appendChild(buildRow(row, is48Team));
  }
  table.appendChild(tbody);

  return table;
}

function buildRow(row, is48Team) {
  const tr = document.createElement("tr");
  applyQualificationClass(tr, row.position, is48Team);

  const team = row.team || {};
  const tla = (team.tla || team.shortName || team.name || "")
    .slice(0, 3)
    .toUpperCase();

  appendCell(tr, row.position);
  appendTeamCell(tr, team, tla);
  appendCell(tr, row.playedGames);
  appendCell(tr, row.won);
  appendCell(tr, row.draw);
  appendCell(tr, row.lost);
  appendCell(tr, row.goalsFor);
  appendCell(tr, row.goalsAgainst);
  appendCell(tr, formatGoalDifference(row.goalDifference));
  const pts = appendCell(tr, row.points);
  pts.classList.add("pts");

  return tr;
}

function applyQualificationClass(tr, position, is48Team) {
  if (is48Team) {
    if (position <= 2) tr.classList.add("qualify");
    else if (position === 3) tr.classList.add("playoff");
  } else if (position <= 2) {
    tr.classList.add("qualify");
  }
}

function appendCell(tr, value) {
  const td = document.createElement("td");
  td.textContent = value == null ? "" : String(value);
  tr.appendChild(td);
  return td;
}

function appendTeamCell(tr, team, tla) {
  const td = document.createElement("td");
  td.className = "team";

  if (team.crest) {
    const img = document.createElement("img");
    img.src = team.crest;
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error", () => {
      const abbr = document.createElement("span");
      abbr.className = "abbr";
      abbr.textContent = tla;
      img.replaceWith(abbr);
    }, { once: true });
    td.appendChild(img);
  } else {
    td.appendChild(makeAbbr(tla));
  }

  const name = document.createElement("span");
  name.textContent = team.name || "—";
  td.appendChild(name);

  tr.appendChild(td);
}

function makeAbbr(text) {
  const abbr = document.createElement("span");
  abbr.className = "abbr";
  abbr.textContent = text;
  return abbr;
}
