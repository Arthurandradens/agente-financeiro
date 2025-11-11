import { createHash } from "crypto";

export function generateHashId(
  data: string,
  valor: number,
  descricao: string,
): string {
  const input = `${data}|${valor}|${descricao}`;
  return createHash("sha256").update(input).digest("hex");
}
