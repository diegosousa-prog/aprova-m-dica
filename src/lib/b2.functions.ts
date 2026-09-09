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
    const arquivo = Uint8Array.from(
      Buffer.from(data.arquivoBase64, "base64"),
    );

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
