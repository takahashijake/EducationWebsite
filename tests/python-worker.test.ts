import { readFileSync } from "node:fs";
import vm from "node:vm";
import { TextDecoder, TextEncoder } from "node:util";
import { expect, it } from "vitest";

it("streams flushed Python output before termination, preserving split UTF-8 and bounded prefixes", () => {
  const messages: { type: string; channel?: string; text?: string }[] = [];
  const context = vm.createContext({
    TextDecoder,
    self: { postMessage: (m: (typeof messages)[number]) => messages.push(m) },
  });
  vm.runInContext(readFileSync("public/python-worker.js", "utf8"), context);
  const capture = (channel: string, text: Uint8Array) => {
    context.channel = channel;
    context.bytes = text;
    vm.runInContext("capture(channel, bytes)", context);
  };
  const encoder = new TextEncoder();
  capture("stdout", encoder.encode("before loop\n"));
  capture("stderr", encoder.encode("diagnostic\n"));
  expect(messages.filter((m) => m.type === "output")).toEqual([
    expect.objectContaining({ channel: "stdout", text: "before loop\n" }),
    expect.objectContaining({ channel: "stderr", text: "diagnostic\n" }),
  ]);
  messages.length = 0;
  const unicode = encoder.encode("🙂");
  capture("stdout", unicode.slice(0, 2));
  expect(messages).toEqual([]);
  capture("stdout", unicode.slice(2));
  expect(messages).toEqual([expect.objectContaining({ text: "🙂" })]);
  messages.length = 0;
  vm.runInContext("used = 0; limit = 4", context);
  capture("stdout", encoder.encode("abcdef"));
  capture("stdout", encoder.encode("later"));
  expect(messages.filter((m) => m.type === "output-limit")).toHaveLength(1);
  expect(messages.filter((m) => m.type === "output")).toEqual([
    expect.objectContaining({ text: "abcd" }),
  ]);
});
