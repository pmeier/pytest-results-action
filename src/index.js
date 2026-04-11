import * as gha from "@actions/core";

import { main } from "./main.js";

async function entrypoint() {
  const inputs = getInputs();
  await main(inputs);
}

function getInputs() {
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
