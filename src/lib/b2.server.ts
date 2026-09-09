import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env["B2_ENDPOINT"];
const region = process.env["B2_REGION"];
const keyId = process.env["B2_KEY_ID"];
const applicationKey = process.env["B2_APPLICATION_KEY"];

if (!endpoint || !region || !keyId || !applicationKey) {
  throw new Error("Variáveis de ambiente do Backblaze B2 não configuradas.");
}

export const b2 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: keyId,
    secretAccessKey: applicationKey,
  },
});

export const B2_BUCKET = "qbmed-images";

export async function uploadImagem(
  nomeArquivo: string,
  arquivo: Uint8Array,
  contentType: string,
) {
  await b2.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: nomeArquivo,
      Body: arquivo,
      ContentType: contentType,
    }),
  );

  return nomeArquivo;
}

export async function excluirImagem(nomeArquivo: string) {
  await b2.send(
    new DeleteObjectCommand({
      Bucket: B2_BUCKET,
      Key: nomeArquivo,
    }),
  );
}

export async function baixarImagem(nomeArquivo: string) {
  return b2.send(
    new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: nomeArquivo,
    }),
  );
}