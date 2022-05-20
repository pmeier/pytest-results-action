import contextlib
import sys

__all__ = ["gha"]


class GitHubActionsCommander:
    _LEVEL_TO_LOG_COMMAND = {
        0: "debug",
        1: "notice",
        2: "warning",
        3: "error",
    }

    def __init__(self, log_level=2):
        self._log_level = None
        self.log_level = log_level

    @property
    def log_level(self):
        return self._log_level

    @log_level.setter
    def log_level(self, log_level):
        if log_level not in self._LEVEL_TO_LOG_COMMAND.keys():
            raise ValueError(
                f"Got {log_level}, "
                f"but `log_level` should be one of the following integers:\n\n"
                "\n".join(
                    f"- {level}: {command}"
                    for level, command in sorted(self._LEVEL_TO_LOG_COMMAND.items())
                )
            )
        self._log_level = log_level

    def _execute(self, command, value="", **params):
        params = ",".join(f"{param}={data}" for param, data in params.items())
        print(f"::{command} {params}::{value}")

    def set_output(self, name, value):
        self._execute("set-output", value, name=name)

    def _log(self, message, *, level, **params):
        if level < self._log_level:
            return

        self._execute(
            self._LEVEL_TO_LOG_COMMAND[level],
            message,
            **{param: data for param, data in params.items() if data is not None},
        )

    def debug(
        self,
        message,
        title=None,
        file=None,
        start_column=None,
        end_column=None,
        start_line=None,
        end_line=None,
    ):

        self._log(
            message,
            level=0,
            title=title,
            file=file,
            col=start_column,
            endColumn=end_column,
            line=start_line,
            endLine=end_line,
        )

    def notice(
        self,
        message,
        title=None,
        file=None,
        start_column=None,
        end_column=None,
        start_line=None,
        end_line=None,
    ):
        self._log(
            message,
            level=1,
            title=title,
            file=file,
            col=start_column,
            endColumn=end_column,
            line=start_line,
            endLine=end_line,
        )

    def warning(
        self,
        message,
        title=None,
        file=None,
        start_column=None,
        end_column=None,
        start_line=None,
        end_line=None,
    ):
        self._log(
            message,
            level=2,
            title=title,
            file=file,
            col=start_column,
            endColumn=end_column,
            line=start_line,
            endLine=end_line,
        )

    def error(
        self,
        message,
        title=None,
        file=None,
        start_column=None,
        end_column=None,
        start_line=None,
        end_line=None,
        exit=True,
    ):
        self._log(
            message,
            level=3,
            title=title,
            file=file,
            col=start_column,
            endColumn=end_column,
            line=start_line,
            endLine=end_line,
        )
        if exit:
            sys.exit(int(exit))

    @contextlib.contextmanager
    def group(self, name):
        self._execute("group", name)
        try:
            yield
        finally:
            self._execute("endgroup")


gha = GitHubActionsCommander()
