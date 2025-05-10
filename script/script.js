document.addEventListener("DOMContentLoaded", () => {
  const totalDeathsCount = document.getElementById("total-deaths-count");
  const incTotalBtn = document.getElementById("increment-total-btn");
  const decTotalBtn = document.getElementById("decrement-total-btn");
  const bossList = document.getElementById("boss-list");
  const addBossForm = document.getElementById("add-boss-form");
  const bossNameInput = document.getElementById("boss-name-input");
  const msgDiv = document.getElementById("message");
  const STORAGE_KEY = "ds_death_data_v1";

  let data = loadData();
  updateUI();

  incTotalBtn.addEventListener("click", () => changeDeaths(null, +1));
  decTotalBtn.addEventListener("click", () => changeDeaths(null, -1));
  addBossForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = bossNameInput.value.trim();
    if (!name) return showMessage("Введіть ім'я боса");
    if (data.bosses.some((b) => b.name.toLowerCase() === name.toLowerCase()))
      return showMessage(`Бос "${name}" вже існує`);
    data.bosses.push({ name, deaths: 0, locked: false });
    bossNameInput.value = "";
    saveData();
    updateUI();
  });

  bossList.addEventListener("click", (e) => {
    const li = e.target.closest(".boss-item");
    if (!li) return;
    const idx = +li.dataset.index;
    if (e.target.classList.contains("boss-increment-btn"))
      changeDeaths(idx, +1);
    if (e.target.classList.contains("boss-decrement-btn"))
      changeDeaths(idx, -1);
    if (e.target.classList.contains("boss-delete-btn")) deleteBoss(idx);
    if (e.target.classList.contains("boss-lock-btn")) toggleLock(idx);
  });

  function changeDeaths(bossIdx, delta) {
    if (bossIdx === null) {
      const newTotal = data.totalDeaths + delta;
      if (newTotal < 0) return;
      data.totalDeaths = newTotal;
    } else {
      const boss = data.bosses[bossIdx];
      if (!boss || boss.locked) return;
      if (boss.deaths + delta < 0 || data.totalDeaths + delta < 0) return;
      boss.deaths += delta;
      data.totalDeaths += delta;
    }
    saveData();
    updateUI();
  }

  function deleteBoss(idx) {
    const boss = data.bosses[idx];
    if (!boss || boss.locked) return;
    const ok = confirm(
      `Ви дійсно хочете видалити боса “${boss.name}”? Цю дію не можна буде скасувати.`
    );
    if (!ok) return;
    data.bosses.splice(idx, 1);
    saveData();
    updateUI();
  }

  function toggleLock(idx) {
    const boss = data.bosses[idx];
    boss.locked = !boss.locked;
    saveData();
    updateUI();

    const li = bossList.querySelector(`li[data-index="${idx}"]`);
    if (!li) return;

    const incBtn = li.querySelector(".boss-increment-btn");
    const decBtn = li.querySelector(".boss-decrement-btn");
    const deleteBtn = li.querySelector(".boss-delete-btn");

    [incBtn, decBtn, deleteBtn].forEach((btn) => {
      if (btn) btn.disabled = boss.locked;
    });

    li.classList.add("just-locked");
    setTimeout(() => li.classList.remove("just-locked"), 600);
  }

  function updateUI() {
    totalDeathsCount.textContent = data.totalDeaths;
    bossList.innerHTML = "";
    data.bosses.forEach((b, i) => {
      const li = document.createElement("li");
      li.className = "boss-item" + (b.locked ? " locked" : "");
      li.dataset.index = i;
      li.draggable = true;
      li.innerHTML = `
        <div class="boss-info">
          <span class="boss-name">${b.name}</span>
          <span class="boss-death-count">Смертей: ${b.deaths}</span>
        </div>
        <div class="boss-button-group">
          <button class="btn btn-red boss-increment-btn increment-btn" aria-label="+1 до ${
            b.name
          }" ${b.locked ? "disabled" : ""}>
            <img src="images/skull.svg" alt="+1">
          </button>
          <button class="btn btn-blue boss-decrement-btn decrement-btn" aria-label="-1 до ${
            b.name
          }" ${b.locked ? "disabled" : ""}>
            <img src="images/heart.svg" alt="-1">
          </button>
          <button class="btn btn-gray boss-lock-btn" aria-label="${
            b.locked ? "Розблокувати" : "Заблокувати"
          } ${b.name}">
            <img src="images/${b.locked ? "unlock" : "lock"}.svg" alt="${
        b.locked ? "Розблокувати" : "Заблокувати"
      }">
          </button>
          <button class="btn btn-red boss-delete-btn" aria-label="Видалити ${
            b.name
          }">
            <img src="images/trash.svg" alt="Видалити">
          </button>
        </div>`;
      bossList.appendChild(li);
    });
  }

  function showMessage(txt) {
    msgDiv.textContent = txt;
    msgDiv.style.opacity = 1;
    setTimeout(() => (msgDiv.style.opacity = 0), 2000);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.bosses = Array.isArray(parsed.bosses)
          ? parsed.bosses.map((b) => ({
              name: b.name || "",
              deaths: typeof b.deaths === "number" ? b.deaths : 0,
              locked: typeof b.locked === "boolean" ? b.locked : false,
            }))
          : [];
        return { totalDeaths: parsed.totalDeaths || 0, bosses: parsed.bosses };
      }
    } catch {}
    return { totalDeaths: 0, bosses: [] };
  }
  let dragSrcIndex = null;

  bossList.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".boss-item");
    if (!li) return;
    dragSrcIndex = Number(li.dataset.index);
    e.dataTransfer.effectAllowed = "move";
  });

  bossList.addEventListener("dragover", (e) => {
    e.preventDefault();
    const li = e.target.closest(".boss-item");
    if (li) li.classList.add("drag-over");
  });

  bossList.addEventListener("dragleave", (e) => {
    const li = e.target.closest(".boss-item");
    if (li) li.classList.remove("drag-over");
  });

  bossList.addEventListener("dragend", (e) => {
    bossList.querySelectorAll(".boss-item.drag-over").forEach((li) => {
      li.classList.remove("drag-over");
    });
  });

  bossList.addEventListener("drop", (e) => {
    const li = e.target.closest(".boss-item");
    if (!li || dragSrcIndex === null) return;
    const dropIndex = Number(li.dataset.index);
    if (dropIndex !== dragSrcIndex) {
      const [moved] = data.bosses.splice(dragSrcIndex, 1);
      data.bosses.splice(dropIndex, 0, moved);
      saveData();
      updateUI();
    }
    li.classList.remove("drag-over");
    dragSrcIndex = null;
  });

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
});
