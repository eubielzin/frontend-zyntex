type AwesomeCepResponse = {
  cep?: string;
  address_type?: string;
  address_name?: string;
  address?: string;
  state?: string;
  district?: string;
  lat?: string;
  lng?: string;
  city?: string;
};

export type CepAddressData = {
  cep: string;
  logradouro: string;
  tipoLogradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
};

const buildLogradouro = (data: AwesomeCepResponse) => {
  if (data.address?.trim()) return data.address.trim();

  return [data.address_type, data.address_name]
    .filter(Boolean)
    .join(" ")
    .trim();
};

export async function fetchCepData(cep: string): Promise<CepAddressData | null> {
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) return null;

  const response = await fetch(`https://cep.awesomeapi.com.br/json/${cepLimpo}`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar CEP: ${response.status}`);
  }

  const data = (await response.json()) as AwesomeCepResponse;

  if (!data.cep) return null;

  return {
    cep: data.cep,
    logradouro: buildLogradouro(data),
    tipoLogradouro: data.address_type?.trim() || "",
    bairro: data.district?.trim() || "",
    cidade: data.city?.trim() || "",
    estado: data.state?.trim().toUpperCase() || "",
    latitude: data.lat?.trim() || "",
    longitude: data.lng?.trim() || "",
  };
}
