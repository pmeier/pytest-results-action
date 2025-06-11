import * as gha from "@actions/core";
import { zip, prettyDuration } from "./utils";
import type { ActionInputs } from "./main";
import type { TestResults } from "./parse";

const resultTypes = [
  "passed",
  "skipped",
  "xfailed",
  "failed",
  "xpassed",
  "error",
] as const;

type ResultType = typeof resultTypes[number];
type ResultArrayKey = Exclude<keyof TestResults, "total_time" | "total_tests">;

const resultTypesWithEmoji = zip(
  [...resultTypes],
  ["green", "yellow", "yellow", "red", "red", "red"].map(
    (color) => `:${color}_circle:`
  )
);

export async function postResults(results: TestResults, inputs: ActionInputs): Promise<void> {
  addResults(results, inputs.title, inputs.summary, inputs.displayOptions);
  await gha.summary.write();
}

function addResults(results: TestResults, title?: string, summary?: boolean, displayOptions?: string): void {
  if (title) {
    gha.summary.addHeading(title);
  }

  if (summary) {
    addSummary(results);
  }

  for (const resultType of getResultTypesFromDisplayOptions(displayOptions || "")) {
    const results_for_type = results[resultType];
    if (!results_for_type.length) {
      continue;
    }

    gha.summary.addHeading(resultType, 2);

    for (const result of results_for_type) {
      if (result.msg) {
        addDetailsWithCodeBlock(
          gha.summary,
          result.id,
          result.msg
        );
      } else {
        gha.summary.addRaw(`\n:heavy_check_mark: ${result.id}`, true);
      }
    }
  }
}

function addSummary(results: TestResults): void {
  gha.summary.addRaw(
    `Ran ${results.total_tests} tests in ${prettyDuration(results.total_time)}`,
    true
  );

  const rows = [["Result", "Amount"]];
  for (const [resultType, emoji] of resultTypesWithEmoji) {
    const abs_amount = results[resultType as ResultArrayKey].length;
    const rel_amount = abs_amount / results.total_tests;
    rows.push([
      `${emoji} ${resultType}`,
      `${abs_amount} (${(rel_amount * 100).toFixed(1)}%)`,
    ]);
  }
  gha.summary.addTable(rows);
}

function getResultTypesFromDisplayOptions(displayOptions: string): ResultType[] {
  // 'N' resets the list of chars passed to the '-r' option of pytest. Thus, we only
  // care about anything after the last occurrence
  const displayChars = displayOptions.split("N").pop() || "";

  console.log(displayChars);

  if (displayChars.toLowerCase().includes("a")) {
    return [...resultTypes];
  }

  const displayTypes = new Set<ResultType>();
  for (const [displayChar, displayType] of [
    ["f", "failed"],
    ["E", "error"],
    ["s", "skipped"],
    ["x", "xfailed"],
    ["X", "xpassed"],
    ["p", "passed"],
    ["P", "passed"],
  ] as const) {
    if (displayOptions.includes(displayChar)) {
      displayTypes.add(displayType);
    }
  }

  return [...displayTypes];
}

function addDetailsWithCodeBlock(summary: typeof gha.summary, label: string, code: string): void {
  summary.addDetails(
    label,
    "\n\n" + code
  );
} 