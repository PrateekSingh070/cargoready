import { expect, test, type Page } from "@playwright/test";

async function expectPageToFit(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

test("completes Module 1 and unlocks Module 2", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start training" }).click();
  await page
    .getByRole("textbox", { name: "Display name" })
    .fill("Smoke Learner");
  await page.getByRole("button", { name: "Skip tour" }).click();
  await expectPageToFit(page);
  await page.getByRole("link", { name: "Open Module 1" }).click();

  await expect(
    page.getByRole("heading", { name: "Meet the nine hazard classes" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark field guide as read" }).click();
  await page.getByRole("link", { name: "Next lesson" }).click();

  await page
    .getByRole("button", { name: /flag the aerosol for review/i })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("button", { name: /share the original description/i })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Your path" })).toBeVisible();
  await page.getByRole("link", { name: "Next lesson" }).click();

  await page.getByText("Match without dragging", { exact: true }).click();
  for (const [item, bin] of [
    ["aerosol-spray-paint", "gases"],
    ["flammable-paint-thinner", "liquids"],
    ["dry-ice", "miscellaneous"],
  ]) {
    await page.getByLabel("Item", { exact: true }).selectOption(item!);
    await page.getByLabel("Bin", { exact: true }).selectOption(bin!);
    await page.getByRole("button", { name: "Check match" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "All cargo sorted" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Next lesson" }).click();

  await page.getByRole("button", { name: "Start quiz" }).click();
  for (const [index, option] of [
    "Nine",
    "Class 2 · Gases",
    "Class 9 · Miscellaneous dangerous goods",
    "Rechargeable handheld scanners",
  ].entries()) {
    await page.getByRole("radio", { name: option, exact: true }).check();
    await page.getByRole("button", { name: "Check answer" }).click();
    if (index === 0) {
      await page.reload();
      await expect(page.getByRole("radio", { name: /Nine/ })).toBeChecked();
      await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    }
    await page
      .getByRole("button", {
        name: index === 3 ? "See results" : "Next question",
      })
      .click();
  }
  const celebration = page.getByRole("dialog", { name: "Level 2 reached" });
  await expect(celebration).toBeVisible();
  await celebration.getByRole("button", { name: "Continue training" }).click();
  await expect(
    page.getByRole("heading", { name: "Knowledge check passed" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to course" }).click();
  await expect(
    page.getByText("Module completed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Module 2" })).toBeVisible();
  await expectPageToFit(page);

  await page.getByRole("link", { name: "Trainer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Trainer dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Completion by module" }),
  ).toBeVisible();
  const learner = page.getByRole("row", { name: /Smoke Learner/ });
  await expect(learner).toContainText("This device");
  await expect(learner).toContainText("100%");
  await expectPageToFit(page);
});
