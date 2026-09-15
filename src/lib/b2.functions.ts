import { createServerFn } from "@tanstack/react-start";
import { uploadImagem } from "./b2.server";

export const uploadImagemB2 = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      nomeArquivo: string;
      arquivoBase64: string;
      contentType: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const binario = atob(data.arquivoBase64);

    const arquivo = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      arquivo[i] = binario.charCodeAt(i);
    }

    const nomeArquivo = await uploadImagem(
      data.nomeArquivo,
      arquivo,
      data.contentType,
    );

    return {
      sucesso: true,
      nomeArquivo,
    };
  });