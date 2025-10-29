"""Core expression evaluation logic used by :mod:`exprcalc`."""

from __future__ import annotations

import ast
import math
import operator
from dataclasses import dataclass
from typing import Any, Callable, Iterable, Mapping, MutableMapping


class EvaluationError(ValueError):
    """Raised when the expression contains unsupported or unsafe constructs."""


_ALLOWED_BIN_OPS: Mapping[type[ast.AST], Callable[[Any, Any], Any]] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_ALLOWED_UNARY_OPS: Mapping[type[ast.AST], Callable[[Any], Any]] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
    ast.Not: operator.not_,
}

_ALLOWED_BOOL_OPS: Mapping[type[ast.AST], Callable[[Iterable[bool]], bool]] = {
    ast.And: lambda values: all(values),
    ast.Or: lambda values: any(values),
}

_ALLOWED_COMPARE_OPS: Mapping[type[ast.AST], Callable[[Any, Any], bool]] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
}

DEFAULT_FUNCTIONS: Mapping[str, Callable[..., Any]] = {
    name: getattr(math, name)
    for name in dir(math)
    if not name.startswith("_") and callable(getattr(math, name))
}
DEFAULT_FUNCTIONS = {
    **DEFAULT_FUNCTIONS,
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": lambda *values: sum(values[0]) if len(values) == 1 and isinstance(values[0], Iterable) else sum(values),
}

DEFAULT_CONSTANTS: Mapping[str, Any] = {
    name: getattr(math, name)
    for name in dir(math)
    if not name.startswith("_") and not callable(getattr(math, name))
}


@dataclass
class _Context:
    variables: Mapping[str, Any]
    functions: Mapping[str, Callable[..., Any]]


class _Evaluator(ast.NodeVisitor):
    def __init__(self, context: _Context) -> None:
        self._context = context

    # Entry point ---------------------------------------------------------
    def visit(self, node: ast.AST) -> Any:  # type: ignore[override]
        try:
            return super().visit(node)
        except EvaluationError:
            raise
        except Exception as exc:  # pragma: no cover - defensive
            raise EvaluationError(str(exc)) from exc

    # Literals ------------------------------------------------------------
    def visit_Constant(self, node: ast.Constant) -> Any:  # noqa: N802
        return node.value

    def visit_List(self, node: ast.List) -> list[Any]:  # noqa: N802
        return [self.visit(element) for element in node.elts]

    def visit_Tuple(self, node: ast.Tuple) -> tuple[Any, ...]:  # noqa: N802
        return tuple(self.visit(element) for element in node.elts)

    def visit_Set(self, node: ast.Set) -> set[Any]:  # noqa: N802
        return {self.visit(element) for element in node.elts}

    def visit_Dict(self, node: ast.Dict) -> dict[Any, Any]:  # noqa: N802
        return {
            self.visit(key) if key is not None else None: self.visit(value)
            for key, value in zip(node.keys, node.values, strict=True)
        }

    # Variables and functions --------------------------------------------
    def visit_Name(self, node: ast.Name) -> Any:  # noqa: N802
        if isinstance(node.ctx, ast.Load):
            if node.id in self._context.variables:
                return self._context.variables[node.id]
            raise EvaluationError(f"Unknown variable '{node.id}'.")
        raise EvaluationError("Assignments are not allowed in expressions.")

    def visit_Call(self, node: ast.Call) -> Any:  # noqa: N802
        if not isinstance(node.func, ast.Name):
            raise EvaluationError("Only simple function names are allowed.")
        func_name = node.func.id
        if func_name not in self._context.functions:
            raise EvaluationError(f"Unknown function '{func_name}'.")

        args = [self.visit(arg) for arg in node.args]
        kwargs = {keyword.arg: self.visit(keyword.value) for keyword in node.keywords}
        try:
            return self._context.functions[func_name](*args, **kwargs)
        except TypeError as exc:
            raise EvaluationError(str(exc)) from exc

    # Arithmetic ----------------------------------------------------------
    def visit_BinOp(self, node: ast.BinOp) -> Any:  # noqa: N802
        op_type = type(node.op)
        if op_type not in _ALLOWED_BIN_OPS:
            raise EvaluationError(f"Operator '{op_type.__name__}' is not permitted.")
        left = self.visit(node.left)
        right = self.visit(node.right)
        return _ALLOWED_BIN_OPS[op_type](left, right)

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Any:  # noqa: N802
        op_type = type(node.op)
        if op_type not in _ALLOWED_UNARY_OPS:
            raise EvaluationError(f"Unary operator '{op_type.__name__}' is not permitted.")
        operand = self.visit(node.operand)
        return _ALLOWED_UNARY_OPS[op_type](operand)

    # Comparisons and boolean ops ----------------------------------------
    def visit_Compare(self, node: ast.Compare) -> bool:  # noqa: N802
        left_value = self.visit(node.left)
        for operator_node, comparator in zip(node.ops, node.comparators, strict=True):
            operator_type = type(operator_node)
            if operator_type not in _ALLOWED_COMPARE_OPS:
                raise EvaluationError(
                    f"Comparison operator '{operator_type.__name__}' is not permitted."
                )
            right_value = self.visit(comparator)
            if not _ALLOWED_COMPARE_OPS[operator_type](left_value, right_value):
                return False
            left_value = right_value
        return True

    def visit_BoolOp(self, node: ast.BoolOp) -> bool:  # noqa: N802
        op_type = type(node.op)
        if op_type not in _ALLOWED_BOOL_OPS:
            raise EvaluationError(f"Boolean operator '{op_type.__name__}' is not permitted.")
        values = (self.visit(value) for value in node.values)
        return _ALLOWED_BOOL_OPS[op_type](values)

    # Unsupported nodes --------------------------------------------------
    def generic_visit(self, node: ast.AST) -> Any:  # type: ignore[override]
        raise EvaluationError(f"Unsupported expression component: {type(node).__name__}.")


def _prepare_context(
    variables: Mapping[str, Any] | None,
    functions: Mapping[str, Callable[..., Any]] | None,
) -> _Context:
    merged_variables: MutableMapping[str, Any] = dict(DEFAULT_CONSTANTS)
    if variables:
        merged_variables.update(variables)

    merged_functions: MutableMapping[str, Callable[..., Any]] = dict(DEFAULT_FUNCTIONS)
    if functions:
        merged_functions.update(functions)

    return _Context(variables=merged_variables, functions=merged_functions)


def evaluate_expression(
    expression: str,
    *,
    variables: Mapping[str, Any] | None = None,
    functions: Mapping[str, Callable[..., Any]] | None = None,
) -> Any:
    """Safely evaluate a mathematical expression.

    Parameters
    ----------
    expression:
        The textual representation of the expression to evaluate.  It must be a
        valid Python expression composed of arithmetic, boolean and function
        calls supported by :mod:`exprcalc`.
    variables:
        Optional mapping of variable names to values accessible within the
        expression.
    functions:
        Optional mapping of additional function names to callables.

    Returns
    -------
    Any
        The computed result of the expression.

    Raises
    ------
    EvaluationError
        If the expression contains unsupported syntax, references unknown names
        or triggers an error during evaluation.
    """

    if not isinstance(expression, str) or not expression.strip():
        raise EvaluationError("The expression must be a non-empty string.")

    try:
        parsed = ast.parse(expression, mode="eval")
    except SyntaxError as exc:  # pragma: no cover - direct syntax validation
        raise EvaluationError("Invalid expression syntax.") from exc

    context = _prepare_context(variables, functions)
    evaluator = _Evaluator(context)
    return evaluator.visit(parsed.body)


def list_available_functions() -> list[str]:
    """Return the names of built-in functions available to expressions."""

    return sorted(DEFAULT_FUNCTIONS.keys())
