import tabulate

__all__ = ["GitHubFlavoredMarkdown"]


class GitHubFlavoredMarkdown:
    def __init__(self, lines=None):
        self._lines = lines or []

    def __str__(self):
        return "\n".join(self._lines) + "\n"

    @classmethod
    def paragraph(cls):
        return ""

    @classmethod
    def header(cls, header, *, level=1):
        return f"{'#' * level} {header}"

    @classmethod
    def table(cls, header, rows, *, column_alignment=None):
        return tabulate.tabulate(
            rows, header, tablefmt="github", colalign=column_alignment
        ).splitlines()

    @classmethod
    def code(cls, body, *, language=""):
        return [
            f"```{language}",
            *body,
            "```",
        ]

    @classmethod
    def details(cls, title, body):
        return [
            "<details>",
            f"\t<summary>{title}</summary>",
            cls.paragraph(),
            *body,
            "</details>",
            cls.paragraph(),
        ]

    def add_line(self, line):
        self._lines.append(line)
        return self

    def add_lines(self, lines):
        for line in lines:
            self.add_line(line)
        return self

    def add_paragraph(self):
        return self.add_line(self.paragraph())

    def add_header(self, header, *, level=1):
        return self.add_line(self.header(header, level=level))

    def add_table(self, header, rows, *, column_alignment=None):
        return self.add_lines(
            self.table(header, rows, column_alignment=column_alignment)
        )

    def add_code(self, body, language=""):
        return self.add_lines(self.code(body, language=language))

    def add_details(self, title, body):
        return self.add_lines(self.details(title, body))
