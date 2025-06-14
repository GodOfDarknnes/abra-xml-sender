
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { parseAbrasfXml, AbrasfResult } from "@/utils/abrasf";
import { getMunicipioNomeUf } from "@/utils/ibge";
import { ArrowUp, Upload } from "lucide-react";

interface Extrato {
  fileName: string;
  extract: {
    municipio: string;
    deducao: string;
    valor_iss: string;
    tomador: string;
    erro?: string;
  };
}

const Index = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Extrato[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const fArray = Array.from(fileList);
    setFiles(fArray);
    setResults([]);
    setLoading(true);
    const extratos: Extrato[] = [];

    for (const file of fArray) {
      try {
        const text = await file.text();
        const ext = parseAbrasfXml(text);
        if (!ext) {
          extratos.push({
            fileName: file.name,
            extract: { municipio: "", deducao: "", valor_iss: "", tomador: "", erro: "Erro ao ler campos do XML" },
          });
          continue;
        }
        const municipio = await getMunicipioNomeUf(ext.codigoMunicipio);
        extratos.push({
          fileName: file.name,
          extract: {
            municipio,
            deducao: ext.deducao || "",
            valor_iss: ext.valorIss,
            tomador: ext.tomador,
            erro: municipio ? undefined : "Município IBGE não encontrado!",
          },
        });
      } catch (err) {
        extratos.push({ fileName: file.name, extract: { municipio: "", deducao: "", valor_iss: "", tomador: "", erro: "Falha ao processar arquivo" } });
      }
    }

    setResults(extratos);
    setLoading(false);
  };

  const handleSendWebhook = async () => {
    setLoading(true);
    let ok = 0, error = 0;
    for (const { extract } of results) {
      // Só envia se não houver erro e município extraído
      if (extract.erro || !extract.municipio) {
        error++;
        continue;
      }
      try {
        const body = {
          municipio: extract.municipio,
          deducao: extract.deducao ?? "",
          valor_iss: extract.valor_iss,
          tomador: extract.tomador,
        };

        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error();
        ok++;
      } catch {
        error++;
      }
    }
    setLoading(false);
    if (ok > 0) {
      toast({ title: "Sucesso!", description: `${ok} arquivo(s) enviado(s) com sucesso.`, variant: "default" });
    }
    if (error > 0) {
      toast({ title: "Erro em alguns arquivos", description: `${error} arquivo(s) com erro ou sem dados válidos.`, variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-2 py-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">🧾</span>
            Envio de NFS-e (ABRASF) para Webhook Make.com
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5">
            <label className="font-medium">
              URL do Webhook:
              <Input
                type="url"
                placeholder="Cole aqui o endpoint do Webhook Make..."
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                required
                className="mt-1"
                disabled={loading}
              />
            </label>
            <label className="font-medium">
              Upload Arquivo(s) XML NFS-e:
              <Input
                type="file"
                multiple
                accept=".xml"
                onChange={handleUploadFiles}
                required
                className="mt-1"
                disabled={loading}
              />
            </label>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="my-4 text-muted-foreground animate-pulse">Processando...</div>
      )}

      {results.length > 0 && (
        <Card className="max-w-2xl w-full mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" /> Pré-visualização dos Dados Extraídos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map(({ fileName, extract }, idx) => (
              <div
                className={`border p-4 rounded-md ${extract.erro ? "bg-destructive/10 border-destructive" : "bg-muted/30"}`}
                key={fileName + idx}
              >
                <div className="font-semibold text-base mb-2">{fileName}</div>
                {extract.erro ? (
                  <span className="text-destructive text-sm">{extract.erro}</span>
                ) : (
                  <ul className="grid gap-1 text-sm">
                    <li><span className="font-medium">Município:</span> {extract.municipio}</li>
                    <li><span className="font-medium">Dedução:</span> {extract.deducao || <i>(vazio)</i>}</li>
                    <li><span className="font-medium">Valor ISS:</span> {extract.valor_iss}</li>
                    <li><span className="font-medium">Tomador:</span> {extract.tomador}</li>
                  </ul>
                )}
              </div>
            ))}
            <Button
              className="mt-2 w-full gap-2"
              disabled={!webhookUrl || loading || results.every(r => !!r.extract.erro)}
              onClick={handleSendWebhook}
            >
              <ArrowUp className="w-4 h-4" /> Enviar dados para Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default Index;
