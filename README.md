# `pytest-summary-gha`

[![BSD-3-Clause License](https://img.shields.io/github/license/pmeier/light-the-torch)](https://opensource.org/licenses/BSD-3-Clause)
[![Project Status: WIP](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

## Usage

```yaml
- name: Run tests
  run: pytest --junit-xml=test-results.xml

- name: Summarize test results
  if: always()
  uses: pmeier/pytest-summary-gha@v0.1.0
  with:
    junit-xml: test-results.xml
```
