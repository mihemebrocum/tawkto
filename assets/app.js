(function () {
  const config = window.SURVEY_CONFIG || {};
  const form = document.getElementById("surveyForm");
  const ageField = document.getElementById("ageField");
  const ageInput = document.getElementById("age");
  const chatButton = document.getElementById("chatButton");
  const statusBox = document.getElementById("statusBox");
  const submitButton = form.querySelector("button[type='submit']");

  const googleUrl = config.googleAppsScriptUrl || "";
  const tawkScriptUrl = config.tawkScriptUrl || "";

  const isPlaceholder = (value) => !value || value.includes("PASTE_YOUR_");

  if (!isPlaceholder(googleUrl)) {
    form.action = googleUrl;
  }

  setupConsentBehavior();
  setupFormSubmission();
  setupChat();

  function setupConsentBehavior() {
    document.querySelectorAll('input[name="consent"]').forEach((input) => {
      input.addEventListener("change", () => {
        const consent = getConsentValue();

        if (consent === "Yes") {
          ageField.classList.remove("hidden");
          ageInput.required = true;
        } else {
          ageField.classList.add("hidden");
          ageInput.required = false;
          ageInput.value = "";
          chatButton.classList.add("hidden");
        }

        clearStatus();
      });
    });
  }

  function setupFormSubmission() {
    form.addEventListener("submit", (event) => {
      clearStatus();

      if (isPlaceholder(googleUrl)) {
        event.preventDefault();
        showStatus("Please paste your Google Apps Script Web App URL into index.html first.", "error");
        return;
      }

      const consent = getConsentValue();

      if (!consent) {
        event.preventDefault();
        showStatus("Please choose Yes or No for consent.", "error");
        return;
      }

      if (consent === "Yes") {
        const age = Number(ageInput.value);
        if (!age || age < 1 || age > 120) {
          event.preventDefault();
          showStatus("Please enter a valid age between 1 and 120.", "error");
          return;
        }
      }

      document.getElementById("submittedAt").value = new Date().toISOString();
      document.getElementById("pageUrl").value = window.location.href;
      document.getElementById("userAgent").value = navigator.userAgent;
      document.getElementById("timeZone").value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";

      // We submit to a hidden iframe to avoid CORS problems.
      // The exact success response cannot be read because the iframe is cross-origin,
      // but Apps Script will still append the row to Google Sheets.
      window.setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = "Submit answers";

        if (consent === "Yes") {
          showStatus("Thank you. Your answer has been submitted. You may now start the chat.", "success");
          chatButton.classList.remove("hidden");
        } else {
          showStatus("Thank you. Your response has been recorded.", "success");
          chatButton.classList.add("hidden");
        }
      }, 900);
    });
  }

  function setupChat() {
    chatButton.addEventListener("click", openChat);

    if (isPlaceholder(tawkScriptUrl)) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    window.Tawk_API.onLoad = function () {
      if (typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = tawkScriptUrl;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);
  }

  function openChat() {
    if (isPlaceholder(tawkScriptUrl)) {
      showStatus("Please paste your Tawk.to widget script URL into index.html first.", "error");
      return;
    }

    if (window.Tawk_API && typeof window.Tawk_API.showWidget === "function") {
      window.Tawk_API.showWidget();
    }

    if (window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
      window.Tawk_API.maximize();
      return;
    }

    if (window.Tawk_API && typeof window.Tawk_API.toggle === "function") {
      window.Tawk_API.toggle();
      return;
    }

    showStatus("Chat is still loading. Please try again in a moment.", "error");
  }

  function getConsentValue() {
    return document.querySelector('input[name="consent"]:checked')?.value || "";
  }

  function showStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = `status ${type}`;
  }

  function clearStatus() {
    statusBox.textContent = "";
    statusBox.className = "status hidden";
  }
})();
