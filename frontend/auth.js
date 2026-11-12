const passwordToggles = document.querySelectorAll("[data-password-toggle]");

document.querySelectorAll(".auth-form input[readonly]").forEach(input => {
  input.addEventListener("focus", () => input.removeAttribute("readonly"), { once: true });
});

passwordToggles.forEach(toggle => {
  toggle.addEventListener("click", () => {
    const password = document.getElementById(toggle.dataset.passwordToggle);
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    toggle.textContent = visible ? "Hide" : "Show";
    toggle.setAttribute("aria-label", `${visible ? "Hide" : "Show"} password`);
    toggle.setAttribute("aria-pressed", String(visible));
  });
});

const loginForm = document.getElementById("login-form");
if (loginForm) {
  const feedback = document.getElementById("login-feedback");
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    feedback.textContent = "";
    if (!loginForm.reportValidity()) return;
    feedback.textContent = "Login is not connected yet. No credentials were sent or saved.";
    feedback.classList.add("is-visible");
  });
  document.getElementById("forgot-password").addEventListener("click", event => {
    event.preventDefault();
    feedback.textContent = "Password recovery will be available when account access is connected.";
    feedback.classList.add("is-visible");
  });
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  const fullName = document.getElementById("full-name");
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("signup-password");
  const confirmPassword = document.getElementById("confirm-password");
  const terms = document.getElementById("terms");
  const feedback = document.getElementById("signup-feedback");
  const strengthMeter = document.getElementById("strength-meter");
  const strengthLabel = document.getElementById("strength-label");

  const requirements = {
    length: value => value.length >= 8,
    letter: value => /[a-z]/.test(value) && /[A-Z]/.test(value),
    number: value => /\d/.test(value)
  };

  function setError(id, message) {
    const element = document.getElementById(id);
    element.textContent = message;
    element.classList.toggle("is-visible", Boolean(message));
  }

  function validatePassword() {
    const value = password.value;
    const passed = Object.entries(requirements).filter(([, check]) => check(value)).map(([name]) => name);
    document.querySelectorAll("[data-requirement]").forEach(item => {
      item.classList.toggle("is-met", passed.includes(item.dataset.requirement));
    });
    const score = passed.length;
    strengthMeter.style.width = `${score * 33.333}%`;
    strengthMeter.dataset.level = score === 3 ? "strong" : score === 2 ? "medium" : score === 1 ? "weak" : "";
    strengthLabel.textContent = value ? ["Add a little more", "Getting there", "Almost there", "Strong password"][score] : "Password strength";
    const valid = score === 3;
    password.setCustomValidity(valid || !value ? "" : "Meet all password requirements.");
    setError("signup-password-error", value && !valid ? "Meet all password requirements above." : "");
    if (confirmPassword.value) validateConfirmation();
  }

  function validateConfirmation() {
    const mismatch = Boolean(confirmPassword.value) && confirmPassword.value !== password.value;
    confirmPassword.setCustomValidity(mismatch ? "Passwords do not match." : "");
    setError("confirm-password-error", mismatch ? "Passwords do not match." : "");
  }

  password.addEventListener("input", validatePassword);
  confirmPassword.addEventListener("input", validateConfirmation);
  username.addEventListener("input", () => {
    username.setCustomValidity(username.validity.patternMismatch ? "Use only letters, numbers, and underscores." : "");
    setError("username-error", username.validity.patternMismatch ? "Use only letters, numbers, and underscores." : "");
  });
  signupForm.addEventListener("submit", event => {
    event.preventDefault();
    feedback.textContent = "";
    validatePassword();
    validateConfirmation();
    if (!fullName.value.trim()) setError("full-name-error", "Please enter your name.");
    else setError("full-name-error", "");
    if (!email.validity.valid) setError("email-error", "Enter a valid email address.");
    else setError("email-error", "");
    setError("terms-error", terms.checked ? "" : "Please accept the Terms and Conditions to continue.");

    if (!signupForm.reportValidity() || !fullName.value.trim() || !terms.checked) return;
    feedback.textContent = "Account creation is not connected yet. No information was sent or saved.";
    feedback.classList.add("is-visible");
  });
}
