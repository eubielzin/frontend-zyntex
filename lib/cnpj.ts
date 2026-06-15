export function onlyCnpjDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function formatCNPJ(value: string) {
  return onlyCnpjDigits(value)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18)
}

export function isValidCNPJ(value: string) {
  const cnpj = onlyCnpjDigits(value)

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => {
      return total + Number(base[index]) * weight
    }, 0)
    const rest = sum % 11

    return rest < 2 ? 0 : 11 - rest
  }

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ])
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ])

  return cnpj.endsWith(`${firstDigit}${secondDigit}`)
}

export function getIndustriaApiErrorMessage(status: number, errorText: string) {
  const normalized = errorText.toLowerCase()
  const looksLikeDuplicateCnpj =
    normalized.includes("cnpj") &&
    (normalized.includes("duplicate") ||
      normalized.includes("duplic") ||
      normalized.includes("unique") ||
      normalized.includes("constraint") ||
      normalized.includes("uk_") ||
      normalized.includes("key"))

  if (status === 409 || looksLikeDuplicateCnpj) {
    return "Já existe uma indústria cadastrada com este CNPJ."
  }

  if (normalized.includes("cnpj")) {
    return "Não foi possível salvar. Verifique se o CNPJ está correto."
  }

  if (status === 400) {
    return "Não foi possível salvar. Verifique os campos obrigatórios."
  }

  return "Não foi possível salvar a indústria agora. Tente novamente."
}
