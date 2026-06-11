const shell = document.querySelector(".app-shell");
const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".bottom-nav button");
const themeToggle = document.querySelector("#themeToggle");
const saveState = document.querySelector("#saveState");
const dashboardGrid = document.querySelector("#dashboardGrid");
const createTracker = document.querySelector("#createTracker");
const trackerName = document.querySelector("#trackerName");
const trackerCategory = document.querySelector("#trackerCategory");
const trackerUnit = document.querySelector("#trackerUnit");

let draggedWidget = null;

const widgetPresets = {
  habit: ["Habit Tracker", "Daily routine / streaks", 68, "green"],
  study: ["Study Tracker", "Subjects / sessions / goals", 76, "blue"],
  workout: ["Workout Tracker", "Plans / sets / PRs", 63, "green"],
  nutrition: ["Nutrition Tracker", "Calories / macros / water", 86, "amber"],
  calendar: ["Calendar", "Tasks / meals / sessions", 58, "blue"],
  todo: ["To-Do List", "Projects / subtasks / deadlines", 72, "purple"],
  water: ["Water Intake", "Hydration / reminders", 67, "blue"],
  sleep: ["Sleep Tracker", "Recovery / bedtime / quality", 74, "purple"],
  mood: ["Mood Tracker", "Energy / stress / notes", 61, "purple"],
  reading: ["Reading Tracker", "Books / pages / notes", 54, "amber"],
  finance: ["Finance Tracker", "Budget / savings / spend", 71, "green"],
  tracker: ["Custom Tracker", "Anything you want to measure", 50, "purple"],
  custom: ["Custom Tracker", "Anything you want to measure", 50, "purple"],
};

const savedTheme = localStorage.getItem("momentum-theme");
if (savedTheme) shell.dataset.theme = savedTheme;

const savedAccent = localStorage.getItem("momentum-accent");
if (savedAccent) shell.style.setProperty("--accent", savedAccent);

function setSavedState(text = "Saved") {
  saveState.textContent = text;
  clearTimeout(setSavedState.timeout);
  if (text !== "Saved") {
    setSavedState.timeout = setTimeout(() => {
      saveState.textContent = "Saved";
    }, 900);
  }
}

function activateView(targetId) {
  views.forEach((view) => view.classList.toggle("active", view.id === targetId));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.target === targetId));
  document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.target));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.target));
});

themeToggle.addEventListener("click", () => {
  const nextTheme = shell.dataset.theme === "dark" ? "light" : "dark";
  shell.dataset.theme = nextTheme;
  localStorage.setItem("momentum-theme", nextTheme);
  setSavedState("Theme saved");
});

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach((item) => item.classList.remove("selected"));
    swatch.classList.add("selected");
    shell.style.setProperty("--accent", swatch.dataset.accent);
    localStorage.setItem("momentum-accent", swatch.dataset.accent);
    setSavedState("Color saved");
  });
});

document.querySelectorAll(".layout-options button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".layout-options button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    dashboardGrid.dataset.layout = button.dataset.layout;
    dashboardGrid.classList.toggle("dense-layout", button.dataset.layout === "dense");
    dashboardGrid.classList.toggle("focus-layout", button.dataset.layout === "focus");
    setSavedState("Layout saved");
  });
});

document.querySelectorAll("[data-add-widget]").forEach((button) => {
  button.addEventListener("click", () => {
    addWidget(button.dataset.addWidget);
    activateView("dashboard");
  });
});

createTracker.addEventListener("click", () => {
  const title = trackerName.value.trim() || "Custom tracker";
  const category = trackerCategory.value.trim() || "Personal";
  const unit = trackerUnit.value.trim() || "100%";
  addWidget("custom", { title, subtitle: `${category} / goal ${unit}`, progress: 42 });
  activateView("dashboard");
});

function addWidget(type, override = {}) {
  const preset = widgetPresets[type] || widgetPresets.custom;
  const widget = document.createElement("article");
  widget.className = "widget-card";
  widget.draggable = true;
  widget.dataset.widget = type;
  const title = override.title || preset[0];
  const subtitle = override.subtitle || preset[1];
  const progress = override.progress || preset[2];
  const color = preset[3];

  widget.innerHTML = `
    <div class="widget-head">
      <span class="widget-icon ${color}"></span>
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>
      <div class="widget-actions">
        <button class="resize-widget" aria-label="Resize widget">Resize</button>
        <button class="remove-widget" aria-label="Remove widget">Remove</button>
      </div>
    </div>
    <div class="progress-row"><div class="progress-track"><span style="width: ${progress}%"></span></div><strong>${progress}%</strong></div>
    <div class="macro-row"><span>Milestone active</span><span>Streak tracking on</span><span>Daily / weekly / monthly insights</span></div>
  `;

  dashboardGrid.prepend(widget);
  bindWidget(widget);
  setSavedState("Widget added");
}

function bindWidget(widget) {
  widget.addEventListener("dragstart", (event) => {
    draggedWidget = widget;
    widget.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  widget.addEventListener("dragend", () => {
    widget.classList.remove("dragging");
    draggedWidget = null;
    setSavedState("Order saved");
  });

  widget.querySelector(".remove-widget")?.addEventListener("click", () => {
    widget.remove();
    setSavedState("Widget removed");
  });

  widget.querySelector(".resize-widget")?.addEventListener("click", () => {
    widget.classList.toggle("large");
    setSavedState("Size saved");
  });
}

dashboardGrid.querySelectorAll(".widget-card").forEach(bindWidget);

dashboardGrid.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (!draggedWidget) return;
  const afterElement = getDragAfterElement(dashboardGrid, event.clientY);
  if (afterElement == null) {
    dashboardGrid.appendChild(draggedWidget);
  } else {
    dashboardGrid.insertBefore(draggedWidget, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".widget-card:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

document.querySelectorAll(".calendar-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".calendar-grid button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

document.querySelectorAll(".check-button").forEach((button) => {
  button.addEventListener("click", () => button.classList.toggle("done"));
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}
