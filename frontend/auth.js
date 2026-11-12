const passwordToggles = document.querySelectorAll("[data-password-toggle]");

const demoProfiles = [
  { id: "olivia-bennett", name: "Olivia Bennett", username: "oliviab", email: "olivia.bennett@example.co.uk", password: "Croissant!Olivia24", location: "London, UK" },
  { id: "james-thompson", name: "James Thompson", username: "jamest", email: "james.thompson@example.co.uk", password: "Croissant!James24", location: "Manchester, UK" },
  { id: "amelia-clarke", name: "Amelia Clarke", username: "ameliac", email: "amelia.clarke@example.co.uk", password: "Croissant!Amelia24", location: "Edinburgh, UK" },
  { id: "noah-patel", name: "Noah Patel", username: "noahp", email: "noah.patel@example.co.uk", password: "Croissant!Noah24", location: "Birmingham, UK" },
  { id: "isla-morgan", name: "Isla Morgan", username: "islam", email: "isla.morgan@example.co.uk", password: "Croissant!Isla24", location: "Cardiff, UK" }
];

const demoSessionKey = "croissant-demo-profile-id";

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
  const identityInput = document.getElementById("login-identity");
  const passwordInput = document.getElementById("login-password");

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    feedback.textContent = "";
    feedback.classList.remove("is-visible", "is-error");
    loginForm.querySelectorAll("input[readonly]").forEach(input => input.removeAttribute("readonly"));
    if (!loginForm.reportValidity()) return;

    const identity = identityInput.value.trim().toLocaleLowerCase();
    const profile = demoProfiles.find(candidate =>
      candidate.email.toLocaleLowerCase() === identity || candidate.username.toLocaleLowerCase() === identity
    );
    if (!profile || profile.password !== passwordInput.value) {
      feedback.textContent = "That demo profile could not be signed in. Check the email/username and password.";
      feedback.classList.add("is-visible", "is-error");
      return;
    }

    sessionStorage.setItem(demoSessionKey, profile.id);
    window.location.assign("dashboard.html");
  });
  document.getElementById("forgot-password").addEventListener("click", event => {
    event.preventDefault();
    feedback.textContent = "Password recovery is not available for demo profiles.";
    feedback.classList.add("is-visible");
  });
}

const dashboard = document.getElementById("demo-dashboard");
if (dashboard) {
  const profileId = sessionStorage.getItem(demoSessionKey);
  const profile = demoProfiles.find(candidate => candidate.id === profileId);
  if (!profile) {
    window.location.replace("login.html");
  } else {
    document.getElementById("dashboard-name").textContent = profile.name;
    document.getElementById("dashboard-email").textContent = profile.email;
    document.getElementById("dashboard-username").textContent = profile.username;
    document.getElementById("dashboard-location").textContent = profile.location;
  }

  document.getElementById("demo-sign-out").addEventListener("click", () => {
    sessionStorage.removeItem(demoSessionKey);
    window.location.assign("login.html");
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
    signupForm.querySelectorAll("input[readonly]").forEach(input => input.removeAttribute("readonly"));
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
