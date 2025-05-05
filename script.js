document.addEventListener("DOMContentLoaded", () => {
  const totalDeathsCountElement = document.getElementById("total-deaths-count");
  const incrementTotalBtn = document.getElementById("increment-total-btn");
  const decrementTotalBtn = document.getElementById("decrement-total-btn");
  const bossNameInput = document.getElementById("boss-name-input");
  const addBossBtn = document.getElementById("add-boss-btn");
  const bossListElement = document.getElementById("boss-list");

  const STORAGE_KEY = "darkSoulsDeathCounterData";

  const defaultData = {
    totalDeaths: 0,
    bosses: [],
  };

  let data = loadData();

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const bosses = Array.isArray(parsedData.bosses)
          ? parsedData.bosses
          : [];
        const validBosses = bosses.map((b) => ({
          name: typeof b.name === "string" ? b.name : "Невідомий Бос",
          deaths: typeof b.deaths === "number" && b.deaths >= 0 ? b.deaths : 0,
        }));
        return {
          totalDeaths:
            typeof parsedData.totalDeaths === "number" &&
            parsedData.totalDeaths >= 0
              ? parsedData.totalDeaths
              : 0,
          bosses: validBosses,
        };
      } catch (error) {
        console.error("Помилка завантаження даних з localStorage:", error);
        return JSON.parse(JSON.stringify(defaultData));
      }
    }
    return JSON.parse(JSON.stringify(defaultData));
  }

  function updateTotalDisplay() {
    totalDeathsCountElement.textContent = data.totalDeaths;
  }

  function renderBossList() {
    bossListElement.innerHTML = "";

    data.bosses.forEach((boss, index) => {
      const li = document.createElement("li");
      li.classList.add("boss-item");
      li.dataset.index = index;

      li.innerHTML = `
              <div class="boss-info">
                  <span class="boss-name">${escapeHtml(boss.name)}</span>
                  <span class="boss-death-count">Смертей: ${boss.deaths}</span>
              </div>
              <div class="boss-button-group">
                  <button class="btn boss-increment-btn increment-btn">+1</button>
                  <button class="btn boss-decrement-btn decrement-btn">-1</button> </div>
          `;

      const incrementBossBtn = li.querySelector(".boss-increment-btn");
      incrementBossBtn.addEventListener("click", () => {
        incrementBossDeaths(index);
      });

      const decrementBossBtn = li.querySelector(".boss-decrement-btn");
      decrementBossBtn.addEventListener("click", () => {
        decrementBossDeaths(index);
      });

      bossListElement.appendChild(li);
    });
  }

  function escapeHtml(unsafe) {
    if (typeof unsafe !== "string") return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function incrementTotalDeaths() {
    data.totalDeaths++;
    updateTotalDisplay();
    saveData();
  }

  function decrementTotalDeaths() {
    if (data.totalDeaths > 0) {
      data.totalDeaths--;
      updateTotalDisplay();
      saveData();
    }
  }

  function incrementBossDeaths(bossIndex) {
    if (bossIndex >= 0 && bossIndex < data.bosses.length) {
      data.bosses[bossIndex].deaths++;
      data.totalDeaths++;
      updateTotalDisplay();
      renderBossList();
      saveData();
    } else {
      console.error("Невірний індекс боса для збільшення:", bossIndex);
    }
  }

  function decrementBossDeaths(bossIndex) {
    if (bossIndex >= 0 && bossIndex < data.bosses.length) {
      if (data.bosses[bossIndex].deaths > 0 && data.totalDeaths > 0) {
        data.bosses[bossIndex].deaths--;
        data.totalDeaths--;
        updateTotalDisplay();
        renderBossList();
        saveData();
      } else {
        console.log("Неможливо зменшити кількість смертей нижче нуля.");
      }
    } else {
      console.error("Невірний індекс боса для зменшення:", bossIndex);
    }
  }

  function addBoss() {
    const bossName = bossNameInput.value.trim();
    if (bossName === "") {
      alert("Будь ласка, введіть ім'я боса.");
      return;
    }

    const existingBoss = data.bosses.find(
      (boss) => boss.name.toLowerCase() === bossName.toLowerCase()
    );
    if (existingBoss) {
      alert(`Бос "${escapeHtml(bossName)}" вже існує у списку.`);
      return;
    }

    data.bosses.push({ name: bossName, deaths: 0 });
    bossNameInput.value = "";
    renderBossList();
    saveData();
  }

  incrementTotalBtn.addEventListener("click", incrementTotalDeaths);
  decrementTotalBtn.addEventListener("click", decrementTotalDeaths);
  addBossBtn.addEventListener("click", addBoss);

  bossNameInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      addBoss();
    }
  });

  updateTotalDisplay();
  renderBossList();
});
