import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { availableTopics, topics } from "@/content/curriculum";

it("keeps current README lesson counts and reading example aligned with the curriculum", () => {
  const readme = readFileSync("README.md", "utf8");
  const published = availableTopics.length;
  const planned = topics.length - published;
  expect(readme).toContain(
    `${published} published lessons and ${planned} planned previews`,
  );
  expect(readme).toContain(`published lessons / **${published}**`);
  expect(readme).toContain(
    `3/${published} globally (${Math.round((3 / published) * 100)}%)`,
  );
  expect(readme).toContain(`all ${published} published lessons`);
  expect(readme).toContain(
    `- ${published} published lessons and one project; ${planned} broader CS topics remain planned.`,
  );
});
