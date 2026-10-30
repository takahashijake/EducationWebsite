export type CodingCase = {
  id: string;
  label: string;
  stdin: string;
  stdout: string;
};
export type CodingExercise = {
  id: string;
  revision: number;
  language: "cpp";
  topicId: string;
  title: string;
  difficulty: "Beginner";
  objectives: string[];
  introduction: string;
  workedExample: { source: string; explanation: string };
  statement: string;
  starter: string;
  expectedBehavior: string;
  examples: CodingCase[];
  tests: CodingCase[];
  hints: string[];
  commonMistakes: string[];
};
const program = (body: string, headers = "#include <iostream>") =>
  `${headers}\n\nint main() {\n${body}\n    return 0;\n}\n`;
const example = (stdin: string, stdout: string): CodingCase => ({
  id: "example",
  label: "Worked input",
  stdin,
  stdout,
});
const cases = (rows: [string, string, string][]): CodingCase[] =>
  rows.map(([label, stdin, stdout], index) => ({
    id: `case-${index + 1}`,
    label,
    stdin,
    stdout,
  }));

export const cppExercises: CodingExercise[] = [
  {
    id: "cpp-variables-output",
    revision: 1,
    language: "cpp",
    topicId: "variables-data-types",
    title: "Read and Print an Integer",
    difficulty: "Beginner",
    objectives: [
      "Declare an integer variable.",
      "Read and print a value with C++ streams.",
    ],
    introduction:
      "These lessons explain concepts with Python. This optional C++ track applies the same ideas. #include <iostream> provides streams. C++ starts in int main(). Braces group statements; a semicolon ends a statement. int declares a whole-number variable. std::cin >> count reads an integer; std::cout << count prints it. Returning 0 means normal completion.",
    workedExample: {
      source: program(
        '    int apples = 4;\n    std::cout << "Apples: " << apples << "\\n";',
      ),
      explanation:
        'The variable apples stores 4. The stream joins the label, value, and newline to print "Apples: 4".',
    },
    statement:
      'In the editable C++ code below, read one whole number (0 to 1000) into count. Replace the comment with code that prints "Learners: ", the value of count, and a newline. Then enter 7 in Program input, select Run, and compare Actual output with the example. Select Submit solution to check all public cases.',
    starter: program(
      "    int count = 0;\n    std::cin >> count;\n    // Print the label and count.",
    ),
    expectedBehavior:
      "Print exactly one labeled count, without an input prompt.",
    examples: [example("7\n", "Learners: 7\n")],
    tests: cases([
      ["Zero learners", "0\n", "Learners: 0\n"],
      ["One learner", "1\n", "Learners: 1\n"],
      ["A larger class", "27\n", "Learners: 27\n"],
    ]),
    hints: [
      'Start the output with std::cout << "Learners: ".',
      'Continue the same stream with << count << "\\n";',
    ],
    commonMistakes: [
      "Quoted variable names print their letters rather than the stored value.",
      "An extra input prompt changes the expected output.",
    ],
  },
  {
    id: "cpp-rectangle-area",
    revision: 1,
    language: "cpp",
    topicId: "operators-expressions",
    title: "Calculate a rectangle area",
    difficulty: "Beginner",
    objectives: [
      "Apply multiplication to two input values.",
      "Store and print the result of an expression.",
    ],
    introduction:
      "In C++, int width = 3; declares a whole number. The operators +, -, *, /, and % perform arithmetic. Integer division truncates toward zero. Read two values with std::cin >> width >> height; whitespace separates them. Use * for multiplication.",
    workedExample: {
      source: program(
        '    int boxes = 3;\n    int items = 5;\n    int total = boxes * items;\n    std::cout << total << "\\n";',
      ),
      explanation:
        "The expression 3 * 5 evaluates to 15 before assignment to total.",
    },
    statement:
      "Read width and height, integers from 0 to 1000. Compute and print their product as the area.",
    starter: program(
      '    int width = 0, height = 0;\n    std::cin >> width >> height;\n    int area = 0;\n    std::cout << area << "\\n";',
    ),
    expectedBehavior: "Print the integer area on one line.",
    examples: [example("3 4\n", "12\n")],
    tests: cases([
      ["Ordinary rectangle", "3 4\n", "12\n"],
      ["Zero width", "0 8\n", "0\n"],
      ["Unit square", "1 1\n", "1\n"],
      ["Large rectangle", "1000 1000\n", "1000000\n"],
    ]),
    hints: [
      "Area counts height rows of width units.",
      "Replace the 0 assigned to area with width * height.",
    ],
    commonMistakes: [
      "Adding the dimensions computes neither area nor perimeter.",
      "The letter x is not the multiplication operator.",
    ],
  },
  {
    id: "cpp-number-sign",
    revision: 1,
    language: "cpp",
    topicId: "conditionals",
    title: "Classify a number",
    difficulty: "Beginner",
    objectives: [
      "Choose mutually exclusive branches.",
      "Handle the zero boundary explicitly.",
    ],
    introduction:
      "C++ writes branches as if (condition) { ... } else if (condition) { ... } else { ... }. Comparisons use <, >, <=, >=, and ==. Assignment uses =. Only the first true branch executes. Use braces to make each branch's statements clear.",
    workedExample: {
      source: program(
        '    int age = 18;\n    if (age >= 18) {\n        std::cout << "adult\\n";\n    } else {\n        std::cout << "minor\\n";\n    }',
      ),
      explanation: "The comparison includes 18, so only the adult branch runs.",
    },
    statement:
      'Read an integer from -1000 to 1000. Print "positive", "negative", or "zero" according to its sign.',
    starter: program(
      '    int value = 0;\n    std::cin >> value;\n    std::cout << "zero\\n";',
    ),
    expectedBehavior: "Print exactly one lowercase classification.",
    examples: [example("-8\n", "negative\n")],
    tests: cases([
      ["Below zero", "-1\n", "negative\n"],
      ["At zero", "0\n", "zero\n"],
      ["Above zero", "1\n", "positive\n"],
      ["Negative endpoint", "-1000\n", "negative\n"],
      ["Positive endpoint", "1000\n", "positive\n"],
    ]),
    hints: [
      "Start by comparing value > 0.",
      "Use else if (value < 0) for negatives; the remaining case is zero.",
    ],
    commonMistakes: [
      "Zero is neither positive nor negative.",
      "Separate if statements with an else on only the last can print two answers.",
    ],
  },
  {
    id: "cpp-inclusive-sum",
    revision: 1,
    language: "cpp",
    topicId: "loops",
    title: "Sum with a for loop",
    difficulty: "Beginner",
    objectives: [
      "Initialize, test, and update a for loop.",
      "Include the final input value in an accumulation.",
    ],
    introduction:
      "A C++ for loop is for (initialization; condition; update) { body }. for (int i = 0; i < 3; ++i) visits 0, 1, and 2. ++i increases i by one. total += i adds i to the current total. A false initial condition skips the body.",
    workedExample: {
      source: program(
        '    for (int i = 1; i <= 3; ++i) {\n        std::cout << i << "\\n";\n    }',
      ),
      explanation:
        "The loop prints 1, 2, 3. After ++i makes i equal to 4, the condition becomes false.",
    },
    statement:
      "Read n from 0 to 1000. Use a for loop to sum every integer from 1 through n, including n. For n = 0 the sum is 0.",
    starter: program(
      '    int n = 0;\n    std::cin >> n;\n    int total = 0;\n    for (int i = 1; i < n; ++i) {\n        total += i;\n    }\n    std::cout << total << "\\n";',
    ),
    expectedBehavior: "Print the inclusive sum on one line.",
    examples: [example("3\n", "6\n")],
    tests: cases([
      ["No iterations", "0\n", "0\n"],
      ["One iteration", "1\n", "1\n"],
      ["Several iterations", "5\n", "15\n"],
      ["Upper endpoint", "1000\n", "500500\n"],
    ]),
    hints: [
      "Trace the starter with n = 1. Does the body run?",
      "The final iteration must accept i == n. Review < versus <=.",
    ],
    commonMistakes: [
      "i < n excludes n.",
      "Resetting total inside the loop discards previous additions.",
    ],
  },
  {
    id: "cpp-digit-count",
    revision: 1,
    language: "cpp",
    topicId: "loops",
    title: "Count digits with a while loop",
    difficulty: "Beginner",
    objectives: [
      "Update state toward a while loop's stopping condition.",
      "Handle zero as a separate boundary case.",
    ],
    introduction:
      "while (condition) { body } repeats while the condition is true. The body must change something that can make it false. For a nonnegative integer, value /= 10 removes its last decimal digit using integer division. Zero is written with one digit even though value > 0 is initially false.",
    workedExample: {
      source: program(
        '    int remaining = 3;\n    while (remaining > 0) {\n        std::cout << remaining << "\\n";\n        --remaining;\n    }',
      ),
      explanation:
        "The update --remaining moves 3 to 2 to 1 to 0; the next condition stops the loop.",
    },
    statement:
      "Read a nonnegative integer no greater than 1000000000. Use a while loop to count its decimal digits. Zero has one digit.",
    starter: program(
      '    int value = 0;\n    std::cin >> value;\n    int digits = 0;\n    // Remove one digit each iteration; handle zero too.\n    std::cout << digits << "\\n";',
    ),
    expectedBehavior: "Print only the decimal digit count.",
    examples: [example("402\n", "3\n")],
    tests: cases([
      ["Zero", "0\n", "1\n"],
      ["One digit", "7\n", "1\n"],
      ["Two digits", "10\n", "2\n"],
      ["Internal zeros", "1002\n", "4\n"],
      ["Upper endpoint", "1000000000\n", "10\n"],
    ]),
    hints: [
      "Count one iteration for each division by 10 while value > 0.",
      "If the original input is zero, set digits to 1 before the loop.",
    ],
    commonMistakes: [
      "Forgetting to update value creates an infinite loop.",
      "Counting only nonzero digits ignores zeros inside the number.",
    ],
  },
  {
    id: "cpp-square-function",
    revision: 1,
    language: "cpp",
    topicId: "functions",
    title: "Return a square",
    difficulty: "Beginner",
    objectives: [
      "Define a typed parameter and return value.",
      "Return a result to a caller instead of printing in the function.",
    ],
    introduction:
      "int double_value(int value) declares a function that accepts and returns an integer. return value * 2; sends a result to its caller. Define a function before main so the compiler knows its name and types. Printing a value does not return it.",
    workedExample: {
      source:
        "int double_value(int value) {\n    return value * 2;\n}\n\n// double_value(4) evaluates to 8.\n",
      explanation:
        "Each call supplies its own parameter value; the returned expression becomes the call's value.",
    },
    statement:
      "Implement int square(int value) to return value multiplied by itself. The supplied main reads an integer from -1000 to 1000 and prints the returned result. Keep output in main.",
    starter:
      '#include <iostream>\n\nint square(int value) {\n    return 0;\n}\n\nint main() {\n    int value = 0;\n    std::cin >> value;\n    std::cout << square(value) << "\\n";\n    return 0;\n}\n',
    expectedBehavior: "Return the square and print it once from main.",
    examples: [example("-4\n", "16\n")],
    tests: cases([
      ["Zero", "0\n", "0\n"],
      ["Positive", "4\n", "16\n"],
      ["Negative", "-4\n", "16\n"],
      ["Unit", "1\n", "1\n"],
      ["Endpoint", "1000\n", "1000000\n"],
    ]),
    hints: [
      "Multiply the parameter by itself.",
      "Replace return 0; inside square with return value * value;.",
    ],
    commonMistakes: [
      "C++ ^ means bitwise XOR, not exponentiation.",
      "Printing inside square and returning 0 gives the caller the wrong value.",
    ],
  },
  {
    id: "cpp-array-total",
    revision: 1,
    language: "cpp",
    topicId: "loops",
    title: "Traverse a fixed array",
    difficulty: "Beginner",
    objectives: [
      "Use zero-based array indices.",
      "Accumulate all five elements without going out of bounds.",
    ],
    introduction:
      "This is an introduction to arrays before the planned Arrays and Strings lesson. int values[5]{} creates five zero-initialized integers. Their indices are 0 through 4. values[i] accesses one element. Reading values[5] is outside this array and is undefined behavior. Use i < 5 to visit all valid indices.",
    workedExample: {
      source: program(
        '    int scores[3]{2, 4, 6};\n    for (int i = 0; i < 3; ++i) {\n        std::cout << scores[i] << "\\n";\n    }',
      ),
      explanation:
        "The loop prints the three stored elements, beginning with index 0 and ending with index 2.",
    },
    statement:
      "Read exactly five integers, each from -100 to 100, into the supplied array. Traverse the array with a loop and print their sum.",
    starter: program(
      '    int values[5]{};\n    for (int i = 0; i < 5; ++i) {\n        std::cin >> values[i];\n    }\n    int total = 0;\n    // Add each array element to total.\n    std::cout << total << "\\n";',
    ),
    expectedBehavior:
      "Print one sum that includes each of the five elements once.",
    examples: [example("1 2 3 4 5\n", "15\n")],
    tests: cases([
      ["Increasing values", "1 2 3 4 5\n", "15\n"],
      ["Zeros", "0 0 0 0 0\n", "0\n"],
      ["Mixed signs", "-5 2 0 7 -1\n", "3\n"],
      ["First element matters", "9 0 0 0 0\n", "9\n"],
      ["Last element matters", "0 0 0 0 9\n", "9\n"],
    ]),
    hints: [
      "Start your index at 0 and keep it less than 5.",
      "Inside the second loop, use total += values[i];.",
    ],
    commonMistakes: [
      "Starting at 1 misses the first element.",
      "i <= 5 accesses a nonexistent sixth element; a passing output does not prove memory safety.",
    ],
  },
  {
    id: "cpp-reverse-string",
    revision: 1,
    language: "cpp",
    topicId: "loops",
    title: "Reverse a line of text",
    difficulty: "Beginner",
    objectives: [
      "Read a complete string including spaces.",
      "Build a new string by traversing characters.",
    ],
    introduction:
      "#include <string> provides std::string. std::getline(std::cin, text) reads a whole line, including spaces. for (char letter : text) visits each character in order. Adding a character before a string, letter + result, produces a new string. These exercises use ASCII characters; reversing bytes does not correctly reverse every Unicode string.",
    workedExample: {
      source: program(
        '    std::string word = "cat";\n    std::string result;\n    for (char letter : word) {\n        result = letter + result;\n    }\n    std::cout << result << "\\n";',
        "#include <iostream>\n#include <string>",
      ),
      explanation:
        'The intermediate strings are "c", "ac", and "tac" because each character goes before the previous result.',
    },
    statement:
      "Read a line of at most 100 ASCII characters. Build and print the reversed line, preserving spaces. An empty line reverses to an empty line.",
    starter: program(
      '    std::string text;\n    std::getline(std::cin, text);\n    std::string result;\n    // Traverse text and build its reverse.\n    std::cout << result << "\\n";',
      "#include <iostream>\n#include <string>",
    ),
    expectedBehavior:
      "Print every input character in reverse order, followed by a newline.",
    examples: [example("code lab\n", "bal edoc\n")],
    tests: cases([
      ["Empty line", "\n", "\n"],
      ["One character", "a\n", "a\n"],
      ["A word", "code\n", "edoc\n"],
      ["Internal spaces", "code lab\n", "bal edoc\n"],
      ["Boundary spaces", " ab \n", " ba \n"],
    ]),
    hints: [
      "Visit characters with for (char letter : text).",
      "Prepend each character: result = letter + result;.",
    ],
    commonMistakes: [
      "std::cin >> text stops at the first space.",
      "Appending each character preserves the original order.",
    ],
  },
];

export const exercisesForTopic = (topicId: string) =>
  cppExercises.filter((exercise) => exercise.topicId === topicId);
