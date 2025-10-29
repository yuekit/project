"""Command line interface for the expression calculator."""

from __future__ import annotations

import argparse
import ast
from typing import Any

from .evaluator import EvaluationError, evaluate_expression, list_available_functions


def _parse_variable(text: str) -> tuple[str, Any]:
    if "=" not in text:
        raise argparse.ArgumentTypeError("Variables must be in the form name=value.")
    name, raw_value = text.split("=", 1)
    name = name.strip()
    if not name.isidentifier():
        raise argparse.ArgumentTypeError(
            f"Invalid variable name '{name}'. Variable names must be identifiers."
        )
    try:
        value = ast.literal_eval(raw_value)
    except Exception as exc:  # pragma: no cover - argparse error path
        raise argparse.ArgumentTypeError(
            f"Unable to parse value for variable '{name}': {raw_value}"
        ) from exc
    return name, value


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__ or "Expression calculator")
    parser.add_argument(
        "expression",
        help="Expression to evaluate. Surround with quotes to avoid shell expansion.",
    )
    parser.add_argument(
        "-v",
        "--variable",
        metavar="NAME=VALUE",
        action="append",
        default=[],
        help="Provide a variable binding available to the expression.",
    )
    parser.add_argument(
        "-l",
        "--list-functions",
        action="store_true",
        help="Show built-in function names and exit.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_argument_parser()
    args = parser.parse_args(argv)

    if args.list_functions:
        for name in list_available_functions():
            print(name)
        return 0

    variables = dict(_parse_variable(text) for text in args.variable)

    try:
        result = evaluate_expression(args.expression, variables=variables)
    except EvaluationError as exc:
        parser.error(str(exc))

    if isinstance(result, float):
        # Avoid negative zero, match user expectations.
        result = 0.0 + result
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
