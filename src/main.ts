import * as gha from "@actions/core";
import { checkAsyncGeneratorEmpty } from "./utils";
import { parseXmlFiles } from "./io";
import { postResults } from "./results";

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

  await postResults(xmls, inputs);
}
