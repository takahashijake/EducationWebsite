/** Repository-authored Python references for local and browser validation. */
export const sortingSolutions: Record<string, string> = {
  "sorting-bubble":
    "def bubble_sort(values):\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end):\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n                changed = True\n        if not changed:\n            break\n    return values",
  "sorting-selection":
    "def selection_sort(values):\n    for i in range(len(values) - 1):\n        minimum = i\n        for j in range(i + 1, len(values)):\n            if values[j] < values[minimum]:\n                minimum = j\n        if minimum != i:\n            values[i], values[minimum] = values[minimum], values[i]\n    return values",
  "sorting-insertion":
    "def insertion_sort(values):\n    for i in range(1, len(values)):\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] > key:\n            values[j + 1] = values[j]\n            j -= 1\n        if j + 1 != i:\n            values[j + 1] = key\n    return values",
  "sorting-bubble-boundary":
    "def repair_bubble(values):\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end):\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n                changed = True\n        if not changed:\n            break\n    return values",
  "sorting-insertion-stability":
    "def stable_insertion(values):\n    for i in range(1, len(values)):\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] > key:\n            values[j + 1] = values[j]\n            j -= 1\n        if j + 1 != i:\n            values[j + 1] = key\n    return values",
};
