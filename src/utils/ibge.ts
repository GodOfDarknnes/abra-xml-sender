
export interface MunicipioIBGE {
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  };
}

export async function getMunicipioNomeUf(codigo: string): Promise<string> {
  try {
    console.log("Buscando município na API IBGE, código:", codigo);
    const url = `https://servicodados.ibge.gov.br/api/v2/municipios/${codigo}`;
    const res = await fetch(url);
    console.log("Status IBGE fetch:", res.status, res.statusText);
    if (!res.ok) {
      console.error("Resposta não-ok do IBGE:", res.status, res.statusText);
      throw new Error(`IBGE não retornou OK`);
    }
    const data: MunicipioIBGE[] = await res.json();
    console.log("Resposta JSON IBGE:", data);
    // API retorna array com 1 elemento ou erro
    if (Array.isArray(data) && data.length > 0) {
      const municipio = data[0];
      const nome = municipio.nome;
      const uf = municipio.microrregiao.mesorregiao.UF.sigla;
      console.log("Municipio encontrado:", `${nome}/${uf}`);
      return `${nome}/${uf}`;
    }
    console.error("Array IBGE vazio ou inválido!", data);
    return "";
  } catch (err) {
    console.error("Erro ao buscar município IBGE:", err);
    return "";
  }
}
