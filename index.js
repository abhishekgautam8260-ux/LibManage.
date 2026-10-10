// const ENQUIRY_API = "http://localhost:8080/api/customer-enquiries";
const ENQUIRY_API = "https://seat-manager-backend-production-bb04.up.railway.app/api/customer-enquiries";

document.addEventListener("DOMContentLoaded", function () {
  // =========================================================
  // PAGE ROUTING
  // =========================================================

  const home = document.getElementById("home");
  const enquiry = document.getElementById("enquiry");

  function showPage() {
    const route = window.location.hash;

    if (route === "#/enquiry") {
      home.hidden = true;
      enquiry.hidden = false;

      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      home.hidden = false;
      enquiry.hidden = true;
    }
  }

  // Run when page loads
  showPage();

  // Run whenever hash changes
  window.addEventListener("hashchange", showPage);

  // =========================================================
  // ENQUIRY FORM
  // =========================================================

  const form = document.getElementById("form");

  if (!form) {
    console.error("❌ Enquiry form not found");
    return;
  }

  function setErr(el, msg) {
    const field = el.closest(".f");

    if (!field) {
      return;
    }

    const error = field.querySelector(".err");

    if (error) {
      error.textContent = msg || "";
    }

    if (el.type !== "checkbox") {
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  function validate() {
    let ok = true;

    const f = form.elements;

    function need(el, msg, test) {
      const value = el.value.trim();

      const bad = test ? !test(value) : !value;

      setErr(el, bad ? msg : "");

      if (bad) {
        ok = false;
      }
    }

    // Name
    need(f.name, "Enter your name.");

    // Phone
    need(f.phone, "Enter a valid 10-digit mobile number.", function (v) {
      const phone = v.replace(/[\s-]/g, "");

      return /^(?:\+91|0)?[6-9]\d{9}$/.test(phone);
    });

    // Email
    if (f.email.value.trim()) {
      need(f.email, "Enter a valid email address.", function (v) {
        return /^\S+@\S+\.\S+$/.test(v);
      });
    } else {
      setErr(f.email, "");
    }

    // Library name
    need(f.library, "Enter your library name.");

    // City
    need(f.city, "Enter your city.");

    // Seats
    need(f.seats, "Select the number of seats.");

    // Consent
    if (!f.consent.checked) {
      setErr(f.consent, "Please tick the box so we can contact you.");

      ok = false;
    } else {
      setErr(f.consent, "");
    }

    return ok;
  }

  // =========================================================
  // FORM SUBMIT
  // =========================================================

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formErr = document.getElementById("formErr");

    formErr.textContent = "";

    // Validate
    if (!validate()) {
      const bad = form.querySelector('[aria-invalid="true"]');

      if (bad) {
        bad.focus();
      }

      return;
    }

    const btn = document.getElementById("send");

    btn.disabled = true;
    btn.textContent = "Sending...";

    // =====================================================
    // DATA SENT TO SPRING BOOT
    // =====================================================

    const data = {
      name: form.elements.name.value.trim(),

      phone: form.elements.phone.value.trim(),

      email: form.elements.email.value.trim(),

      libraryName: form.elements.library.value.trim(),

      city: form.elements.city.value.trim(),

      seats: form.elements.seats.value.trim(),

      currentManagement: form.elements.current.value.trim(),

      preferredCallTime: form.elements.time.value.trim(),

      message: form.elements.message.value.trim(),

      consent: form.elements.consent.checked,
    };

    console.log("📤 Sending enquiry:", data);

    try {
      const response = await fetch(ENQUIRY_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const responseText = await response.text();

        console.error("❌ Backend response status:", response.status);
        console.error("❌ Backend response status text:", response.statusText);
        console.error("❌ Backend response body:", responseText);

        let errorMessage = `Backend returned ${response.status}`;

        try {
          const errorData = JSON.parse(responseText);

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (_) {
          if (responseText) {
            errorMessage = responseText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log("✅ Enquiry created successfully:", result);

      // ===================================================
      // SUCCESS SCREEN
      // ===================================================

      document.getElementById("okName").textContent = data.name;

      document.getElementById("okPhone").textContent = data.phone;

      document.getElementById("formBody").hidden = true;

      document.getElementById("ok").hidden = false;
    } catch (error) {
      console.error("❌ Enquiry submission failed:", error);

      formErr.textContent =
        error.message || "We could not send your enquiry. Please try again.";

      btn.disabled = false;

      btn.textContent = "Send enquiry";
    }
  });
});
