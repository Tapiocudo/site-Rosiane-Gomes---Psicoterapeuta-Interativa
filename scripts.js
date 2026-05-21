const form = document.querySelector("#userForm");
const clearButton = document.querySelector("#clearForm");
const statusMessage = document.querySelector("#formStatus");
const storageKey = "userRegistrationForm";

const fields = [
  "name",
  "email",
  "phone",
  "cep",
  "street",
  "number",
  "complement",
  "neighborhood",
  "city",
  "state",
];

const addressFields = {
  street: "logradouro",
  neighborhood: "bairro",
  city: "localidade",
  state: "uf",
};

const getField = (fieldName) => form.elements[fieldName];

const onlyNumbers = (value) => value.replace(/\D/g, "");

const formatCep = (value) => {
  const digits = onlyNumbers(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
};

const showStatus = (message, type = "") => {
  statusMessage.textContent = message;
  statusMessage.className = `form-status ${type}`.trim();
};

const getFormData = () =>
  fields.reduce((data, fieldName) => {
    data[fieldName] = getField(fieldName).value;
    return data;
  }, {});

const saveFormData = () => {
  localStorage.setItem(storageKey, JSON.stringify(getFormData()));
};

const restoreFormData = () => {
  const storedData = localStorage.getItem(storageKey);

  if (!storedData) {
    return;
  }

  try {
    const data = JSON.parse(storedData);

    fields.forEach((fieldName) => {
      getField(fieldName).value = data[fieldName] || "";
    });

    showStatus("Dados restaurados do navegador.", "success");
  } catch {
    localStorage.removeItem(storageKey);
  }
};

const fillAddress = (address) => {
  Object.entries(addressFields).forEach(([fieldName, apiField]) => {
    getField(fieldName).value = address[apiField] || "";
  });

  saveFormData();
};

const fetchAddressByCep = async (cep) => {
  const cleanCep = onlyNumbers(cep);

  if (cleanCep.length !== 8) {
    return;
  }

  showStatus("Buscando endereço pelo CEP...");

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      throw new Error("Erro ao consultar o ViaCEP.");
    }

    const address = await response.json();

    if (address.erro) {
      showStatus("CEP não encontrado. Verifique o número digitado.", "error");
      return;
    }

    fillAddress(address);
    showStatus("Endereço preenchido automaticamente.", "success");
  } catch {
    showStatus("Não foi possível buscar o CEP agora. Tente novamente.", "error");
  }
};

form.addEventListener("input", (event) => {
  if (event.target.name === "cep") {
    event.target.value = formatCep(event.target.value);
  }

  saveFormData();
});

getField("cep").addEventListener("blur", (event) => {
  fetchAddressByCep(event.target.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveFormData();
  showStatus("Cadastro salvo no navegador.", "success");
});

clearButton.addEventListener("click", () => {
  form.reset();
  localStorage.removeItem(storageKey);
  showStatus("Dados removidos do navegador.");
  getField("name").focus();
});

restoreFormData();
