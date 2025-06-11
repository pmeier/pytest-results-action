import * as gha from "@actions/core";
import { checkAsyncGeneratorEmpty } from "./utils";
import { parseXmlFiles } from "./io";
import { extractResults } from "./parse";
import { postResults } from "./summary";

export interface ActionInputs {
  path: string;
  summary?: boolean;
  displayOptions?: string;
  failOnEmpty?: boolean;
  title?: string;
}

export async function main(inputs: ActionInputs): Promise<void> {
  let xmls = parseXmlFiles(inputs.path);

  const { isEmpty, generator } = await checkAsyncGeneratorEmpty(xmls);
  if (isEmpty && inputs.failOnEmpty) {
    gha.setFailed(
      "No JUnit XML file was found. Set `fail-on-empty: false` if that is a valid use case"
    );
  }
  xmls = generator;

  const results = await extractResults(xmls);
  if (results.total_tests === 0) {
    return;
  }

  await postResults(results, inputs);
}
