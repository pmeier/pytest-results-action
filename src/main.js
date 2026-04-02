import * as gha from "@actions/core";
import { checkAsyncGeneratorEmpty } from "./utils.js";
import { parseXmlFiles } from "./io.js";
import { postResults } from "./results.js";

export async function main(inputs) {
  var xmls = parseXmlFiles(inputs.path);

  const { isEmpty, generator } = await checkAsyncGeneratorEmpty(xmls);
  if (isEmpty && inputs.failOnEmpty) {
    gha.setFailed(
      "No JUnit XML file was found. Set `fail-on-empty: false` if that is a valid use case"
    );
  }
  xmls = generator;

  await postResults(xmls, inputs);
}
