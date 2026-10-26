export const linkedListSolutions: Record<string, string> = {
  "linked-traverse":
    "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef collect_values(head):\n    result = []\n    current = head\n    while current is not None:\n        result.append(current.value)\n        current = current.next\n    return result",
  "linked-search":
    "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef find_first(head, target):\n    current = head\n    while current is not None:\n        if current.value == target:\n            return current\n        current = current.next\n    return None",
  "linked-prepend":
    "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef prepend(head, value):\n    new = Node(value)\n    new.next = head\n    return new",
  "linked-append":
    "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef append(head, value):\n    new = Node(value)\n    if head is None:\n        return new\n    current = head\n    while current.next is not None:\n        current = current.next\n    current.next = new\n    return head",
  "linked-remove":
    "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef remove_first(head, target):\n    previous, current = None, head\n    while current is not None:\n        if current.value == target:\n            if previous is None:\n                return current.next\n            previous.next = current.next\n            return head\n        previous, current = current, current.next\n    return head",
};
