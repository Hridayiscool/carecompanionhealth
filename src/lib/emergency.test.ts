import { describe, expect, it } from "vitest";
import { isEmergency } from "./emergency";

describe("isEmergency", () => {
  it("flags chest pain", () => expect(isEmergency("I have chest pain")).toBe(true));
  it("flags stroke signs", () => expect(isEmergency("face drooping and slurred speech")).toBe(true));
  it("flags Arabic chest pain", () => expect(isEmergency("ألم في الصدر")).toBe(true));
  it("does not flag a normal condition", () => expect(isEmergency("type 2 diabetes")).toBe(false));
});
