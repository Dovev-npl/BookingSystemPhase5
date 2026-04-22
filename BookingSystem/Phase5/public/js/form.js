function $(id) {
  return document.getElementById(id);
}

function getFormMessageEl() {
  return document.getElementById("formMessage");
}

function showFormMessage(type, message) {
  const el = getFormMessageEl();
  if (!el) return;

  el.className = "mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-line";
  el.classList.remove("hidden");

  if (type === "success") {
    el.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-900");
  } else if (type === "info") {
    el.classList.add("border-amber-200", "bg-amber-50", "text-amber-900");
  } else {
    el.classList.add("border-rose-200", "bg-rose-50", "text-rose-900");
  }

  el.textContent = message;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearFormMessage() {
  const el = getFormMessageEl();
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return { ok: false, error: "Invalid JSON response" };
    }
  }

  const text = await response.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Non-JSON response", raw: text };
  }
}

function buildValidationMessage(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "Validation failed. Please check your input fields.";
  }

  return `Your request was blocked by server-side validation:\n\n${errors
    .map((e) => `• ${e.field || "field"}: ${e.msg || "Invalid value"}`)
    .join("\n")}`;
}

function buildGenericErrorMessage(status, body) {
  const details = body?.details ? `\n\nDetails: ${body.details}` : "";
  const error = body?.error ? body.error : "Request failed";
  return `Server returned an error (${status}).\n\nReason: ${error}${details}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("resourceForm");
  if (!form) return;
  form.addEventListener("submit", onSubmit);
});

async function onSubmit(event) {
  event.preventDefault();

  const submitter = event.submitter;
  const actionValue = submitter && submitter.value ? submitter.value : "create";

  const selectedUnit =
    document.querySelector('input[name="resourcePriceUnit"]:checked')?.value ?? "";

  const priceRaw = $("resourcePrice")?.value ?? "";
  const resourcePrice = priceRaw === "" ? 0 : Number(priceRaw);

  const payload = {
    action: actionValue,
    resourceName: $("resourceName")?.value ?? "",
    resourceDescription: $("resourceDescription")?.value ?? "",
    resourceAvailable: $("resourceAvailable")?.checked ?? false,
    resourcePrice,
    resourcePriceUnit: selectedUnit,
  };

  try {
    clearFormMessage();

    const response = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      if (response.status === 400) {
        showFormMessage(
          "error",
          "Invalid input. Please check all required fields.\n" +
            buildValidationMessage(body?.errors)
        );
        return;
      }

      if (response.status === 409) {
        showFormMessage(
          "error",
          body?.details ||
            "A resource with the same name already exists. Please choose another name."
        );
        return;
      }

      showFormMessage("error", buildGenericErrorMessage(response.status, body));
      return;
    }

    showFormMessage("success", "Resource added successfully.");

    if (typeof window.onResourceActionSuccess === "function") {
      window.onResourceActionSuccess({
        action: actionValue,
        data: "success",
      });
    }
  } catch (error) {
    console.error("POST error:", error);
    showFormMessage(
      "error",
      "Network error: Could not reach the server. Check your environment and try again."
    );
  }
}
