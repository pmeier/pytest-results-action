import * as gha from "@actions/core";
import { main } from "./main";

interface ActionInputs {
  path: string;
  summary?: boolean;
  displayOptions?: string;
  failOnEmpty?: boolean;
  title?: string;
}

async function entrypoint(): Promise<void> {
  const inputs = getInputs();
  await main(inputs);
}

function getInputs(): ActionInputs {
  return {
    path: gha.getInput("path", { required: true }),
    summary: gha.getBooleanInput("summary", {
      required: false,
    }),
    displayOptions: gha.getInput("display-options", { required: false }),
    failOnEmpty: gha.getBooleanInput("fail-on-empty", {
      required: false,
    }),
    title: gha.getInput("title", { required: false }),
  };
}

entrypoint(); 