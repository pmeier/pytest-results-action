import * as gha from "@actions/core";
import { zip, prettyDuration } from "./utils";
import type { ActionInputs } from "./main";
import type { TestResults, TestResult } from "./parse";
import { TestType } from "./parse";

const resultTypes = [
  TestType.Passed,
  TestType.Skipped,
  TestType.XFailed,
  TestType.Failed,
  TestType.XPassed,
  TestType.Error,
] as const;

type ResultType = (typeof resultTypes)[number];

// Temporary interface that matches the old structure
interface OldFormatTestResults {
  total_time: number;
  total_tests: number;
  passed: TestResult[];
  failed: TestResult[];
  skipped: TestResult[];
  xfailed: TestResult[];
  xpassed: TestResult[];
  error: TestResult[];
}

const resultTypesWithEmoji = zip(
  [...resultTypes],
  ["green", "yellow", "yellow", "red", "red", "red"].map(
    (color) => `:${color}_circle:`
  )
);

export async function postResults(
  results: TestResults,
  inputs: ActionInputs
): Promise<void> {
  // Create a temporary structure that matches the old format
  const oldFormatResults: OldFormatTestResults = {
    total_time: results.total_time,
    total_tests: results.total_tests,
    passed: results.tests.filter((t) => t.type === TestType.Passed),
    failed: results.tests.filter((t) => t.type === TestType.Failed),
    skipped: results.tests.filter((t) => t.type === TestType.Skipped),
    xfailed: results.tests.filter((t) => t.type === TestType.XFailed),
    xpassed: results.tests.filter((t) => t.type === TestType.XPassed),
    error: results.tests.filter((t) => t.type === TestType.Error),
  };

  addResults(
    oldFormatResults,
    inputs.title,
    inputs.summary,
    inputs.displayOptions
  );
  await gha.summary.write();
}

function addResults(
  results: OldFormatTestResults,
  title?: string,
  summary?: boolean,
  displayOptions?: string
): void {
  if (title) {
    gha.summary.addHeading(title);
  }

  if (summary) {
    addSummary(results);
  }

  for (const resultType of getResultTypesFromDisplayOptions(
    displayOptions || ""
  )) {
    const results_for_type = results[resultType];
    if (!results_for_type.length) {
      continue;
    }

    gha.summary.addHeading(resultType, 2);

    for (const result of results_for_type) {
      if (result.msg) {
        addDetailsWithCodeBlock(gha.summary, result.id, result.msg);
      } else {
        gha.summary.addRaw(`\n:heavy_check_mark: ${result.id}`, true);
      }
    }
  }
}

function addSummary(results: OldFormatTestResults): void {
  gha.summary.addRaw(
    `Ran ${results.total_tests} tests in ${prettyDuration(results.total_time)}`,
    true
  );

  const rows = [["Result", "Amount"]];
  for (const [resultType, emoji] of resultTypesWithEmoji) {
    const abs_amount = results[resultType].length;
    const rel_amount = abs_amount / results.total_tests;
    rows.push([
      `${emoji} ${resultType}`,
      `${abs_amount} (${(rel_amount * 100).toFixed(1)}%)`,
    ]);
  }
  gha.summary.addTable(rows);
}

function getResultTypesFromDisplayOptions(
  displayOptions: string
): ResultType[] {
  // 'N' resets the list of chars passed to the '-r' option of pytest. Thus, we only
  // care about anything after the last occurrence
  const displayChars = displayOptions.split("N").pop() || "";

  console.log(displayChars);

  if (displayChars.toLowerCase().includes("a")) {
    return [...resultTypes];
  }

  const displayTypes = new Set<ResultType>();
  for (const [displayChar, displayType] of [
    ["f", TestType.Failed],
    ["E", TestType.Error],
    ["s", TestType.Skipped],
    ["x", TestType.XFailed],
    ["X", TestType.XPassed],
    ["p", TestType.Passed],
    ["P", TestType.Passed],
  ] as const) {
    if (displayOptions.includes(displayChar)) {
      displayTypes.add(displayType);
    }
  }

  return [...displayTypes];
}

function addDetailsWithCodeBlock(
  summary: typeof gha.summary,
  label: string,
  code: string
): void {
  summary.addDetails(label, "\n\n" + code);
}
