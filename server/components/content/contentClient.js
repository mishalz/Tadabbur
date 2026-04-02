import { QuranClient, Language } from "@quranjs/api";
import { getQfConfig } from "../../qfConfig.js";

const { clientId, clientSecret } = getQfConfig();

export const client = new QuranClient({
  clientId,
  clientSecret,
  defaults: { language: Language.ENGLISH },
});
