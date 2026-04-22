// ===============================
// 1) DOM references
// ===============================
const actions = document.getElementById("resourceActions");
const resourceNameCnt = document.getElementById("resourceNameCnt");
const resourceDescriptionCnt = document.getElementById("resourceDescriptionCnt");
const role = "admin";

let createButton = null;
let primaryActionButton = null;
let clearButton = null;
let updateButton = null;
let deleteButton = null;

let resourceNameValid = false;
let resourceDescriptionValid = false;
let formMode = "create";

// ===============================
// 2) Button creation helpers
// ===============================
const BUTTON_BASE_CLASSES =
  "w-full rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";

const BUTTON_ENABLED_CLASSES =
  "bg-brand-primary text-white hover:bg-brand-dark/80 shadow-soft";

function addButton({ label, type = "button", value, classes = "" }) {
  const btn = document.createElement("button");
  btn.type = type;
  btn.textContent = label;
  btn.name = "action";
  if (value) btn.value = value;
  btn.className = `${BUTTON_BASE_CLASSES} ${classes}`.trim();
  actions.appendChild(btn);
  return btn;
}

function setButtonEnabled(btn, enabled) {
  if (!btn) return;

  btn.disabled = !enabled;
  btn.classList.toggle("cursor-not-allowed", !enabled);
  btn.classList.toggle("opacity-50", !enabled);

  if (!enabled) {
    btn.classList.remove("hover:bg-brand-dark/80");
  } else if (btn.value === "create" || btn.value === "update") {
    btn.classList.add("hover:bg-brand-dark/80");
  }
}

function renderActionButtons(currentRole) {
  actions.innerHTML = "";
  createButton = null;
  updateButton = null;
  deleteButton = null;
  clearButton = null;

  if (currentRole === "admin" && formMode === "create") {
    createButton = addButton({
      label: "Create",
      type: "submit",
      value: "create",
      classes: BUTTON_ENABLED_CLASSES,
    });

    clearButton = addButton({
      label: "Clear",
      type: "button",
      classes: BUTTON_ENABLED_CLASSES,
    });

    setButtonEnabled(createButton, false);
    primaryActionButton = createButton;
    setButtonEnabled(clearButton, true);
    clearButton.addEventListener("click", clearResourceForm);
  }

  if (currentRole === "admin" && formMode === "edit") {
    updateButton = addButton({
      label: "Update",
      type: "submit",
      value: "update",
      classes: BUTTON_ENABLED_CLASSES,
    });

    deleteButton = addButton({
      label: "Delete",
      type: "submit",
      value: "delete",
      classes: BUTTON_ENABLED_CLASSES,
    });

    setButtonEnabled(updateButton, false);
    primaryActionButton = updateButton;
    setButtonEnabled(deleteButton, true);
  }
}

// ==========================================
// 3) Input creation + validation + clearing
// ==========================================
function createResourceNameInput(container) {
  const input = document.createElement("input");
  input.id = "resourceName";
  input.name = "resourceName";
  input.type = "text";
  input.placeholder = "e.g., Meeting Room A";
  input.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white
    px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30
    transition-all duration-200 ease-out
  `;

  container.appendChild(input);
  return input;
}

function isResourceNameValid(value) {
  const trimmed = value.trim();
  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ ,.-]+$/;
  const lengthValid = trimmed.length >= 5 && trimmed.length <= 30;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function createResourceDescriptionArea(container) {
  const textarea = document.createElement("textarea");
  textarea.id = "resourceDescription";
  textarea.name = "resourceDescription";
  textarea.rows = 5;
  textarea.placeholder =
    "Describe location, capacity, included equipment, or any usage notes...";
  textarea.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 transition-all duration-200 ease-out
  `;

  container.appendChild(textarea);
  return textarea;
}

function isResourceDescriptionValid(value) {
  const trimmed = value.trim();
  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ ,.-]+$/;
  const lengthValid = trimmed.length >= 10 && trimmed.length <= 50;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function setInputVisualState(input, state) {
  input.classList.remove(
    "border-green-500",
    "bg-green-100",
    "focus:ring-green-500/30",
    "border-red-500",
    "bg-red-100",
    "focus:ring-red-500/30",
    "focus:border-brand-blue",
    "focus:ring-brand-blue/30"
  );

  input.classList.add("focus:ring-2");

  if (state === "valid") {
    input.classList.add(
      "border-green-500",
      "bg-green-100",
      "focus:ring-green-500/30"
    );
  } else if (state === "invalid") {
    input.classList.add(
      "border-red-500",
      "bg-red-100",
      "focus:ring-red-500/30"
    );
  }
}

function attachResourceNameValidation(input) {
  const update = () => {
    const raw = input.value;
    if (raw.trim() === "") {
      resourceNameValid = false;
      setInputVisualState(input, "neutral");
      setButtonEnabled(primaryActionButton, false);
      return;
    }

    resourceNameValid = isResourceNameValid(raw);
    setInputVisualState(input, resourceNameValid ? "valid" : "invalid");
    setButtonEnabled(primaryActionButton, resourceNameValid && resourceDescriptionValid);
  };

  input.addEventListener("input", update);
  update();
}

function attachResourceDescriptionValidation(input) {
  const update = () => {
    const raw = input.value;
    if (raw.trim() === "") {
      resourceDescriptionValid = false;
      setInputVisualState(input, "neutral");
      setButtonEnabled(primaryActionButton, false);
      return;
    }

    resourceDescriptionValid = isResourceDescriptionValid(raw);
    setInputVisualState(input, resourceDescriptionValid ? "valid" : "invalid");
    setButtonEnabled(primaryActionButton, resourceNameValid && resourceDescriptionValid);
  };

  input.addEventListener("input", update);
  update();
}

function clearResourceForm() {
  resourceNameInput.value = "";
  resourceNameInput.dispatchEvent(new Event("input", { bubbles: true }));

  resourceDescriptionArea.value = "";
  resourceDescriptionArea.dispatchEvent(new Event("input", { bubbles: true }));

  const defaultAvailable = document.getElementById("resourceAvailable");
  if (defaultAvailable) {
    defaultAvailable.checked = false;
  }

  const priceInput = document.getElementById("resourcePrice");
  if (priceInput) {
    priceInput.value = "";
  }

  const defaultUnit = document.querySelector(
    'input[name="resourcePriceUnit"][value="hour"]'
  );
  if (defaultUnit) {
    defaultUnit.checked = true;
  }

  setButtonEnabled(primaryActionButton, false);
}

// ===============================
// 4) Bootstrapping
// ===============================
renderActionButtons(role);

const resourceNameInput = createResourceNameInput(resourceNameCnt);
attachResourceNameValidation(resourceNameInput);

const resourceDescriptionArea = createResourceDescriptionArea(resourceDescriptionCnt);
attachResourceDescriptionValidation(resourceDescriptionArea);

window.onResourceActionSuccess = ({ action, data }) => {
  if (action === "create" && data === "success") {
    formMode = "edit";
    renderActionButtons(role);
    attachResourceNameValidation(resourceNameInput);
    attachResourceDescriptionValidation(resourceDescriptionArea);
  }
};
