import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const B2_BUCKET = "qbmed-images";

function getB2Client() {
  const endpoint = process.env["B2_ENDPOINT"];
  const region = process.env["B2_REGION"];
  const keyId = process.env["B2_KEY_ID"];
  const applicationKey = process.env["B2_APPLICATION_KEY"];

  if (!endpoint || !region || !keyId || !applicationKey) {
    throw new Error(
      "Variáveis de ambiente do Backblaze B2 não configuradas.",
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey,
    },
  });
}

export async function uploadImagem(
  nomeArquivo: string,
  arquivo: Uint8Array,
  contentType: string,
) {
  const b2 = getB2Client();

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
  const b2 = getB2Client();

  await b2.send(
    new DeleteObjectCommand({
      Bucket: B2_BUCKET,
      Key: nomeArquivo,
    }),
  );
}

export async function baixarImagem(nomeArquivo: string) {
  const b2 = getB2Client();

  return b2.send(
    new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: nomeArquivo,
    }),
  );
}

export async function gerarUrlImagem(
  nomeArquivo: string,
  validadeSegundos = 3600,
) {
  const b2 = getB2Client();

  const comando = new GetObjectCommand({
    Bucket: B2_BUCKET,
    Key: nomeArquivo,
  });

  return getSignedUrl(b2, comando, {
    expiresIn: validadeSegundos,
  });
}