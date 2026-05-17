(function () {
  const config = window.SURVEY_CONFIG || {};
  const form = document.getElementById("surveyForm");
  const chatButton = document.getElementById("chatButton");
  const statusBox = document.getElementById("statusBox");
  const submitButton = form.querySelector("button[type='submit']");

  const googleUrl = config.googleAppsScriptUrl || "";
  const tawkScriptUrl = config.tawkScriptUrl || "";

  const isPlaceholder = (value) => !value || value.includes("PASTE_YOUR_");

  if (!isPlaceholder(googleUrl)) {
    form.action = googleUrl;
  }

  setupAnswerBehavior();
  setupFormSubmission();
  setupChat();

  function setupAnswerBehavior() {
    document.querySelectorAll('input[name="relationshipStatus"]').forEach((input) => {
      input.addEventListener("change", () => {
        chatButton.classList.add("hidden");
        clearStatus();
      });
    });
  }

  function setupFormSubmission() {
    form.addEventListener("submit", (event) => {
      clearStatus();

      if (isPlaceholder(googleUrl)) {
        event.preventDefault();
        showStatus("Önce index.html içindeki Google Apps Script Web App URL'sini eklemelisiniz.", "error");
        return;
      }

      const relationshipStatus = getRelationshipStatus();

      if (!relationshipStatus) {
        event.preventDefault();
        showStatus("Lütfen evet veya hayır seçeneklerinden birini seçin.", "error");
        return;
      }

      document.getElementById("submittedAt").value = new Date().toISOString();
      document.getElementById("pageUrl").value = window.location.href;
      document.getElementById("userAgent").value = navigator.userAgent;
      document.getElementById("timeZone").value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

      submitButton.disabled = true;
      submitButton.textContent = "Gönderiliyor...";

      // Hidden iframe ile gönderiyoruz; bu sayede CORS sorunu çıkmadan
      // Google Apps Script cevabı Google Sheet'e ekleyebilir.
      window.setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = "Cevabımı gönder";

        if (relationshipStatus === "Hayatımda biri yok") {
          showStatus("Teşekkür ederim. Cevabın gönderildi. İstersen benimle buradan iletişime geçebilirsin.", "success");
          chatButton.classList.remove("hidden");
        } else {
          showStatus("Teşekkür ederim. Cevabın gönderildi. Seni rahatsız etmeyeceğim.", "success");
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
      showStatus("Önce index.html içindeki Tawk.to widget script URL'sini eklemelisiniz.", "error");
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

    showStatus("Sohbet yükleniyor. Lütfen birkaç saniye sonra tekrar deneyin.", "error");
  }

  function getRelationshipStatus() {
    return document.querySelector('input[name="relationshipStatus"]:checked')?.value || "";
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
