# Expression Calculator

A small, dependency-free toolkit for evaluating mathematical expressions from
Python code or the command line.  It is useful when you need a configurable
calculator without the security pitfalls of `eval`.

## Features

- ✅ Safe evaluation of arithmetic, boolean and function calls.
- ✅ Built-in library of functions sourced from `math` plus familiar helpers
  such as `abs`, `round`, `min`, `max` and `sum`.
- ✅ Frequently used mathematical constants (`pi`, `tau`, `e`, …) already
  available.
- ✅ Optional variables supplied at runtime.
- ✅ Simple command line interface with variable injection and function listing.

## Usage

Install dependencies (only the standard library is required) and run:

```bash
python -m exprcalc "sin(pi / 4) ** 2"
```

To inject variables:

```bash
python -m exprcalc "width * height" -v width=3 -v height=4
```

List the available helper functions:

```bash
python -m exprcalc "0" --list-functions
```

### From Python code

```python
from exprcalc import evaluate_expression

area = evaluate_expression("pi * r ** 2", variables={"r": 3})
```

## Development

Run the test-suite with:

```bash
pytest
```
