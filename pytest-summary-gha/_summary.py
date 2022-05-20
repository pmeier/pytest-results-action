from ._junit import Result
from ._md import GitHubFlavoredMarkdown

__all__ = ["make_summary"]

RESULT_TO_STATUS = {
    Result.SUCCESS: ":green_circle:",
    Result.SKIPPED: ":yellow_circle:",
    Result.XFAIL: ":yellow_circle:",
    Result.FAILURE: ":red_circle:",
    Result.XPASS: ":red_circle:",
    Result.ERROR: ":red_circle:",
}


def format_time(time):
    minutes, seconds = divmod(int(time), 60)
    hours, minutes = divmod(minutes, 60)

    if hours:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


def make_summary(tests):
    num_tests = {result: len(tests[result]) for result in iter(Result)}
    num_tests_total = sum(num_tests.values())

    times = {
        result: sum((test.time for test in tests[result])) for result in iter(Result)
    }
    times_total = sum(times.values())

    report = (
        GitHubFlavoredMarkdown()
        .add_header("Test summary")
        .add_paragraph()
        .add_line(f"Ran {num_tests_total} tests in {format_time(times_total)}:")
        .add_paragraph()
        .add_table(
            ["result", "number of tests"],
            [
                (
                    f"{RESULT_TO_STATUS[result]} {result.name.lower()}",
                    f"{num_tests[result]} ({num_tests[result] / num_tests_total:5.1%})",
                )
                for result in iter(Result)
            ],
            column_alignment=("left", "right"),
        )
        .add_paragraph()
    )

    for result in iter(Result):
        tests_with_message = [test for test in tests[result] if test.message]
        if not tests_with_message:
            continue

        report.add_header(result.name.lower(), level=2).add_paragraph()
        for test in tests_with_message:
            report.add_details(
                test.name, GitHubFlavoredMarkdown.code(test.message.splitlines())
            )

    return report
