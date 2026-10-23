import type { Assessment } from "./types";
export const fundamentalsAssessment: Assessment = {
  id: "programming-fundamentals-v1",
  title: "Programming Fundamentals Assessment",
  questions: [
    {
      id: "fundamentals-expression",
      topicIds: ["variables-data-types", "operators-expressions"],
      source: `price = 4
quantity = 3
total = price * quantity + 2
quantity = 5
print(total)`,
      prompt: "What is printed after quantity changes?",
      options: ["22", "14", "60"],
      correctIndex: 1,
      explanation:
        "Multiplication precedes addition, so total is assigned 12 + 2 = 14. Reassigning quantity does not recalculate total; 22 assumes a live formula. 60 multiplies unrelated stored values.",
    },
    {
      id: "fundamentals-boolean",
      topicIds: ["operators-expressions", "conditionals"],
      source: `age = 18
has_ticket = False
print(age >= 18 and has_ticket)`,
      prompt: "What does the expression print?",
      options: ["True", "18", "False"],
      correctIndex: 2,
      explanation:
        "age >= 18 is True, but both sides of and must be true; has_ticket is False, so this expression yields False. True ignores the ticket requirement; 18 is the age value, not the result here.",
    },
    {
      id: "fundamentals-branch",
      topicIds: ["conditionals", "operators-expressions"],
      source: `score = 80
if score >= 80:
    grade = "A"
elif score >= 60:
    grade = "B"
else:
    grade = "C"
print(grade)`,
      prompt: "Which grade is printed at the boundary?",
      options: ["A", "B", "A then B"],
      correctIndex: 0,
      explanation:
        "80 satisfies >= 80, so the first branch assigns A. The elif is skipped even though its comparison would also be true; the chain selects one branch, not both.",
    },
    {
      id: "fundamentals-loop",
      topicIds: ["loops", "operators-expressions"],
      source: `total = 0
for number in range(1, 4):
    if number > 1:
        total = total + number
print(total)`,
      prompt: "What is the final total?",
      options: ["6", "5", "9"],
      correctIndex: 1,
      explanation:
        "range supplies 1, 2, and 3. The condition skips 1, so total becomes 2 then 5. Six includes the skipped 1; nine also includes the excluded stop 4.",
    },
    {
      id: "fundamentals-while",
      topicIds: ["loops", "conditionals"],
      source: `attempts = 0
while attempts < 3:
    attempts = attempts + 1
print(attempts)`,
      prompt: "How many loop-body executions occur and what is printed?",
      options: [
        "2 executions, prints 2",
        "4 executions, prints 4",
        "3 executions, prints 3",
      ],
      correctIndex: 2,
      explanation:
        "The tests at 0, 1, and 2 are True; each is followed by one increment. The test at 3 is False, so there are three executions and the stored value is 3. Two stops early; four includes an iteration after the condition is False.",
    },
    {
      id: "fundamentals-local",
      topicIds: ["functions", "variables-data-types"],
      source: `def increase(value):
    value = value + 1
    return value

value = 4
result = increase(value)
print(value, result)`,
      prompt: "What does the caller print?",
      options: ["4 5", "5 5", "4 None"],
      correctIndex: 0,
      explanation:
        "The function rebinds its local parameter and returns 5. The caller's value remains 4 and result receives 5. '5 5' confuses local and caller bindings; None ignores the explicit return.",
    },
    {
      id: "fundamentals-composition",
      topicIds: ["functions", "loops", "conditionals"],
      source: `def bonus(number):
    if number >= 2:
        return number + 1
    return number

total = 0
for number in range(3):
    total = total + bonus(number)
print(total)`,
      prompt: "What total is printed after the function calls in the loop?",
      options: ["3", "6", "4"],
      correctIndex: 2,
      explanation:
        "range(3) supplies 0, 1, 2. The returned values are 0, 1, and 3, adding to 4. Three omits the bonus on 2; six adds a bonus to every item despite the condition.",
    },
    {
      id: "fundamentals-recursive-return",
      topicIds: ["recursion", "functions"],
      source: `def sum_down(n):
    if n == 0:
        return 0
    rest = sum_down(n - 1)
    return n + rest

print(sum_down(3))`,
      prompt:
        "Which return sequence goes from the base case back to the original caller?",
      options: ["3, 2, 1, 0", "0, 1, 3, 6", "0, 1, 2, 3"],
      correctIndex: 1,
      explanation:
        "The base returns 0. Waiting calls then return 1 + 0 = 1, 2 + 1 = 3, and 3 + 3 = 6. Descending arguments are 3, 2, 1, 0, not return values; 0, 1, 2, 3 ignores addition to the child's result.",
    },
    {
      id: "fundamentals-recursive-depth",
      topicIds: ["recursion", "functions"],
      source: `def count_down(n):
    if n == 0:
        return 0
    return count_down(n - 1)

print(count_down(2))`,
      prompt:
        "At the base case, how many count_down frames exist, and what is n in the oldest one?",
      options: [
        "3 frames; oldest n is 2",
        "2 frames; oldest n is 0",
        "1 frame; oldest n is 0",
      ],
      correctIndex: 0,
      explanation:
        "The invocations for 2, 1, and 0 coexist. The oldest keeps n = 2. Two forgets the base frame and changes the caller's n; one assumes all invocations share a context.",
    },
    {
      id: "fundamentals-debug-return",
      topicIds: ["debugging", "functions"],
      source: `def double(number):
    answer = number * 2
    print(answer)

result = double(3)
print(result)`,
      prompt:
        "The current output is 6 then None. Which change makes result hold 6?",
      options: [
        "Remove print(result)",
        "Replace print(answer) with return answer",
        "Set number to 6 before the call",
      ],
      correctIndex: 1,
      explanation:
        "Returning answer passes 6 to the assignment. Removing the caller's print hides the None without fixing result. Changing the input changes the computed number but the function still falls through and returns None.",
    },
    {
      id: "fundamentals-edge",
      topicIds: ["debugging", "loops", "operators-expressions"],
      source: `def sum_through(limit):
    total = 0
    for number in range(1, limit):
        total = total + number
    return total`,
      prompt:
        "Requirement: sum 1 through a nonnegative integer limit, including limit. Which fix and boundary test address the cause?",
      options: [
        "Add 3 to total; only test limit 3",
        "Use range(1, limit + 1); test limit 1 returns 1",
        "Return limit; test limit 1 returns 1",
      ],
      correctIndex: 1,
      explanation:
        "The exclusive stop omits limit; adding one to the stop includes it. Testing 1 exposes the originally empty loop. Adding 3 only masks a particular input. Returning limit passes 1 by coincidence but fails 3, whose sum is 6; also retain limit 0 → 0 and 3 → 6.",
    },
    {
      id: "fundamentals-game",
      topicIds: ["debugging", "loops", "conditionals", "functions"],
      source: `def last_attempt(guess, target, attempts, limit):
    if attempts == limit:
        return "lost"
    if guess == target:
        return "won"
    return "continue"

print(last_attempt(7, 7, 3, 3))`,
      prompt:
        "Rule: the final allowed guess can win. Which observation and focused fix are correct?",
      options: [
        "It prints won; no fix needed",
        "It raises a syntax error; delete the function",
        "It prints lost; check a correct allowed guess before reporting loss",
      ],
      correctIndex: 2,
      explanation:
        "The first return prevents the success test from running. For this helper the contract is an already processed allowed attempt, with 1 <= attempts <= limit. Check equality with the target before loss at the limit. It is valid syntax but wrong behavior. The full game must separately prevent starting guesses beyond the limit.",
    },
  ],
};
export const assessments = [fundamentalsAssessment];
