import { codingExercises } from "./coding-exercises";
import { advancedLessons } from "./advanced-lessons";
import { programmingLessons } from "./programming-lessons";
import { dsaLessons } from "./dsa-lessons";
import { dsaCodingExercises } from "./dsa-coding-exercises";
import { sortingCodingExercises } from "./sorting-coding-exercises";
import { sortingLesson } from "./sorting-lesson";
import { linkedListLesson } from "./linked-list-lesson";
import { stackQueueLesson } from "./stack-queue-lesson";
import { stackQueueCodingExercises } from "./stack-queue-coding-exercises";
import { graphLesson } from "./graph-lesson";
import { weightedLesson } from "./weighted-lesson";
import { weightedCodingExercises } from "./weighted-coding-exercises";
import { treeLesson } from "./tree-lesson";
import { treeCodingExercises } from "./tree-coding-exercises";
import { graphCodingExercises } from "./graph-coding-exercises";
import { linkedListCodingExercises } from "./linked-list-coding-exercises";
import type { Lesson } from "./types";

const authoredLessons: Record<string, Lesson> = {
  ...programmingLessons,
  ...advancedLessons,
  ...dsaLessons,
  sorting: sortingLesson,
  "linked-lists": linkedListLesson,
  "stacks-queues": stackQueueLesson,
  graphs: graphLesson,
  "weighted-shortest-paths": weightedLesson,
  trees: treeLesson,
  "variables-data-types": {
    topicId: "variables-data-types",
    minutes: 12,
    objectives: [
      "Explain how a variable associates a name with a value.",
      "Distinguish numbers, strings, and booleans.",
      "Trace assignments and predict the value of a simple expression.",
    ],
    introduction: [
      "Imagine keeping track of a shopping basket. You need to remember the price of an item, how many you want, and whether a discount applies. A program needs a way to refer to those values too. A variable gives a value a name so that you can use it later.",
      "In Python, price = 4.5 associates the name price with the number 4.5. You can read = as “assign the value on the right to the name on the left.” It is an instruction, not a statement that two things are mathematically equal. These examples use Python 3; the underlying ideas appear in most programming languages.",
    ],
    concept: {
      title: "A value has a type",
      paragraphs: [
        'A data type describes what kind of value you have and which operations make sense for it. Python uses int for whole numbers such as 3, float for numbers such as 4.5, str for text such as "notebook", and bool for the logical values True and False. Quotation marks make "3" text; without them, 3 is a number.',
        'Types affect behavior: 3 + 2 adds numbers to give 5, while "3" + "2" joins text to give "32". Python does not automatically turn "3" into a number when you add it to 2; that expression raises a TypeError. If the text represents a valid integer, int("3") converts it explicitly.',
        "Python names can be reassigned to values of different types. Other languages may restrict the type of a variable. In Python, the type belongs to the value: type(3) is int even if you later assign a string to the same name. Choose descriptive names, such as item_count, so your code explains its purpose.",
      ],
    },
    demonstration: {
      kind: "types",
      caption:
        'The quotes matter: the number 3 and the string "3" represent different kinds of values.',
    },
    workedExample: {
      title: "Calculate a basket total",
      introduction:
        "A notebook costs 4.50 and you buy three. Let’s follow the program’s state rather than guessing its output.",
      steps: [
        "Assign price = 4.5. The name price now refers to a float with value 4.5.",
        "Assign quantity = 3. The name quantity refers to an int with value 3.",
        "Evaluate price * quantity: 4.5 × 3 is 13.5. Assign that result to total.",
        "Assign quantity = 4. Only quantity changes. total still refers to 13.5 because the earlier expression has already been evaluated.",
        "To update the total, evaluate total = price * quantity again. The new result is 18.0.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Names, values, and reassignment",
      source:
        'price = 4.5\nquantity = 3\nitem_name = "notebook"\nhas_discount = False\n\ntotal = price * quantity\nquantity = 4\nprint(total)       # 13.5 — the stored result\n\ntotal = price * quantity\nprint(total)       # 18.0 — calculated again',
      explanation:
        "Assignment stores the result of an expression; it does not create a live spreadsheet formula. Decimal prices here are a teaching example. Binary floating-point cannot represent every decimal exactly, so production money calculations need a deliberate representation such as integer cents or decimal arithmetic.",
    },
    misconceptions: [
      {
        belief: "“The = sign checks whether values are equal.”",
        correction:
          "In Python, = assigns a value. The == operator compares two values and produces a boolean.",
      },
      {
        belief: "“Changing quantity automatically changes total.”",
        correction:
          "An assigned result does not remember the expression that produced it. Recalculate total when its inputs change.",
      },
      {
        belief: "“Anything that looks like a number is a number.”",
        correction:
          '"42" is text. Convert it explicitly when you need arithmetic, and handle text that cannot be converted.',
      },
    ],
    takeaways: [
      "Variables let you refer to values by name.",
      "Types determine how values behave in expressions.",
      "An assignment evaluates its right-hand side now; later assignments do not retroactively update that result.",
    ],
    questions: [
      {
        id: "variables-q1",
        prompt: 'What is the type of the Python value "42"?',
        options: ["int", "str", "bool"],
        correctIndex: 1,
        explanation:
          "Quotation marks create a string. The characters happen to be digits, but the value is still text.",
      },
      {
        id: "variables-q2",
        prompt: "After x = 2, y = x + 3, then x = 10, what is y?",
        options: ["5", "13", "10"],
        correctIndex: 0,
        explanation:
          "When y is assigned, x + 3 evaluates to 5. Reassigning x later does not recalculate y.",
      },
      {
        id: "variables-q3",
        prompt: 'What does the Python expression "3" + "2" produce?',
        options: ["5", "A TypeError", '"32"'],
        correctIndex: 2,
        explanation:
          "Both operands are strings, so + concatenates their characters. It does not perform numeric addition.",
      },
    ],
  },
  "binary-number-representation": {
    topicId: "binary-number-representation",
    minutes: 14,
    objectives: [
      "Read an unsigned binary number using positional weights.",
      "Convert a small nonnegative integer between decimal and binary.",
      "Explain how bit width limits the range of an unsigned integer.",
    ],
    introduction: [
      "A computer stores information using bits. A bit has one of two possible values, conventionally written 0 and 1. A single bit tells us very little, but a sequence of bits can represent a number, a letter, or part of an image. The interpretation depends on the encoding we choose.",
      "Binary is a base-two number system. It uses the same positional idea as decimal, but each place is worth twice the place to its right instead of ten times as much. This lesson focuses on unsigned whole numbers: zero and positive integers, with no sign bit or fractional part.",
    ],
    concept: {
      title: "The position gives a bit its weight",
      paragraphs: [
        "In decimal, 305 means 3 × 100 + 0 × 10 + 5 × 1. The weights are powers of ten. In binary, the rightmost weights are 1, 2, 4, 8, 16, and so on: powers of two. A 1 includes that position’s weight in the total; a 0 leaves it out.",
        "Read 1101₂ as “one one zero one in base two.” From left to right its weights are 8, 4, 2, and 1, so its value is 8 + 4 + 0 + 1 = 13 in decimal. The subscript ₂ identifies the base; it is not another digit. Leading zeroes do not change the value: 00001101₂ also represents 13.",
        "With n bits there are 2ⁿ possible bit patterns. For unsigned integers these represent values from 0 through 2ⁿ − 1. Four bits therefore represent 0 through 15. Eight bits, called a byte, represent 0 through 255 when interpreted as an unsigned integer. Signed numbers and fractions require additional encoding rules.",
      ],
    },
    demonstration: {
      kind: "binary",
      caption: "1101₂ = (1 × 8) + (1 × 4) + (0 × 2) + (1 × 1) = 13₁₀",
    },
    workedExample: {
      title: "Convert 19 from decimal to binary",
      introduction:
        "Choose powers of two from largest to smallest, keeping track of what remains.",
      steps: [
        "The largest power of two no greater than 19 is 16. Put a 1 in the 16s place. The remainder is 19 − 16 = 3.",
        "The next weights are 8 and 4. Both exceed the remainder 3, so put a 0 in each place.",
        "The weight 2 fits into 3. Put a 1 in the 2s place and subtract 2, leaving 1.",
        "The weight 1 fits into 1. Put a 1 in the 1s place, leaving 0.",
        "Read the bits in weight order 16, 8, 4, 2, 1: 10011₂. Check by adding 16 + 2 + 1 = 19.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Check both directions",
      source:
        'bits = "1101"\nvalue = int(bits, 2)\nprint(value)             # 13\n\nprint(bin(19))           # 0b10011\nprint(format(19, "08b")) # 00010011',
      explanation:
        "int(bits, 2) interprets the string in base two. bin adds the prefix 0b to identify binary. The formatting specification 08b requests binary padded to at least eight digits with leading zeroes; it does not restrict the integer to eight bits.",
    },
    misconceptions: [
      {
        belief: "“1101 in binary means one thousand one hundred and one.”",
        correction:
          "That reading assumes base ten. In base two the positions have weights 8, 4, 2, and 1, giving thirteen.",
      },
      {
        belief: "“Four unsigned bits can store the number 16.”",
        correction:
          "They provide 16 patterns, including zero. The largest value is 15; 16 needs five bits: 10000₂.",
      },
      {
        belief: "“A bit pattern always means the same thing.”",
        correction:
          "Its meaning depends on the representation. The same bits may encode an unsigned integer, part of a signed value, or a character.",
      },
    ],
    takeaways: [
      "Binary place values are powers of two, starting with 1 on the right.",
      "Add the weights of the positions containing 1 to recover an unsigned value.",
      "An unsigned n-bit integer ranges from 0 to 2ⁿ − 1.",
    ],
    questions: [
      {
        id: "binary-q1",
        prompt: "What decimal value does 1010₂ represent?",
        options: ["10", "12", "1010"],
        correctIndex: 0,
        explanation: "The 1 bits have weights 8 and 2. Their sum is 10.",
      },
      {
        id: "binary-q2",
        prompt: "What is the largest unsigned integer that fits in four bits?",
        options: ["4", "16", "15"],
        correctIndex: 2,
        explanation:
          "Four bits give 2⁴ = 16 patterns. Starting at zero makes the largest value 16 − 1 = 15.",
      },
      {
        id: "binary-q3",
        prompt: "Which binary representation equals decimal 6?",
        options: ["101₂", "110₂", "100₂"],
        correctIndex: 1,
        explanation:
          "110₂ uses the weights 4 and 2: 4 + 2 = 6. The rightmost weight 1 is excluded.",
      },
    ],
  },
  "big-o-notation": {
    topicId: "big-o-notation",
    minutes: 16,
    objectives: [
      "Define input size and choose a basic operation to count.",
      "Distinguish constant, linear, and quadratic growth.",
      "Explain what Big O does and does not tell you about running time.",
    ],
    introduction: [
      "Suppose you need to find a name in a list. Checking every name may be fine for ten entries. What happens when there are a million? Big O notation helps us describe how the amount of work grows as the input gets larger, without tying the explanation to one machine’s speed.",
      "Start by naming the input size. For a list, n usually means the number of elements. Then choose an operation to count, such as comparing one element with a target. We use a simple model where an individual comparison or indexed list access costs a constant amount of work.",
    ],
    concept: {
      title: "Describe growth, not stopwatch time",
      paragraphs: [
        "O(1), read “order one,” is constant growth: the work is bounded independently of n. Reading the first element of a nonempty Python list is an example. O(n) is linear growth: a complete scan performs n checks. O(n²) is quadratic growth: comparing every element with every element performs n × n checks.",
        "Big O is an asymptotic upper bound. Formally, T(n) is O(f(n)) if constants c > 0 and n₀ exist such that 0 ≤ T(n) ≤ c × f(n) for every n ≥ n₀. In practice, we usually report a tight, useful bound. A linear function is also O(n²), but calling it O(n) communicates its growth more precisely.",
        "When T(n) = 3n + 2, the n term controls growth for large n. Constant multipliers and lower-order terms are omitted, giving O(n). This does not mean three operations take the same time as one. It means their growth has the same shape. Hardware, implementation details, and constants still matter for actual running time.",
        "Always say which case you mean. A search can succeed on its first comparison, but may need to examine every element. The example below has best-case O(1) time and worst-case O(n) time. Big O does not inherently mean “worst case”; the case is a separate choice in your analysis.",
      ],
    },
    demonstration: {
      kind: "complexity",
      caption:
        "Illustrative operation counts. Doubling n leaves constant work unchanged, doubles linear work, and quadruples quadratic work.",
    },
    workedExample: {
      title: "Analyze a linear search",
      introduction:
        "We search [8, 3, 9, 2] for 2 by looking at elements in order.",
      steps: [
        "Define n as the list length. Here n = 4. Count comparisons between a list value and the target.",
        "Compare 8 with 2: no match. Compare 3 with 2: no match. Compare 9 with 2: no match.",
        "Compare the final value 2 with the target: a match. Return its index, 3. The search made four comparisons.",
        "For any list of length n, a target at the end or absent from the list requires n comparisons. The worst-case work grows linearly, so it is O(n).",
        "If the first element matches, the function returns after one comparison. That best case is O(1). We must distinguish it from the worst-case guarantee.",
      ],
    },
    code: {
      language: "Python 3",
      title: "One pass through the input",
      source:
        "def find_index(values, target):\n    for index, value in enumerate(values):\n        if value == target:\n            return index\n    return -1\n\nprint(find_index([8, 3, 9, 2], 2))  # 3\nprint(find_index([8, 3, 9, 2], 7))  # -1",
      explanation:
        "For numeric values whose comparisons we treat as constant cost, each iteration does constant work. There are at most n iterations, giving O(n) worst-case time. The function uses O(1) auxiliary space: it keeps only a few variables and does not copy the input list. Comparing arbitrarily large values could require a more detailed cost model.",
    },
    misconceptions: [
      {
        belief: "“O(n) means the program takes n seconds.”",
        correction:
          "n is input size, not a unit of time. Big O describes a growth bound and does not predict exact seconds.",
      },
      {
        belief: "“Any two nested loops are O(n²).”",
        correction:
          "Count their iterations. If the inner loop always runs three times and the outer runs n times, there are 3n iterations: O(n). Two independent full n-length loops nested together do give O(n²).",
      },
      {
        belief: "“An O(n) algorithm is always faster than an O(n²) algorithm.”",
        correction:
          "Constants and input sizes matter. Linear growth eventually wins under comparable assumptions, but a particular small input can favor a quadratic implementation.",
      },
    ],
    takeaways: [
      "Choose an input size and cost model before analyzing an algorithm.",
      "Keep the dominant growth term and omit constant multipliers in Big O.",
      "State the case you analyze, and keep time complexity separate from space complexity.",
    ],
    questions: [
      {
        id: "big-o-q1",
        prompt:
          "A full scan makes one comparison per element. If n doubles, how does the comparison count change?",
        options: ["It stays the same", "It doubles", "It quadruples"],
        correctIndex: 1,
        explanation:
          "One comparison per element gives n comparisons. With 2n elements, the scan makes 2n comparisons.",
      },
      {
        id: "big-o-q2",
        prompt:
          "What is the tightest of these Big O bounds for T(n) = 3n + 10?",
        options: ["O(1)", "O(n²)", "O(n)"],
        correctIndex: 2,
        explanation:
          "The linear term dominates as n grows. Removing its constant multiplier and the fixed addition gives O(n).",
      },
      {
        id: "big-o-q3",
        prompt:
          "An outer loop runs n times; an inner loop always runs 3 times. What is the total growth?",
        options: ["O(n)", "O(n²)", "O(1)"],
        correctIndex: 0,
        explanation:
          "There are n × 3 iterations. Three is constant, so 3n grows linearly: O(n).",
      },
    ],
  },
};

export const lessons: Record<string, Lesson> = Object.fromEntries(
  Object.entries(authoredLessons).map(([id, lesson]) => [
    id,
    {
      ...lesson,
      ...(codingExercises[id]
        ? { codingExercises: [codingExercises[id]] }
        : [
              ...dsaCodingExercises,
              ...sortingCodingExercises,
              ...linkedListCodingExercises,
              ...stackQueueCodingExercises,
              ...graphCodingExercises,
              ...weightedCodingExercises,
              ...treeCodingExercises,
            ].some((exercise) => exercise.topicId === id)
          ? {
              codingExercises: [
                ...dsaCodingExercises,
                ...sortingCodingExercises,
                ...linkedListCodingExercises,
                ...stackQueueCodingExercises,
                ...graphCodingExercises,
                ...weightedCodingExercises,
                ...treeCodingExercises,
              ].filter((exercise) => exercise.topicId === id),
            }
          : {}),
    },
  ]),
);
