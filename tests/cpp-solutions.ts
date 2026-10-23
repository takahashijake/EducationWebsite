import { cppExercises } from "../src/content/cpp-exercises";

const edits: Record<string, [string, string]> = {
  "cpp-variables-output": [
    "// Print the label and count.",
    'std::cout << "Learners: " << count << "\\n";',
  ],
  "cpp-rectangle-area": ["int area = 0;", "int area = width * height;"],
  "cpp-number-sign": [
    'std::cout << "zero\\n";',
    'if (value > 0) { std::cout << "positive\\n"; } else if (value < 0) { std::cout << "negative\\n"; } else { std::cout << "zero\\n"; }',
  ],
  "cpp-inclusive-sum": ["i < n", "i <= n"],
  "cpp-digit-count": [
    "// Remove one digit each iteration; handle zero too.",
    "if (value == 0) { digits = 1; }\n    while (value > 0) { ++digits; value /= 10; }",
  ],
  "cpp-square-function": ["return 0;", "return value * value;"],
  "cpp-array-total": [
    "// Add each array element to total.",
    "for (int i = 0; i < 5; ++i) { total += values[i]; }",
  ],
  "cpp-reverse-string": [
    "// Traverse text and build its reverse.",
    "for (char letter : text) { result = letter + result; }",
  ],
};
export const cppSolutions = Object.fromEntries(
  cppExercises.map((exercise) => [
    exercise.id,
    exercise.starter.replace(...edits[exercise.id]),
  ]),
);
