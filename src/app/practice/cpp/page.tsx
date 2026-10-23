import type { Metadata } from "next";
import { CppPracticeCollection } from "@/components/cpp-practice";
export const metadata: Metadata = {
  title: "Guided C++ practice",
  description:
    "Apply programming fundamentals with eight executable C++ exercises.",
};
export default function CppPracticePage() {
  return <CppPracticeCollection />;
}
