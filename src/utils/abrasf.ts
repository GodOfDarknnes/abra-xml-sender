
export interface AbrasfResult {
  codigoMunicipio: string;
  deducao: string;
  valorIss: string;
  tomador: string;
}

export function parseAbrasfXml(xmlString: string): AbrasfResult | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Tenta os caminhos mais comuns na NFSe ABRASF
    const getText = (xpath: string): string | null => {
      const result = xmlDoc.evaluate(xpath, xmlDoc, null, XPathResult.STRING_TYPE, null);
      return result.stringValue ? result.stringValue : null;
    };

    // Normaliza diferentes variações possíveis no padrão
    // Exemplo: InfNfse/Servico/CodigoMunicipio
    const codigoMunicipio =
      getText("//*[local-name()='InfNfse']/*[local-name()='Servico']/*[local-name()='CodigoMunicipio']") ||
      getText("//*[local-name()='CodigoMunicipio']") ||
      "";

    const deducao =
      getText("//*[local-name()='InfNfse']/*[local-name()='Servico']/*[local-name()='Valores']/*[local-name()='ValorDeducoes']") ||
      getText("//*[local-name()='ValorDeducoes']") ||
      "";

    const valorIss =
      getText("//*[local-name()='InfNfse']/*[local-name()='Servico']/*[local-name()='Valores']/*[local-name()='ValorIss']") ||
      getText("//*[local-name()='ValorIss']") ||
      "";

    const tomador =
      getText("//*[local-name()='InfNfse']/*[local-name()='TomadorServico']/*[local-name()='RazaoSocial']") ||
      getText("//*[local-name()='TomadorServico']/*[local-name()='RazaoSocial']") ||
      getText("//*[local-name()='RazaoSocial']") ||
      "";

    if (!codigoMunicipio || !valorIss || !tomador) {
      // Campos obrigatórios
      return null;
    }

    return {
      codigoMunicipio: codigoMunicipio.trim(),
      deducao: deducao ? deducao.trim() : "",
      valorIss: valorIss.trim(),
      tomador: tomador.trim(),
    };
  } catch {
    return null;
  }
}
