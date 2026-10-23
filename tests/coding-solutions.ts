import { codingExercises } from "@/content/coding-exercises";
import { projects } from "@/content/projects";
export const lessonSolutions: Record<string, string> = {
  "variables-data-types": codingExercises[
    "variables-data-types"
  ].starter.replace("price = price_text", "price = float(price_text)"),
  "operators-expressions": codingExercises[
    "operators-expressions"
  ].starter.replace(" or ", " and "),
  conditionals:
    "def status(score):\n    if score >= 60:\n        return 'pass'\n    return 'retry'",
  loops: codingExercises.loops.starter.replace(
    "range(1, n)",
    "range(1, n + 1)",
  ),
  functions: "def add_fee(amount, fee=2):\n    return amount + fee",
  recursion: codingExercises.recursion.starter.replace("return 0", "return 1"),
  debugging:
    "def average(values):\n    if len(values) == 0:\n        return None\n    return sum(values) / len(values)",
};
const project = projects[0];
export const regressionTest =
  "def test_attempt_limit(play):\n    actual = play(['1', '12'], 12, 1)\n    assert actual == (['Too low'], 1, False), f'Expected one unsuccessful attempt, observed {actual!r}'";
export const projectSolutions: Record<string, string> = {
  compare: project.milestones[0].solution,
  validate: `${project.milestones[0].solution}\n\n${project.milestones[1].solution}`,
  round: project.milestones[2].solution,
  regression: `${project.milestones[2].solution}\n\n${regressionTest}`,
  terminal: project.milestones[4].solution,
};
