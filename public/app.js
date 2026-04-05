const tabButtons = document.querySelectorAll(".tab-button");
const tabs = document.querySelector(".tabs");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const feedback = document.getElementById("feedback");
const profileOutput = document.getElementById("profile-output");
const profileEmpty = document.getElementById("profile-empty");
const productSwitcher = document.querySelector(".product-switcher");
const productButtons = document.querySelectorAll(".product-button");
const logoutButton = document.getElementById("logout-button");
const loginSubmitButton = loginForm.querySelector('button[type="submit"]');
const registerSubmitButton = registerForm.querySelector('button[type="submit"]');
const passwordToggleButtons = document.querySelectorAll(".password-toggle");
const introTitle = document.querySelector(".auth-panel__intro h2");
const introDescription = document.querySelector(".auth-panel__intro p:last-child");
const productDestination = document.getElementById("product-destination");
const openProductLink = document.getElementById("open-product-link");
const metricProduct = document.getElementById("metric-product");
const metricStatus = document.getElementById("metric-status");
const metricRole = document.getElementById("metric-role");
const metricEmail = document.getElementById("metric-email");

const TOKEN_KEY = "login-system-token";
const PRODUCT_URLS = {
  erp: "http://localhost:3002",
  "help-desk": "http://localhost:3003"
};
const PRODUCT_COPY = {
  erp: {
    title: "Entre na sua conta",
    description: "Faça login para acessar o ERP ou crie uma conta para testar o fluxo completo.",
    label: "ERP"
  },
  "help-desk": {
    title: "Acesse seu painel de suporte",
    description:
      "Entre para acompanhar tickets, filas e atendimento do Help Desk ou crie sua conta de teste.",
    label: "Help Desk"
  }
};

function setActiveTab(tabName) {
  tabs.dataset.active = tabName;

  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });

  loginForm.classList.toggle("is-visible", tabName === "login");
  registerForm.classList.toggle("is-visible", tabName === "register");
  clearFeedback();
}

function getSelectedProduct() {
  return productSwitcher.dataset.product || "erp";
}

function updateProductCopy(product) {
  const copy = PRODUCT_COPY[product] || PRODUCT_COPY.erp;
  const destinationUrl = PRODUCT_URLS[product] || PRODUCT_URLS.erp;

  productSwitcher.dataset.product = product;
  introTitle.textContent = copy.title;
  introDescription.textContent = copy.description;
  metricProduct.textContent = copy.label;
  productDestination.textContent = `Destino após login: ${copy.label} em ${destinationUrl}`;
  openProductLink.href = destinationUrl;
  openProductLink.textContent = `Abrir ${copy.label}`;

  productButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.product === product);
  });
}

function redirectToSelectedProduct() {
  const product = getSelectedProduct();
  const destinationUrl = PRODUCT_URLS[product] || PRODUCT_URLS.erp;

  window.location.href = destinationUrl;
}

function setFeedback(type, message) {
  feedback.className = "feedback";
  feedback.textContent = message;

  if (type) {
    feedback.classList.add(`is-${type}`);
  }
}

function clearFeedback() {
  setFeedback("", "");
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function setButtonLoading(button, loadingText) {
  button.disabled = true;
  button.classList.add("is-loading");
  button.textContent = loadingText;
}

function resetButton(button) {
  button.disabled = false;
  button.classList.remove("is-loading");
  button.textContent = button.dataset.idleText;
}

function setTabsDisabled(disabled) {
  tabButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function renderProfile(data) {
  profileEmpty.style.display = "none";
  profileOutput.classList.add("is-visible");
  profileOutput.textContent = JSON.stringify(data, null, 2);
  metricProduct.textContent = PRODUCT_COPY[getSelectedProduct()].label;
  metricStatus.textContent = "Online";
  metricRole.textContent = data.user?.role || "user";
  metricEmail.textContent = data.user?.email || "Sem sessão";
}

function resetProfile() {
  profileEmpty.style.display = "block";
  profileOutput.classList.remove("is-visible");
  profileOutput.textContent = "";
  metricProduct.textContent = PRODUCT_COPY[getSelectedProduct()].label;
  metricStatus.textContent = "Offline";
  metricRole.textContent = "Visitante";
  metricEmail.textContent = "Sem sessão";
}

function parseErrorMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return "Não foi possível concluir a operação.";
  }

  if (payload.issues) {
    const detailedMessage = Object.values(payload.issues)
      .flat()
      .filter(Boolean)
      .join(" ");

    if (detailedMessage) {
      return detailedMessage;
    }
  }

  if (payload.message) {
    return payload.message;
  }

  return "Não foi possível concluir a operação.";
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(parseErrorMessage(payload));
  }

  return payload;
}

async function loadProfile() {
  const token = getToken();

  if (!token) {
    resetProfile();
    return;
  }

  try {
    const payload = await request("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    renderProfile(payload);
  } catch (error) {
    clearToken();
    resetProfile();
    setFeedback("error", error.message);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();
  setTabsDisabled(true);
  setButtonLoading(loginSubmitButton, "Entrando...");

  const formData = new FormData(loginForm);
  const body = Object.fromEntries(formData.entries());

  try {
    const payload = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });

    saveToken(payload.token);
    setFeedback("success", payload.message);
    await loadProfile();
    loginForm.reset();
    setTimeout(() => {
      redirectToSelectedProduct();
    }, 450);
  } catch (error) {
    setFeedback("error", error.message);
  } finally {
    resetButton(loginSubmitButton);
    setTabsDisabled(false);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();
  setTabsDisabled(true);
  setButtonLoading(registerSubmitButton, "Criando conta...");

  const formData = new FormData(registerForm);
  const body = Object.fromEntries(formData.entries());

  try {
    const payload = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    });

    saveToken(payload.token);
    setActiveTab("login");
    setFeedback("success", payload.message);
    await loadProfile();
    registerForm.reset();
    setTimeout(() => {
      redirectToSelectedProduct();
    }, 450);
  } catch (error) {
    setFeedback("error", error.message);
  } finally {
    resetButton(registerSubmitButton);
    setTabsDisabled(false);
  }
});

logoutButton.addEventListener("click", async () => {
  clearFeedback();
  setButtonLoading(logoutButton, "Saindo...");

  try {
    clearToken();
    resetProfile();
    setActiveTab("login");
    setFeedback("success", "Sessão encerrada.");
  } finally {
    resetButton(logoutButton);
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

productButtons.forEach((button) => {
  button.addEventListener("click", () => updateProductCopy(button.dataset.product));
});

passwordToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.parentElement.querySelector("input");
    const shouldShow = field.type === "password";

    field.type = shouldShow ? "text" : "password";
    button.classList.toggle("is-active", shouldShow);
    button.setAttribute("aria-label", shouldShow ? "Ocultar senha" : "Mostrar senha");
  });
});

updateProductCopy(getSelectedProduct());
loadProfile();
