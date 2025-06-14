
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
    const url = `https://servicodados.ibge.gov.br/api/v2/municipios/${codigo}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data: MunicipioIBGE[] = await res.json();
    // API retorna array com 1 elemento ou erro
    if (Array.isArray(data) && data.length > 0) {
      const { nome, microrregiao } = data[0];
      const uf = microrregiao.mesorregiao.UF.sigla;
      return `${nome}/${uf}`;
    }
    return "";
  } catch {
    return "";
  }
}
