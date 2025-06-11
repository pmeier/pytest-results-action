interface TestResult {
  id: string;
  msg?: string;
}

export interface TestResults {
  total_time: number;
  total_tests: number;
  passed: TestResult[];
  failed: TestResult[];
  skipped: TestResult[];
  xfailed: TestResult[];
  xpassed: TestResult[];
  error: TestResult[];
}

export function extractResults(xmls: any[]): TestResults {
  const results: TestResults = {
    total_time: 0.0,
    total_tests: 0,
    passed: [],
    failed: [],
    skipped: [],
    xfailed: [],
    xpassed: [],
    error: [],
  };

  for (const xml of xmls) {
    let testSuites = xml.testsuites.testsuite;
    testSuites = testSuites instanceof Array ? testSuites : [testSuites];

    for (const testSuite of testSuites) {
      results.total_time += parseFloat(testSuite["@_time"]);

      let testCases = testSuite.testcase;
      if (!testCases) {
        continue;
      }
      testCases = testCases instanceof Array ? testCases : [testCases];
      for (const result of testCases) {
        let resultTypeArray: TestResult[];
        let msg: string | undefined;

        if ("failure" in result) {
          const failureMsg = result.failure["#text"];
          const parts = failureMsg.split("[XPASS(strict)] ");
          if (parts.length === 2) {
            resultTypeArray = results.xpassed;
            msg = parts[1];
          } else {
            resultTypeArray = results.failed;
            msg = failureMsg;
          }
        } else if ("skipped" in result) {
          if (result.skipped["@_type"] === "pytest.xfail") {
            resultTypeArray = results.xfailed;
          } else {
            resultTypeArray = results.skipped;
          }
          msg = result.skipped["@_message"];
        } else if ("error" in result) {
          resultTypeArray = results.error;
          msg = result.error["#text"];
        } else {
          resultTypeArray = results.passed;
          msg = undefined;
        }

        resultTypeArray.push({
          id: result["@_classname"] + "." + result["@_name"],
          msg: msg,
        });
        results.total_tests += 1;
      }
    }
  }

  return results;
} 