import type { Lesson } from "./types";

export const programmingLessons: Record<string, Lesson> = {
  "operators-expressions": {
    topicId: "operators-expressions",
    minutes: 24,
    objectives: [
      "Trace an expression in precedence order and state its value and type.",
      "Distinguish assignment, equality, and comparison.",
      "Choose division or modulo to model groups and leftovers.",
      "Combine boolean comparisons and justify the result.",
    ],
    introduction: [
      "You are ordering three notebooks at 8 credits each with a 2-credit delivery charge. The names price and quantity store the inputs, but how does a program combine them into a bill? An expression describes a calculation whose result is a value. That value can be stored, printed, compared, or used in another expression.",
      "Variables gave us names for values. Operators let us ask questions and transform those values. Rather than reading a formula as a single mysterious instruction, replace each name with its current value and reduce one operation at a time. This skill will also let you reason about decisions and repeated work.",
    ],
    concept: {
      title: "Expressions are computations that produce values",
      paragraphs: [
        "In price * quantity + 2, price and quantity are operands: values supplied to operators. Substitute 8 and 3, multiply to get 24, then add 2 to get 26. The expression has the integer value 26. It does not change price or quantity. The assignment total = price * quantity + 2 first evaluates the right side and then binds the resulting value to total.",
        'Python arithmetic includes + (addition), - (subtraction), * (multiplication), / (true division), // (floor division), % (remainder), and ** (exponentiation). Types still matter: 3 + 2 is 5, while "3" + "2" is "32". A symbol alone does not determine behavior; examine the operand types as well. Invalid combinations such as "3" + 2 raise an error rather than guessing your intent.',
        "A comparison is also an expression: total <= 25 produces False for total 26. Comparisons include <, <=, >, >=, ==, and !=. The equality operator == asks whether two values are equal; the assignment statement = associates a name with a value. Python does not permit total = 25 where a comparison expression is required.",
      ],
    },
    sections: [
      {
        title: "Precedence: choose the next operation deliberately",
        paragraphs: [
          "Parentheses group a subexpression. In (8 + 2) * 3, calculate 10 first and then 30. Without parentheses, 8 + 2 * 3 gives 14. Multiplication, division, floor division, and modulo have higher precedence than addition and subtraction. Operators at the same arithmetic level usually group left to right: 20 / 5 * 2 is 8.0.",
          "Exponentiation has higher precedence than multiplication and groups right to left: 2 ** 3 ** 2 means 2 ** (3 ** 2), or 512. A unary minus negates a value; -2 ** 2 is -(2 ** 2), or -4. Write (-2) ** 2 if you mean 4. Prefer clear parentheses to testing a reader’s memory.",
          "For the expressions used here, work from parentheses to exponentiation, multiplication/division/remainder, addition/subtraction, comparisons, not, and, then or. Evaluation order and grouping are different ideas: precedence determines grouping; Python evaluates operands from left to right except where short-circuiting skips one.",
        ],
      },
      {
        title: "Division answers different questions",
        paragraphs: [
          "If 17 students sit at tables of 5, 17 / 5 is 3.4, a floating-point result. 17 // 5 is 3, the number of full groups; 17 % 5 is 2, the number left over. With integer operands and a nonzero divisor, a == (a // b) * b + a % b. Division or modulo by zero raises ZeroDivisionError.",
          "Floor division rounds down toward negative infinity, not toward zero: -7 // 3 is -3 and -7 % 3 is 2. For these beginner grouping problems use nonnegative counts and positive group sizes. Even 10 / 2 produces 5.0 in Python 3. Floor division with float operands can return a float, such as 7.0 // 2 giving 3.0.",
        ],
        code: "students = 17\nprint(students / 5)\nprint(students // 5)\nprint(students % 5)",
      },
      {
        title: "Combine questions with boolean operators",
        paragraphs: [
          "Suppose a shop accepts an order when the total fits a budget and stock is available. For boolean operands, and is True only if both operands are True; or is True if at least one is True; not flips a boolean. If affordable is False and in_stock is True, affordable and in_stock is False, while affordable or in_stock is True.",
          "Comparisons bind more tightly than and: total <= budget and quantity > 0 combines two comparisons. Use parentheses to make the two questions visible. Python short-circuits: and skips the right operand when the left is false, and or skips it when the left is true. For general operands these operators return an operand, not necessarily a bool; use boolean comparisons while learning.",
        ],
        code: "total = 26\nbudget = 30\nin_stock = True\ncan_order = (total <= budget) and in_stock\nprint(can_order)",
      },
    ],
    demonstration: {
      kind: "trace",
      title: "Trace a notebook bill",
      caption:
        "Follow the highlighted instructions and compare each resulting state.",
      source:
        "price = 8\nquantity = 3\ntotal = price * quantity + 2\naffordable = total <= 25\nprint(total, affordable)",
      steps: [
        {
          lines: [1],
          explanation: "Bind price to 8.",
          variables: [
            {
              name: "price",
              value: 8,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [2],
          explanation: "Bind quantity to 3.",
          variables: [
            {
              name: "price",
              value: 8,
              scope: "global",
            },
            {
              name: "quantity",
              value: 3,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [3],
          explanation:
            "Evaluate 8 * 3 + 2: 24 + 2 becomes 26, then assign total.",
          variables: [
            {
              name: "price",
              value: 8,
              scope: "global",
            },
            {
              name: "quantity",
              value: 3,
              scope: "global",
            },
            {
              name: "total",
              value: 26,
              scope: "global",
            },
          ],
          output: [],
          detail: "Expression: 8 * 3 + 2 → 24 + 2 → 26",
        },
        {
          lines: [4],
          explanation: "26 <= 25 is False; assign the boolean to affordable.",
          variables: [
            {
              name: "price",
              value: 8,
              scope: "global",
            },
            {
              name: "quantity",
              value: 3,
              scope: "global",
            },
            {
              name: "total",
              value: 26,
              scope: "global",
            },
            {
              name: "affordable",
              value: false,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [5],
          explanation: "print displays the two values separated by a space.",
          variables: [
            {
              name: "price",
              value: 8,
              scope: "global",
            },
            {
              name: "quantity",
              value: 3,
              scope: "global",
            },
            {
              name: "total",
              value: 26,
              scope: "global",
            },
            {
              name: "affordable",
              value: false,
              scope: "global",
            },
          ],
          output: ["26 False"],
        },
      ],
      result: "The bill is 26 and exceeds the 25-credit budget.",
    },
    workedExample: {
      title: "Work out the bill before comparing it",
      introduction:
        "A budget check needs the computed total, not the price of a single notebook.",
      steps: [
        "Substitute price = 8 and quantity = 3 into price * quantity + 2.",
        "Multiply first: 8 * 3 = 24, then add delivery: 24 + 2 = 26.",
        "Assign 26 to total. Evaluate 26 <= 25 to get False.",
        "Printing total and affordable produces 26 False; it does not change either value.",
      ],
    },
    code: {
      language: "Python 3",
      title: "A complete budget calculation",
      source:
        "price = 8\nquantity = 3\ntotal = price * quantity + 2\naffordable = total <= 25\nprint(total, affordable)",
      explanation:
        "Output: 26 False. Changing quantity to 2 recomputes the total as 18 when the program runs again; an old stored total does not update itself.",
    },
    misconceptions: [
      {
        belief: "An expression automatically updates its input variables.",
        correction:
          "Arithmetic produces a value. Rebinding requires an assignment, such as total = total + 2.",
      },
      {
        belief: "= and == mean the same thing.",
        correction:
          "total = 25 assigns; total == 25 computes a boolean comparison.",
      },
      {
        belief: "// just removes the decimal digits.",
        correction:
          "It floors the quotient. For negative numbers that differs from truncating toward zero.",
      },
      {
        belief: "Floating-point numbers are exact decimal fractions.",
        correction:
          "Many decimal fractions have approximate binary representations. For example 0.1 + 0.2 == 0.3 is False in Python; real currency applications need deliberate rounding or decimal arithmetic.",
      },
    ],
    takeaways: [
      "Reduce expressions one operation at a time, tracking types.",
      "Use / for a quotient, // for floor division, and % for a remainder.",
      "Comparisons produce booleans; boolean operators combine conditions.",
      "Next, use a computed condition to choose which instructions run.",
    ],
    questions: [
      {
        id: "operators-q1",
        prompt: "Which expression tests equality?",
        options: ["x = 4", "x == 4", "x + 4"],
        correctIndex: 1,
        explanation:
          "== compares values and returns a boolean; = binds a name in an assignment statement.",
      },
      {
        id: "operators-q2",
        prompt: "What is 17 % 5?",
        options: ["3", "3.4", "2"],
        correctIndex: 2,
        explanation:
          "Three full groups use 15; the remainder after dividing 17 by 5 is 2.",
      },
      {
        id: "operators-q3",
        prompt: "What is False or (3 < 5)?",
        options: ["True", "False", "5"],
        correctIndex: 0,
        explanation:
          "The comparison produces True. Boolean or is True when at least one operand is True.",
      },
    ],
    exercises: [
      {
        id: "operators-p1",
        prompt:
          "What does this print? Explain the evaluation order before checking.",
        options: ["14", "20", "10"],
        correctIndex: 0,
        explanation:
          "Multiplication groups first: 3 * 4 = 12. Adding 2 produces 14; assignment stores that result.",
        source: "value = 2 + 3 * 4\nprint(value)",
      },
      {
        id: "operators-p2",
        prompt: "What two values are printed?",
        options: ["2 3", "2.6 3", "3 2"],
        correctIndex: 0,
        explanation:
          "13 // 5 floors 2.6 to 2. Then 13 % 5 is 3 because 13 = 2 * 5 + 3.",
        source: "print(13 // 5, 13 % 5)",
      },
    ],
    nextStep:
      "Continue to Conditionals to make a program choose a branch using the boolean expressions you can now trace.",
  },
  conditionals: {
    topicId: "conditionals",
    minutes: 25,
    objectives: [
      "Predict the single selected branch of an if/elif/else chain.",
      "Trace nested decisions using indentation and evaluation order.",
      "Diagnose overlapping tests, missing boundaries, and boolean logic errors.",
    ],
    introduction: [
      "A learning app recommends a next step from a quiz score. A score of 80 or more unlocks an advanced activity; a score of 60 to 79 suggests the next lesson; a lower score suggests review. Calculating all three recommendations would be confusing. The program must choose the appropriate instructions.",
      "You already know that score >= 80 produces a boolean. A conditional uses that value to select control flow: the path execution takes through the program. The key question is not just whether a condition is true, but which tests are reached and which block is selected.",
    ],
    concept: {
      title: "One decision, one selected branch",
      paragraphs: [
        "An if statement evaluates its condition. If the condition is true, its indented body executes. Otherwise, Python tries the next elif condition, if present. The first true condition selects its body and skips every remaining elif and else in that chain. If none is true, the else body runs; without else, the whole chain may do nothing.",
        'In the score example, 72 >= 80 is False, so execution reaches 72 >= 60, which is True. The program assigns "ready" and skips else. For 90, the first condition is True and the second condition is not even evaluated. Although 90 also satisfies >= 60, only the first branch of this chain runs. The next unindented instruction runs after the selected body finishes.',
        "A colon starts each branch header, and indentation identifies its block. Use four spaces consistently. Instructions aligned with if are outside the decision; deeper indentation belongs to a branch or nested decision. Mixing tabs and spaces can cause errors. Read the indentation as the structure of the program, not as decoration.",
      ],
    },
    sections: [
      {
        title: "Conditions and a small truth table",
        paragraphs: [
          'Start with explicit boolean expressions, such as age >= 16. Python also accepts values directly as conditions: zero, empty strings, empty collections, and None are false-like; most other values are true-like. The nonempty string "False" is true-like. Avoid confusing a user’s text with an actual boolean.',
          "For boolean A and B the four possibilities are: True/True → and True, or True; True/False → and False, or True; False/True → and False, or True; False/False → and False, or False. not A reverses A. To require both a high enough score and a submitted project, use and; or would admit someone who satisfies only one requirement.",
        ],
        code: 'score = 72\nsubmitted = True\nif score >= 60 and submitted:\n    print("Continue")\nelse:\n    print("Finish the requirements")',
      },
      {
        title: "Order tests from specific to broad",
        paragraphs: [
          "If score >= 60 appears before elif score >= 80, a score of 90 selects the first branch. The advanced branch is unreachable for ordinary numeric scores because every score >= 80 is already >= 60. Testing the higher threshold first expresses the intended priority.",
          "Separate if statements are separate decisions. For score 90, if score >= 80 and a later if score >= 60 can both execute. Use one chain for mutually exclusive categories. Use independent if statements for independent actions, such as showing a badge and sending a receipt.",
        ],
      },
      {
        title: "Nested decisions and boundary checks",
        paragraphs: [
          "A nested if is reached only inside the chosen outer branch. Here a member receives a discount only when the purchase reaches 20. The inner else belongs to the inner if; the outer else belongs to the member test. With member False the total is never tested by this program.",
          "Trace values just below, at, and just above a boundary. For the score example, try 59, 60, 79, and 80. Check whether the input domain is valid too: a real quiz app should reject negative scores or scores above its maximum rather than silently categorizing them.",
        ],
        code: 'member = True\ntotal = 18\nif member:\n    if total >= 20:\n        print("Discount")\n    else:\n        print("Member, below minimum")\nelse:\n    print("Standard price")',
      },
      {
        title: "Repair common logical errors",
        paragraphs: [
          'To test whether color is red or blue, write color == "red" or color == "blue". The expression color == "red" or "blue" is always true-like because the nonempty string "blue" is true-like. Each side should express a complete question.',
          "Avoid assigning a value in only one branch and then assuming it exists afterward. An else can establish a default, or assign the default before the decision. Ask which assignments execute on every path that reaches a later use.",
        ],
      },
    ],
    demonstration: {
      kind: "trace",
      title: "Trace a score recommendation",
      caption:
        "Follow the highlighted instructions and compare each resulting state.",
      source:
        'score = 72\nif score >= 80:\n    grade = "advanced"\nelif score >= 60:\n    grade = "ready"\nelse:\n    grade = "review"\nprint(grade)',
      steps: [
        {
          lines: [1],
          explanation: "Assign score 72.",
          variables: [
            {
              name: "score",
              value: 72,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [2],
          explanation: "72 >= 80 is False. Skip the advanced body on line 3.",
          variables: [
            {
              name: "score",
              value: 72,
              scope: "global",
            },
          ],
          output: [],
          detail: "First condition: False · branch skipped",
        },
        {
          lines: [4],
          explanation: "72 >= 60 is True. Choose the elif body.",
          variables: [
            {
              name: "score",
              value: 72,
              scope: "global",
            },
          ],
          output: [],
          detail: "Selected branch: elif score >= 60",
        },
        {
          lines: [5],
          explanation: "Assign ready. The else body on line 7 is skipped.",
          variables: [
            {
              name: "score",
              value: 72,
              scope: "global",
            },
            {
              name: "grade",
              value: "ready",
              scope: "global",
            },
          ],
          output: [],
          detail: "Selected body: line 5",
        },
        {
          lines: [8],
          explanation: "After the chain, print the selected recommendation.",
          variables: [
            {
              name: "score",
              value: 72,
              scope: "global",
            },
            {
              name: "grade",
              value: "ready",
              scope: "global",
            },
          ],
          output: ["ready"],
        },
      ],
      result: "Only the ready branch executes; output is ready.",
    },
    workedExample: {
      title: "Choose the first matching recommendation",
      introduction:
        "Consider scores 72 and 90 with the same ordered conditions.",
      steps: [
        "For 72, the first comparison 72 >= 80 produces False; no advanced assignment runs.",
        "The next comparison 72 >= 60 produces True, so grade becomes ready.",
        "Skip else, leave the chain, and print ready.",
        "For 90, the first test is True. Assign advanced and skip both later branches, including their tests.",
      ],
    },
    code: {
      language: "Python 3",
      title: "A recommendation with exclusive branches",
      source:
        'score = 72\nif score >= 80:\n    grade = "advanced"\nelif score >= 60:\n    grade = "ready"\nelse:\n    grade = "review"\nprint(grade)',
      explanation:
        "The output is ready. Change score to 90 for advanced, 60 for ready, or 59 for review. Exactly one assignment to grade runs in every case.",
    },
    misconceptions: [
      {
        belief: "Every true condition in an elif chain runs.",
        correction:
          "Only the first matching branch runs. Later conditions are skipped even if they would be true.",
      },
      {
        belief: "Indentation only makes code look tidy.",
        correction:
          "Python uses indentation to determine which instructions belong to each branch.",
      },
      {
        belief: "Two if statements behave like if/elif.",
        correction:
          "Independent if statements can both run. Choose a chain when the actions must be mutually exclusive.",
      },
    ],
    takeaways: [
      "A condition chooses a path; it does not merely label a block.",
      "Trace tests in order and stop the chain at the first true condition.",
      "Indentation shows branch membership and nesting.",
      "Check boundary values and distinguish and from or.",
    ],
    questions: [
      {
        id: "conditionals-q1",
        prompt: "With score 90, which branch in the worked example runs?",
        options: ["Both advanced and ready", "Only advanced", "Only ready"],
        correctIndex: 1,
        explanation:
          "The first condition succeeds, so later elif conditions and else are skipped.",
      },
      {
        id: "conditionals-q2",
        prompt: "Which requires both conditions?",
        options: [
          "age >= 16 or trained",
          "age >= 16 and trained",
          "not trained",
        ],
        correctIndex: 1,
        explanation:
          "and requires both booleans to be True. or would allow either condition alone.",
      },
      {
        id: "conditionals-q3",
        prompt: "When does a nested if run?",
        options: [
          "On every program run",
          "Before its outer if",
          "Only if execution enters its containing block",
        ],
        correctIndex: 2,
        explanation:
          "A nested statement is reached through its outer branch; a skipped outer block skips everything inside it.",
      },
    ],
    exercises: [
      {
        id: "conditionals-p1",
        prompt: "What is printed for this boundary value?",
        options: ["high", "middle", "low"],
        correctIndex: 1,
        explanation:
          "10 > 10 is False, but 10 >= 5 is True. The elif body runs and else is skipped.",
        source:
          'x = 10\nif x > 10:\n    print("high")\nelif x >= 5:\n    print("middle")\nelse:\n    print("low")',
      },
      {
        id: "conditionals-p2",
        prompt: "Which lines are printed, in order?",
        options: ["A only", "B only", "A then B"],
        correctIndex: 2,
        explanation:
          "These are independent decisions. 8 > 5 and 8 > 0 both evaluate to True, so both bodies execute.",
        source: 'x = 8\nif x > 5:\n    print("A")\nif x > 0:\n    print("B")',
      },
    ],
    nextStep:
      "Continue to Loops: a boolean can decide not only which branch runs, but whether another repetition begins.",
  },
  loops: {
    topicId: "loops",
    minutes: 32,
    objectives: [
      "Trace each iteration and update counters and accumulators.",
      "Explain range boundaries and why a loop terminates.",
      "Compare for and while and diagnose off-by-one errors.",
      "Predict the effects of break, continue, and small nested loops.",
    ],
    introduction: [
      "A study tracker adds the minutes from several sessions. Copying an addition statement for every session fails as soon as the number of sessions changes. A loop describes one repeated action and the rule that determines which repetitions happen.",
      "A conditional chooses whether a block runs once. A loop repeatedly reaches a block, so the values after one iteration become the starting state for the next. Iteration means one execution of the loop body. Trace that changing state rather than mentally executing all repetitions at once.",
    ],
    concept: {
      title: "Repetition is a sequence of state transitions",
      paragraphs: [
        "A for loop takes one item at a time from an iterable, such as a range or list. It assigns that item to the loop variable and executes the indented body. Then it requests the next item. When there are no more items, it continues with the instruction after the loop. for i in range(1, 4) receives 1, then 2, then 3; the stop value 4 is excluded.",
        "An accumulator combines values across iterations. Start total at 0 before adding numbers: total += i means total = total + i here. For i values 1, 2, 3, total changes from 0 to 1 to 3 to 6. Initializing total inside the body would erase earlier work. A counter is a variable that records how many events occurred, often by adding 1 for each matching item.",
        "A while loop checks a condition before every iteration, including the first. If false initially, its body runs zero times. If true, it runs the body, then checks again using the updated state. To reason about termination, identify a value that moves toward making the condition false. A finite range terminates when exhausted; a while loop may run forever if its condition never becomes false.",
      ],
    },
    sections: [
      {
        title: "A trace table you can build yourself",
        paragraphs: [
          "Use columns for the iteration number, loop variable, previous total, and new total. For range(1, 4) the rows are: iteration 1, i = 1, 0 → 1; iteration 2, i = 2, 1 → 3; iteration 3, i = 3, 3 → 6. The number of completed iterations is different from the current loop variable in general: range(5, 8) also has three iterations.",
          "An invariant is a fact that remains true at a particular point each iteration. After each addition here, total equals the sum of all values processed so far. That explains why starting at zero and retaining the total is correct. Empty input gives zero without any special loop body.",
        ],
      },
      {
        title: "Choose a for loop for a known collection",
        paragraphs: [
          "range(stop) begins at 0 and excludes stop. range(start, stop, step) permits a nonzero step: range(5, 0, -2) gives 5, 3, 1. range(3, 3) is empty; it does not run once. Match the bounds to the problem rather than adding 1 mechanically.",
          "To sum the first three positive integers, use range(1, 4). Using range(1, 3) misses 3, an off-by-one error. For a sequence, direct iteration over items is often clearer than computing positions. This example counts sessions reaching a target and adds all their minutes.",
        ],
        code: "total = 0\nqualifying = 0\nfor minutes in [12, 20, 8]:\n    total += minutes\n    if minutes >= 10:\n        qualifying += 1\nprint(total, qualifying)",
      },
      {
        title: "Choose while when a condition determines continuation",
        paragraphs: [
          "In this countdown, remaining begins at 3. Before the body, remaining > 0 must be true. Each iteration prints remaining then subtracts 1, producing 3, 2, 1. At remaining = 0 the condition is false and execution reaches Done. For an initial nonnegative integer, remaining decreases by one until zero, which proves termination.",
          "Removing remaining -= 1 leaves the condition true forever for an initial 3. Moving the decrement before print changes the output to 2, 1, 0. Trace the update order. When input or external events control a while loop, you also need assumptions about those events to justify termination.",
        ],
        code: 'remaining = 3\nwhile remaining > 0:\n    print(remaining)\n    remaining -= 1\nprint("Done")',
      },
      {
        title: "break ends a loop; continue skips the rest of one iteration",
        paragraphs: [
          "break exits the nearest enclosing loop immediately. Use it when a search has found its answer. continue skips the remaining body instructions and starts the next iteration; in a while loop that means checking the condition again. A continue before a necessary state update can accidentally prevent termination.",
          "Below, 1 and 3 are printed. Even 2 and 4 reach continue and skip print. At 5, break exits before the parity test. Neither control affects the print after the loop. Use these tools when they clarify the stop or skip rule; ordinary conditions often suffice.",
        ],
        code: 'for n in range(1, 7):\n    if n == 5:\n        break\n    if n % 2 == 0:\n        continue\n    print(n)\nprint("Done")',
      },
      {
        title: "Nested loops repeat the entire inner traversal",
        paragraphs: [
          "For each row, the inner loop visits both columns. The output pairs are 1 1, 1 2, 2 1, 2 2: four body executions. A new inner range starts each outer iteration. For r rows and c columns, this body executes r * c times.",
          "Indentation tells you what repeats. A print aligned with the inner for but inside the outer loop would run once per row. A break inside the inner loop exits only that inner loop; the outer loop can continue.",
        ],
        code: "for row in range(1, 3):\n    for column in range(1, 3):\n        print(row, column)",
      },
    ],
    demonstration: {
      kind: "trace",
      title: "Trace an accumulator",
      caption:
        "Follow the highlighted instructions and compare each resulting state.",
      source: "total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)",
      steps: [
        {
          lines: [1],
          explanation: "Initialize the accumulator once.",
          variables: [
            {
              name: "total",
              value: 0,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [2],
          explanation: "Get the first item, 1, from the range.",
          variables: [
            {
              name: "total",
              value: 0,
              scope: "global",
            },
            {
              name: "i",
              value: 1,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 1 · next item exists",
        },
        {
          lines: [3],
          explanation: "Read total 0 and i 1, then store 1.",
          variables: [
            {
              name: "total",
              value: 1,
              scope: "global",
            },
            {
              name: "i",
              value: 1,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 1 complete",
        },
        {
          lines: [2],
          explanation: "Get the next item, 2. Retain total 1.",
          variables: [
            {
              name: "total",
              value: 1,
              scope: "global",
            },
            {
              name: "i",
              value: 2,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 2 · next item exists",
        },
        {
          lines: [3],
          explanation: "1 + 2 = 3, so total becomes 3.",
          variables: [
            {
              name: "total",
              value: 3,
              scope: "global",
            },
            {
              name: "i",
              value: 2,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 2 complete",
        },
        {
          lines: [2],
          explanation: "Get the next item, 3.",
          variables: [
            {
              name: "total",
              value: 3,
              scope: "global",
            },
            {
              name: "i",
              value: 3,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 3 · next item exists",
        },
        {
          lines: [3],
          explanation: "3 + 3 = 6, so total becomes 6.",
          variables: [
            {
              name: "total",
              value: 6,
              scope: "global",
            },
            {
              name: "i",
              value: 3,
              scope: "global",
            },
          ],
          output: [],
          detail: "Iteration 3 complete",
        },
        {
          lines: [2],
          explanation:
            "The range is exhausted: 4 is excluded. Exit the loop without changing i.",
          variables: [
            {
              name: "total",
              value: 6,
              scope: "global",
            },
            {
              name: "i",
              value: 3,
              scope: "global",
            },
          ],
          output: [],
          detail: "Termination · no next item",
        },
        {
          lines: [4],
          explanation: "The unindented print runs once after the loop.",
          variables: [
            {
              name: "total",
              value: 6,
              scope: "global",
            },
            {
              name: "i",
              value: 3,
              scope: "global",
            },
          ],
          output: ["6"],
        },
      ],
      result: "Three iterations accumulate 6; the range is exhausted.",
    },
    workedExample: {
      title: "Sum without losing earlier work",
      introduction: "Follow a running total across three iterations.",
      steps: [
        "Before the loop total is 0. range(1, 4) supplies exactly 1, 2, 3.",
        "Iteration 1: total becomes 0 + 1 = 1.",
        "Iteration 2: retain 1, then total becomes 1 + 2 = 3.",
        "Iteration 3: retain 3, then total becomes 3 + 3 = 6.",
        "There is no fourth item; print runs outside the loop and displays 6.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Sum the first three positive integers",
      source: "total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)",
      explanation:
        "The output is 6. += updates the running total; the initialization happens once. The final i is 3 in Python because a for loop does not create a separate local scope.",
    },
    misconceptions: [
      {
        belief: "range includes its stop value.",
        correction: "The stop value is excluded. range(1, 4) contains 1, 2, 3.",
      },
      {
        belief: "A while body always runs at least once.",
        correction:
          "The condition is checked first. A false initial condition skips the entire body.",
      },
      {
        belief: "continue and break both stop the loop.",
        correction:
          "continue moves to the next iteration; break exits the nearest loop.",
      },
      {
        belief: "A counter and accumulator must start at 1.",
        correction:
          "Choose an initial state matching the meaning. Counts of events and sums normally begin at zero; products often begin at one.",
      },
    ],
    takeaways: [
      "Track state before and after every iteration.",
      "Keep accumulators outside the body so earlier results survive.",
      "Justify termination by exhaustion or progress toward a false condition.",
      "Test empty ranges and boundary values to find off-by-one errors.",
    ],
    questions: [
      {
        id: "loops-q1",
        prompt: "Which values does range(2, 5) provide?",
        options: ["2, 3, 4", "2, 3, 4, 5", "0, 1, 2, 3, 4"],
        correctIndex: 0,
        explanation:
          "The start 2 is included and the stop 5 is excluded, so there are three values.",
      },
      {
        id: "loops-q2",
        prompt:
          "A while condition is initially False. How many iterations run?",
        options: ["One", "Zero", "Forever"],
        correctIndex: 1,
        explanation:
          "while checks before entering the body, so no iteration begins.",
      },
      {
        id: "loops-q3",
        prompt: "What does continue do?",
        options: [
          "Ends the program",
          "Exits all loops",
          "Skips the rest of the current iteration",
        ],
        correctIndex: 2,
        explanation:
          "Execution advances to the next iteration of the nearest loop; the loop itself is not ended.",
      },
    ],
    exercises: [
      {
        id: "loops-p1",
        prompt: "What does this print?",
        options: ["6", "3", "4"],
        correctIndex: 0,
        explanation:
          "The range supplies 1, 2, 3. The accumulator becomes 1, 3, then 6, and prints after the loop.",
        source:
          "total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)",
      },
      {
        id: "loops-p2",
        prompt: "What is the final printed value?",
        options: ["0", "1", "3"],
        correctIndex: 1,
        explanation:
          "The body changes n from 3 to 2 and then 1. At 1, n > 1 is False, so no third subtraction occurs.",
        source: "n = 3\nwhile n > 1:\n    n -= 1\nprint(n)",
      },
    ],
    nextStep:
      "Continue to Functions to package a calculation or repeated procedure behind a clear input/output contract.",
  },
  functions: {
    topicId: "functions",
    minutes: 30,
    objectives: [
      "Distinguish defining a function from calling it.",
      "Map arguments to parameters and trace local state and return values.",
      "Explain why print and return serve different purposes.",
      "Decompose a calculation into reusable, composable functions.",
    ],
    introduction: [
      "A shop adds a delivery fee to many orders. Copying the same calculation into every checkout screen creates several places to fix when the rule changes. A function gives a named operation a clear contract: what inputs it accepts and what result it returns.",
      "Expressions transform values; conditionals choose actions; loops repeat work. A function packages these building blocks so another part of the program can request that work. To understand a call, follow information into the function, trace its local computation, then follow the returned value back to the caller.",
    ],
    concept: {
      title: "A definition creates an operation; a call performs it",
      paragraphs: [
        "def add_fee(amount, fee): defines a function and binds its name. It does not run the body. The indented statements run only when a call such as add_fee(10, 2) occurs. Parameters are the names in the definition; arguments are the values supplied by a particular call. For positional arguments here, 10 binds to amount and 2 binds to fee.",
        "Every call creates its own local environment: parameter names and variables assigned inside the function belong to that call. total = amount + fee binds local total to 12. return total ends the call and gives 12 back to the calling expression. In result = add_fee(price, 2), Python completes the call before binding its returned value to result.",
        "The caller pauses while the function runs, then resumes where the call was used. Calling the same function again creates fresh local bindings. A function can read names in surrounding scope, but assigning to a name in its body normally makes that name local. Prefer explicit parameters over hidden dependencies on global variables; it makes the input/output contract easier to understand and test.",
      ],
    },
    sections: [
      {
        title: "Follow a call in both directions",
        paragraphs: [
          "For result = add_fee(price, 2), first evaluate the arguments: price is 10 and the second argument is 2. Bind those values to amount and fee in a new call. Compute local total = 12, then return 12. The call expression now has value 12, so the outer assignment stores 12 in result.",
          "The local name total is not available in the caller after the call finishes. Returning its value does not export its name. A different global total can exist without being overwritten by that local assignment. For these examples the inputs are immutable numbers; later, mutable lists will require additional care about shared objects.",
        ],
      },
      {
        title: "Return a value when other code needs to use it",
        paragraphs: [
          "print sends text to output. return supplies a value to the caller and immediately leaves the function. Printing 12 does not give a caller the number 12 to calculate with. A function that reaches its end without return, or uses bare return, returns None.",
          "In the first function below, x is None even though 6 appears on screen. In the second, y receives 6 without printing anything during the call. Statements after an executed return in that body do not run. A function with a conditional return needs every intended result path covered; otherwise some calls may return None.",
        ],
        code: "def show_double(n):\n    print(n * 2)\n\ndef double(n):\n    return n * 2\n\nx = show_double(3)\ny = double(3)\nprint(x, y)",
      },
      {
        title: "Scope: the same spelling can name different bindings",
        paragraphs: [
          "In this example the global value remains 5. The assignment inside increment creates a local binding named value and changes only that binding. The parameter initially receives the number passed by the caller. Returning 6 lets the caller decide whether to store it, print it, or combine it with another value.",
          "Using a local name outside its function normally raises NameError if no outer binding exists. Reading a name before a later local assignment within that function can raise UnboundLocalError. Solve ordinary data flow with parameters and return rather than introducing global mutation.",
        ],
        code: "value = 5\ndef increment(value):\n    value = value + 1\n    return value\n\nresult = increment(value)\nprint(value, result)",
      },
      {
        title: "Decomposition and function composition",
        paragraphs: [
          "Decomposition splits a problem into small operations with clear responsibilities. For a group purchase, one function can compute the subtotal and another can add delivery. Each can be tested with a small input/output example before you combine them. A useful name describes the operation rather than the exact steps used to implement it.",
          "Composition uses one result as another function’s argument. In add_fee(subtotal(4, 3), 2), the inner call must finish to produce 12 before the outer call can receive it, producing 14. You could store the intermediate value in a variable instead; both forms express the same data flow. Prefer the version that is easiest to read.",
        ],
        code: "def subtotal(price, quantity):\n    return price * quantity\n\ndef add_fee(amount, fee):\n    return amount + fee\n\nprint(add_fee(subtotal(4, 3), 2))",
      },
      {
        title: "Design a small contract before writing a body",
        paragraphs: [
          "State the valid inputs and promised output: subtotal accepts a nonnegative unit price and a nonnegative integer quantity and returns their product. Python will not automatically enforce that description. Decide whether your caller guarantees valid inputs or your function should validate them.",
          "Use a loop inside a function when one operation needs repeated work. Initialize the accumulator on each call, loop over the supplied values, then return after the loop. A return inside the body would stop after the first processed item. Functions are useful for one well-defined job, even if they are called only once.",
        ],
      },
    ],
    demonstration: {
      kind: "trace",
      title: "Trace arguments, local state, and a return",
      caption:
        "Follow the highlighted instructions and compare each resulting state.",
      source:
        "def add_fee(amount, fee):\n    total = amount + fee\n    return total\n\nprice = 10\nresult = add_fee(price, 2)\nprint(result)",
      steps: [
        {
          lines: [1],
          explanation:
            "Define add_fee. The body on lines 2–3 does not execute yet.",
          variables: [],
          output: [],
          detail: "Definition · no call yet",
        },
        {
          lines: [5],
          explanation: "Assign global price 10.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
          ],
          output: [],
        },
        {
          lines: [6],
          explanation:
            "Evaluate arguments 10 and 2 and enter add_fee. result is not assigned yet.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
            {
              name: "amount",
              value: 10,
              scope: "add_fee call",
            },
            {
              name: "fee",
              value: 2,
              scope: "add_fee call",
            },
          ],
          output: [],
          detail: "Call · amount ← 10; fee ← 2",
        },
        {
          lines: [2],
          explanation: "In the call, compute local total 12.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
            {
              name: "amount",
              value: 10,
              scope: "add_fee call",
            },
            {
              name: "fee",
              value: 2,
              scope: "add_fee call",
            },
            {
              name: "total",
              value: 12,
              scope: "add_fee call",
            },
          ],
          output: [],
          detail: "Local computation",
        },
        {
          lines: [3],
          explanation:
            "Return the value 12. This call ends; its local bindings leave the active state.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
          ],
          output: [],
          detail: "Return · 12 goes to the caller",
        },
        {
          lines: [6],
          explanation: "Resume the caller and bind the returned 12 to result.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
            {
              name: "result",
              value: 12,
              scope: "global",
            },
          ],
          output: [],
          detail: "Caller resumes · result ← 12",
        },
        {
          lines: [7],
          explanation: "Print the caller’s result.",
          variables: [
            {
              name: "price",
              value: 10,
              scope: "global",
            },
            {
              name: "result",
              value: 12,
              scope: "global",
            },
          ],
          output: ["12"],
        },
      ],
      result: "Arguments 10 and 2 yield returned value 12; output is 12.",
    },
    workedExample: {
      title: "Track a value through a function boundary",
      introduction:
        "The caller and the function use different names for related values.",
      steps: [
        "Execute def to establish add_fee; skip its body until a call occurs.",
        "Bind global price to 10, evaluate add_fee(price, 2), and pass arguments 10 and 2.",
        "Inside the call bind local amount = 10 and fee = 2, then compute local total = 12.",
        "return total supplies 12 and ends the call. The caller assigns 12 to result.",
        "print(result) displays 12. The caller never needs the function’s local total name.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Calculate and return an order total",
      source:
        "def add_fee(amount, fee):\n    total = amount + fee\n    return total\n\nprice = 10\nresult = add_fee(price, 2)\nprint(result)",
      explanation:
        "Output: 12. The function returns a number; the caller chooses to print it. A second call with arguments 20 and 3 would independently return 23.",
    },
    misconceptions: [
      {
        belief: "Writing def runs the function body.",
        correction:
          "The definition establishes the function; a call runs its body.",
      },
      {
        belief: "Parameters and arguments are interchangeable terms.",
        correction:
          "Parameters are definition names; arguments are the values supplied for one call.",
      },
      {
        belief: "print and return both give the caller a result.",
        correction:
          "print displays text. return supplies the call expression’s value. A function without an executed value-return returns None.",
      },
      {
        belief:
          "A local assignment changes any global variable with the same name.",
        correction:
          "Ordinary assignment inside a function creates a local binding. Pass and return values to make changes explicit.",
      },
    ],
    takeaways: [
      "Define a contract, then distinguish definition from execution.",
      "Trace argument values into local parameters and return values back out.",
      "Local bindings belong to each call; returned values can be reused by the caller.",
      "Compose small operations by passing one returned value to another call.",
    ],
    questions: [
      {
        id: "functions-q1",
        prompt: "In def square(n), what is n?",
        options: [
          "An argument value",
          "A parameter name",
          "An output statement",
        ],
        correctIndex: 1,
        explanation:
          "n is a parameter in the definition. In square(4), the value 4 is the argument.",
      },
      {
        id: "functions-q2",
        prompt: "What does a function with no executed return value return?",
        options: ["0", "Its last printed text", "None"],
        correctIndex: 2,
        explanation:
          "Reaching the end of a Python function returns None, regardless of anything it printed.",
      },
      {
        id: "functions-q3",
        prompt: "When does a function body run?",
        options: [
          "When its definition is read",
          "When the function is called",
          "Only when print is used",
        ],
        correctIndex: 1,
        explanation:
          "def establishes the function. A call creates local bindings and executes the body.",
      },
    ],
    exercises: [
      {
        id: "functions-p1",
        prompt: "What values are printed?",
        options: ["5 6", "6 6", "5 5"],
        correctIndex: 0,
        explanation:
          "The parameter value is local. increment returns 6 to result while the global value stays 5.",
        source:
          "value = 5\ndef increment(value):\n    value = value + 1\n    return value\n\nresult = increment(value)\nprint(value, result)",
      },
      {
        id: "functions-p2",
        prompt: "What two lines appear, in order?",
        options: ["6 then 6", "6 then None", "None then 6"],
        correctIndex: 1,
        explanation:
          "show prints 6 during the call but has no return statement. Its result is None, which the outer print then displays.",
        source:
          "def show(n):\n    print(n * 2)\n\nresult = show(3)\nprint(result)",
      },
    ],
    nextStep:
      "You have reached the end of the five-lesson core path. Combine expressions, decisions, loops, and functions in a small program, such as a study-session summary. Recursion and Basic Debugging remain planned previews; Programming Fundamentals as a whole is still growing.",
  },
};
